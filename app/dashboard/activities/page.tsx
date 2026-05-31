import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
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

  return <ActivitiesClient canManage={canManage} />
}
