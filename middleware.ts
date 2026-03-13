import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware Next.js pour :
 * 1. Rafraîchir la session Supabase à chaque requête
 * 2. Protéger les routes /dashboard (redirection vers /login si non connecté)
 * 3. Rediriger vers /dashboard si déjà connecté et sur /login ou /register
 * 4. Nettoyer les tokens invalides/expirés automatiquement
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Rafraîchir la session — gestion des tokens invalides
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // Token invalide ou expiré → nettoyer la session
      console.warn('[Middleware] Auth error, clearing session:', error.message);
      await supabase.auth.signOut();
      
      // Supprimer tous les cookies Supabase
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.includes('supabase') || cookie.name.startsWith('sb-')) {
          response.cookies.delete(cookie.name);
        }
      });
    } else {
      user = data.user;
    }
  } catch (e) {
    // Erreur inattendue → nettoyer les cookies Supabase
    console.error('[Middleware] Unexpected auth error:', e);
    request.cookies.getAll().forEach((cookie) => {
      if (cookie.name.includes('supabase') || cookie.name.startsWith('sb-')) {
        response.cookies.delete(cookie.name);
      }
    });
  }

  const { pathname } = request.nextUrl;

  // Protéger /dashboard : rediriger vers /login si non connecté
  if (pathname.startsWith('/dashboard') && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Rediriger vers /dashboard si déjà connecté et sur /login ou /register
  if ((pathname === '/login' || pathname === '/register') && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
};
