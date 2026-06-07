import { NextRequest, NextResponse } from 'next/server';

const ONBOARDING_PATHS = [
  '/onboarding',
  '/onboarding/profile',
  '/onboarding/workspace',
  '/onboarding/team',
  '/onboarding/connect',
  '/onboarding/agents',
  '/onboarding/first_run',
  '/onboarding/finish',
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Only guard app routes, not static or API
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) return NextResponse.next();

  // Simulate userId (replace with real auth logic)
  const userId = req.cookies.get('userId')?.value || 'currentUser';
  let state = 'profile';
  try {
    const apiUrl = `${req.nextUrl.origin}/api/onboarding/state?userId=${userId}`;
    const resp = await fetch(apiUrl);
    if (resp.ok) {
      const data = await resp.json();
      state = data.state || 'profile';
    }
  } catch (e) {
    // fallback: block app if onboarding state unknown
    state = 'profile';
  }

  // If not done, block all except onboarding paths
  if (state !== 'done' && !ONBOARDING_PATHS.some(p => pathname.startsWith(p))) {
    const url = req.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }

  // If onboarding is done, block onboarding routes
  if (state === 'done' && ONBOARDING_PATHS.some(p => pathname.startsWith(p))) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|static|favicon.ico).*)'],
};
