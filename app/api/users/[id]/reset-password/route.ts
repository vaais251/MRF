import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"
import { logAction } from "@/lib/audit"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { password } = body

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: params.id },
      data: { password: hashedPassword }
    })

    // Create a notification for the user
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Password Reset",
        message: "Your password was recently reset by a Super Admin.",
        type: "WARNING"
      }
    })

    await logAction({
      userId: session.user.id,
      userEmail: session.user.email ?? "",
      action: "UPDATE",
      module: "USERS",
      description: `Reset password for user ${user.email}`,
      req
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
