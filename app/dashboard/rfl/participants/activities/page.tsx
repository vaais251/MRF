import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PARTICIPANT_PAGE_ROLES } from "@/lib/rbac"
import { redirect } from "next/navigation"
import { ParticipantsTabs } from "../ParticipantsTabs"
import ActivitiesClient from "./ActivitiesClient"

export const metadata = {
  title: 'Activities | MRT M&E System'
}

const MANAGE_ROLES = ["SUPER_ADMIN", "RFL_COORDINATOR"]

export default async function ActivitiesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  const canManage = MANAGE_ROLES.includes(session.user.role)

  return (
    <div className="space-y-6">
      <ParticipantsTabs active="activities" canViewParticipants={PARTICIPANT_PAGE_ROLES.includes(session.user.role)} />
      <ActivitiesClient canManage={canManage} />
    </div>
  )
}
