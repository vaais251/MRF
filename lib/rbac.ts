import type { Role } from "@prisma/client"

export const RFL_WRITE_ROLES = ["SUPER_ADMIN", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"]
export const PARTICIPANT_PAGE_ROLES = [...RFL_WRITE_ROLES, "TRUST_MGMT"]
export const MENTORSHIP_PAGE_ROLES = [...RFL_WRITE_ROLES, "TRUST_MGMT"]

export function requireRole(allowedRoles: Role[], userRole: Role | string): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole as Role)
}
