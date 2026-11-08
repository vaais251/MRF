import type { Role } from "@prisma/client"

export const PARTICIPANT_PAGE_ROLES = ["SUPER_ADMIN", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"]

export function requireRole(allowedRoles: Role[], userRole: Role | string): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole as Role)
}
