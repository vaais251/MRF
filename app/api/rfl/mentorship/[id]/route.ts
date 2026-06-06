import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const WRITE_ROLES = ["SUPER_ADMIN", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"]

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { participantId, mentorName, sessionType, sessionDate, targetAudience, notes, images } = body

    const sessionData = await prisma.rFLMentorship.update({
      where: { id: params.id },
      data: {
        participantId: participantId === undefined ? undefined : (participantId || null),
        mentorName,
        sessionType,
        sessionDate: sessionDate ? new Date(sessionDate) : undefined,
        targetAudience,
        notes,
        images: Array.isArray(images) ? images : undefined
      }
    })

    return NextResponse.json(sessionData)
  } catch (error) {
    console.error("Error updating mentorship:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.rFLMentorship.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting mentorship:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
