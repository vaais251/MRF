import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["SUPER_ADMIN", "TRUST_MGMT", "PROGRAM_MANAGER", "MEO_OFFICER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const mentorships = await prisma.rFLMentorship.findMany({
      include: {
        participant: {
          select: { name: true, program: true }
        }
      },
      orderBy: { sessionDate: "desc" }
    })

    // Flatten data for easier export
    const flatData = mentorships.map(m => ({
      id: m.id,
      participantName: m.participant.name,
      participantProgram: m.participant.program,
      mentorName: m.mentorName,
      sessionType: m.sessionType,
      sessionDate: m.sessionDate,
      targetAudience: m.targetAudience,
      notes: m.notes
    }))

    await logAction({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "EXPORT",
      module: "REPORTS",
      description: "Generated Mentorship Activity Report",
      req
    })

    return NextResponse.json(flatData)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
