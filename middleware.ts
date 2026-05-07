import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

const roleRouteMap: Record<string, string[]> = {
  '/dashboard/users': ['SUPER_ADMIN'],
  '/dashboard/reports': ['SUPER_ADMIN', 'TRUST_MGMT', 'PROGRAM_MANAGER', 'MEO_OFFICER'],
  '/dashboard/rfl': ['SUPER_ADMIN', 'TRUST_MGMT', 'PROGRAM_MANAGER', 'MEO_OFFICER', 'RFL_COORDINATOR'],
  '/dashboard/rfl/participants': ['SUPER_ADMIN', 'PROGRAM_MANAGER', 'MEO_OFFICER', 'RFL_COORDINATOR'],
  '/dashboard/rfl/mentorship': ['SUPER_ADMIN', 'PROGRAM_MANAGER', 'MEO_OFFICER', 'RFL_COORDINATOR'],
  '/dashboard/rfl/alumni': ['SUPER_ADMIN', 'PROGRAM_MANAGER', 'MEO_OFFICER', 'RFL_COORDINATOR'],
  '/dashboard/rfl/sponsorships': ['SUPER_ADMIN', 'PROGRAM_MANAGER', 'MEO_OFFICER', 'RFL_COORDINATOR'],
  '/dashboard/mrhss': ['SUPER_ADMIN', 'PROGRAM_MANAGER', 'MEO_OFFICER', 'SCHOOL_AUTHORITY'],
  '/dashboard/mra': ['SUPER_ADMIN', 'PROGRAM_MANAGER', 'MEO_OFFICER', 'HOSTEL_INCHARGE'],
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const userRole = token.role as string

    // Check strict matching first, then check prefixes
    let requiredRoles: string[] | undefined

    if (roleRouteMap[path]) {
      requiredRoles = roleRouteMap[path]
    } else {
      // Find the most specific prefix match
      const matchingPrefix = Object.keys(roleRouteMap)
        .filter(prefix => path.startsWith(prefix))
        .sort((a, b) => b.length - a.length)[0]
      
      if (matchingPrefix) {
        requiredRoles = roleRouteMap[matchingPrefix]
      }
    }

    if (requiredRoles && !requiredRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: ['/dashboard/:path*']
}
