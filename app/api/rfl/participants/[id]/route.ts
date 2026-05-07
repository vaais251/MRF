import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED_ROLES = ["SUPER_ADMIN", "TRUST_MGMT", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"]
const WRITE_ROLES = ["SUPER_ADMIN", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"]

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const participant = await prisma.rFLParticipant.findUnique({
      where: { id: params.id },
      include: {
        mentorships: {
          orderBy: { sessionDate: 'desc' }
        }
      }
    })

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 })
    }

    return NextResponse.json(participant)
  } catch (error) {
    console.error("Error fetching participant:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, program, institute, startYear, endYear, currentSemester, academicResults, status } = body

    const participant = await prisma.rFLParticipant.update({
      where: { id: params.id },
      data: {
        name,
        program,
        institute,
        startYear: startYear ? parseInt(startYear) : undefined,
        endYear: endYear ? parseInt(endYear) : undefined,
        currentSemester: currentSemester ? parseInt(currentSemester) : undefined,
        academicResults,
        status
      }
    })

    return NextResponse.json(participant)
  } catch (error) {
    console.error("Error updating participant:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role === "SUPER_ADMIN") {
      // Hard delete
      await prisma.rFLMentorship.deleteMany({ where: { participantId: params.id } })
      await prisma.rFLParticipant.delete({ where: { id: params.id } })
      return NextResponse.json({ success: true })
    } else {
      // Soft concept: set status to DROPPED
      const participant = await prisma.rFLParticipant.update({
        where: { id: params.id },
        data: { status: "DROPPED" }
      })
      return NextResponse.json(participant)
    }
  } catch (error) {
    console.error("Error deleting participant:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
