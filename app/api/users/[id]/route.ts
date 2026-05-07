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

    const body = await req.json()
    const { name, role, isActive } = body

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        role,
        isActive: isActive !== undefined ? isActive : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    })

    await logAction({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "UPDATE",
      module: "USERS",
      description: `Updated user ${user.email} (role: ${role}, active: ${isActive})`,
      req
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (session.user.id === params.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await prisma.user.delete({ where: { id: params.id } })

    await logAction({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "DELETE",
      module: "USERS",
      description: `Deleted user ${user.email}`,
      req
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
