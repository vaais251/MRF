import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PARTICIPANT_PAGE_ROLES, RFL_WRITE_ROLES } from "@/lib/rbac"
import { participantSummarySelect, participantAdmissionSelect } from "@/lib/participant-select"
import { createParticipantReport, reportFilename } from "@/lib/individual-report"
import { logAction } from "@/lib/audit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!PARTICIPANT_PAGE_ROLES.includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const participant = await prisma.rFLParticipant.findUnique({
      where: { id: params.id },
      select: {
        ...participantSummarySelect,
        ...(RFL_WRITE_ROLES.includes(session.user.role) ? participantAdmissionSelect : {}),
        mentorships: { orderBy: { sessionDate: "desc" } },
      },
    })
    if (!participant) return NextResponse.json({ error: "Participant not found" }, { status: 404 })
    const activities = await prisma.activity.findMany({ where: { participantId: params.id }, orderBy: { date: "desc" } })
    const pdf = createParticipantReport({ ...participant, activities })
    await logAction({ userId: session.user.id, userEmail: session.user.email || "", action: "EXPORT", module: "REPORTS", description: `Generated individual participant report: ${participant.name}`, req })
    return new NextResponse(new Uint8Array(pdf), { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${reportFilename(participant.name, "participant")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } })
  } catch (error) {
    console.error("Failed to generate participant report:", error)
    return NextResponse.json({ error: "Failed to generate participant report" }, { status: 500 })
  }
}
