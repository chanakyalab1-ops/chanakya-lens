import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isReviewRoute = request.nextUrl.pathname.startsWith('/review');
  const isLoginRoute = request.nextUrl.pathname === '/review/login';
  const ALLOWED_ADMIN_EMAILS = ['chanakya.lab1@gmail.com'];
  const isAuthorized = user && ALLOWED_ADMIN_EMAILS.includes(user.email ?? '');
    if (isReviewRoute && !isLoginRoute && !isAuthorized) {
    const url = request.nextUrl.clone();
    url.pathname = '/review/login';
    return NextResponse.redirect(url);
  }

      if (isLoginRoute && isAuthorized) {
    const url = request.nextUrl.clone();
    url.pathname = '/review';
    return NextResponse.redirect(url);
  }

  return response;
}