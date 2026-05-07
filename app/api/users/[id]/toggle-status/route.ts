import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (session.user.id === user.id) {
      return NextResponse.json({ error: "Cannot toggle your own status" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true, email: true }
    })

    await logAction({
      userId: session.user.id,
      userEmail: session.user.email ?? "",
      action: "UPDATE",
      module: "USERS",
      description: `Toggled user ${user.email} status to ${updatedUser.isActive ? 'ACTIVE' : 'INACTIVE'}`,
      req
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error toggling user status:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
