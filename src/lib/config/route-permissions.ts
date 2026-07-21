// Single source of truth for route -> required role mapping.
// Used by BOTH the sidebar menu (UI filtering) and middleware.ts (URL access guard)
// so menu visibility and direct-URL access can never diverge.
//
// `roles: null`  -> accessible to any authenticated user (everyone)
// `roles: 'x'`   -> requires the single role 'x'
// `roles: [...] ` -> requires ANY one of the listed roles

export type RequiredRole = string | string[] | null

export interface RoutePermissionRule {
  path: string
  roles: RequiredRole
}

export const routePermissions: RoutePermissionRule[] = [
  { path: '/dashboard/users', roles: 'admin' },
  { path: '/dashboard/roles', roles: 'admin' },
  { path: '/dashboard/lessons', roles: 'admin' },
  { path: '/dashboard/students', roles: 'admin' },
  { path: '/dashboard/masters', roles: 'admin' },
  { path: '/dashboard/optimizedClasses', roles: 'admin' },
  { path: '/dashboard/optimizedNumbers/add', roles: ['admin', 'master'] },
  { path: '/dashboard/optimizedNumbers', roles: ['admin', 'master'] },
  { path: '/dashboard/applicants', roles: 'admin' },
  { path: '/dashboard/week-absents', roles: 'admin' },
  { path: '/dashboard/leaves/new', roles: null },
  { path: '/dashboard/waiting-morakhasi', roles: 'admin' },
  { path: '/dashboard/guard', roles: ['admin', 'guard'] },
  {
    path: '/dashboard/juz',
    roles: ['admin', 'amoozeshi_deputy', 'ejraee_deputy', 'supervisor'],
  },
  { path: '/dashboard/reports', roles: 'admin' },
  { path: '/dashboard/degrees', roles: 'admin' },
  { path: '/dashboard/printable-forms', roles: 'admin' },
]

// Returns the required roles for a given pathname, using the most specific
// (longest) prefix rule. Returns null when no rule matches (everyone allowed).
export function getRequiredRoles(pathname: string): RequiredRole {
  const matched = routePermissions
    .filter(
      (rule) => pathname === rule.path || pathname.startsWith(rule.path + '/'),
    )
    .sort((a, b) => b.path.length - a.path.length)

  return matched.length > 0 ? matched[0].roles : null
}

// True when the user's roles satisfy the required roles.
export function hasRole(userRoles: string[], required: RequiredRole): boolean {
  if (required === null) return true
  if (Array.isArray(required)) return required.some((r) => userRoles.includes(r))
  return userRoles.includes(required)
}
