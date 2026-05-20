import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of public routes that don't require authentication
const publicRoutes = ['/', '/auth/login', '/auth/adminlogin', '/auth/register', '/registeration/']

// List of admin-only routes
const adminRoutes = ['/dashboard/roles']

interface AppRole {
  name: string;
  [key: string]: unknown;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('access_token')
  const appRoles = request.cookies.get('app_roles')

  // Always allow static assets from `public/` and any file-based route.
  if (pathname.match(/\.[a-zA-Z0-9]+$/)) {
    return NextResponse.next()
  }

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') return pathname === '/'
    return pathname.startsWith(route)
  })

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

  // Check if the route requires admin access
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  if (isAdminRoute) {
    // Parse app roles from cookie
    const roles = appRoles ? JSON.parse(decodeURIComponent(appRoles.value)) as AppRole[] : []
    const isAdmin = roles.some((role) => role.name === 'admin')

    if (!isAdmin) {
      // Redirect to dashboard if user is not admin   
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
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
    '/((?!api|_next/static|_next/image|.*\\..*$).*)',
  ],
}
