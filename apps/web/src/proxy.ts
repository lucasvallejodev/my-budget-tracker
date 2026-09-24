import { type NextRequest, NextResponse } from 'next/server';

const SessionCookieNames = ['__Host-ck_session', 'ck_session'];
const PublicPaths = ['/sign-in', '/sign-up'];
const SIGN_IN_PATH = '/sign-in';

const hasSessionCookie = (request: NextRequest): boolean =>
  SessionCookieNames.some(name => request.cookies.has(name));

const isPublic = (pathname: string): boolean =>
  PublicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublic(pathname) || hasSessionCookie(request)) return NextResponse.next();

  const signIn = new URL(SIGN_IN_PATH, request.url);

  if (pathname !== '/') signIn.searchParams.set('next', `${pathname}${search}`);

  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: [
    '/((?!api/|_next/|favicon.ico|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
