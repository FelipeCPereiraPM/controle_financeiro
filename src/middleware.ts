import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Ler todos os cookies da requisição
  const allCookies = request.cookies.getAll();
  
  // Buscar se existe algum cookie de sessão do Supabase (iniciando com sb- e terminando em -auth-token)
  const hasSession = allCookies.some(cookie => 
    cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  const isLoginPage = request.nextUrl.pathname === '/login';

  // Se não houver sessão ativa e o usuário tentar acessar uma página interna, manda para /login
  if (!hasSession && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se houver sessão ativa e o usuário tentar entrar na tela de login, manda para a home /
  if (hasSession && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configurar rotas que passam pelo middleware (todas exceto recursos estáticos e APIs)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
