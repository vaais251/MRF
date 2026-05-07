import { prisma } from "@/lib/prisma"
import UsersClient from "./UsersClient"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/unauthorized")
  }

  const [totalUsers, activeUsers, roleDistributionRaw] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.groupBy({
      by: ['role'],
      _count: true
    })
  ])

  // Process role distribution for mini bar chart
  const roleDistribution = roleDistributionRaw.map(r => ({
    role: r.role,
    count: r._count
  }))

  const stats = {
    totalUsers,
    activeSessions: "--", // Placeholder
    activeUsers,
    roleDistribution
  }

  return <UsersClient stats={stats} />
}
