import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: "UPDATE",
        module: "SYSTEM",
        description: "Updated profile name",
      }
    })

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
