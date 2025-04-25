import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of public routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('access_token')

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // If the route is public, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // If there's no access token and the route is not public, redirect to login
  if (!accessToken) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 