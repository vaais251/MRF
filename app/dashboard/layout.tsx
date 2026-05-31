import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardShell } from "@/components/DashboardShell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Image is read from the DB (not the session cookie) to keep the cookie small.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true },
  })

  return (
    <DashboardShell session={session} userImage={dbUser?.image ?? null}>
      {children}
    </DashboardShell>
  )
}
