import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Obter o cookie de autenticação do Supabase
  // O Supabase armazena a sessão sob um cookie com prefixo sb-
  const allCookies = request.cookies.getAll();
  const hasSession = allCookies.some(cookie => 
    cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
  );

  const isLoginPage = request.nextUrl.pathname === '/login';

  // Se o usuário não tem sessão ativa e tenta acessar qualquer página interna
  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se o usuário tem sessão ativa e tenta entrar na tela de login, manda de volta para home
  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configurar rotas que passam pelo middleware (todas exceto recursos estáticos)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
