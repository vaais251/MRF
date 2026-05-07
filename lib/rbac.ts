import { Role } from "@prisma/client"

export function requireRole(allowedRoles: Role[], userRole: Role | string): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole as Role)
}
