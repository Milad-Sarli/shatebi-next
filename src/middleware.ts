import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getRequiredRoles, hasRole } from '@/lib/config/route-permissions'

// List of public routes that don't require authentication
const publicRoutes = ['/', '/auth/login', '/auth/adminlogin', '/auth/register', '/registeration/', '/tenant/']

interface AppRole {
  name: string;
  [key: string]: unknown;
}

// Parse the app_roles cookie (set on login) into a list of role names.
function getUserRoles(request: NextRequest): string[] {
  const appRoles = request.cookies.get('app_roles')
  if (!appRoles) return []
  try {
    const roles = JSON.parse(decodeURIComponent(appRoles.value)) as AppRole[]
    return roles.map((role) => role.name)
  } catch {
    return []
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get('access_token')

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
    // If user is already authenticated and trying to access auth pages, redirect to dashboard
    if (accessToken && pathname.startsWith('/auth/')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // If there's no access token and the route is not public, redirect to login
  if (!accessToken) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based access control: block direct URL access to pages the user's
  // roles are not allowed to see (menu is only a cosmetic filter otherwise).
  const requiredRoles = getRequiredRoles(pathname)
  if (requiredRoles !== null && !hasRole(getUserRoles(request), requiredRoles)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
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
