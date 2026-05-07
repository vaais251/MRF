import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notification = await prisma.notification.updateMany({
      where: { id: params.id, userId: session.user.id },
      data: { isRead: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating notification:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
