import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As variáveis de ambiente do Supabase estão ausentes no arquivo .env.local');
}

// Inicializar o cliente com persistência em localStorage e sincronização ativa por Cookies para o Middleware
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Escutar mudanças de autenticação no navegador e gravar/remover cookies para o Middleware do servidor
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    const nomeCookie = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
    
    if (event === 'SIGNED_IN' && session) {
      // Gravar o token de autenticação em formato JSON estruturado compatível com o Supabase SSR
      const tokenData = [
        session.access_token,
        session.refresh_token,
        session.provider_token,
        session.provider_refresh_token
      ];
      // Salva o cookie válido por 7 dias
      document.cookie = `${nomeCookie}=${encodeURIComponent(JSON.stringify(tokenData))}; path=/; max-age=604800; SameSite=Lax; Secure`;
    } else if (event === 'SIGNED_OUT') {
      // Remover o cookie de sessão limpando o tempo de vida
      document.cookie = `${nomeCookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure`;
    }
  });
}
