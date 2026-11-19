import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MENTORSHIP_PAGE_ROLES } from "@/lib/rbac"
import { createMentorReport, reportFilename } from "@/lib/individual-report"
import { logAction } from "@/lib/audit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!MENTORSHIP_PAGE_ROLES.includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const selected = await prisma.rFLMentorship.findUnique({ where: { id: params.id }, select: { mentorName: true } })
    if (!selected) return NextResponse.json({ error: "Session not found" }, { status: 404 })
    const sessions = await prisma.rFLMentorship.findMany({
      where: { mentorName: selected.mentorName },
      orderBy: { sessionDate: "desc" },
      include: { participant: { select: { id: true, name: true, institute: true, program: true, status: true } } },
    })
    const pdf = createMentorReport(selected.mentorName, sessions)
    await logAction({ userId: session.user.id, userEmail: session.user.email || "", action: "EXPORT", module: "REPORTS", description: `Generated individual mentor report: ${selected.mentorName}`, req })
    return new NextResponse(new Uint8Array(pdf), { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${reportFilename(selected.mentorName, "mentor")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } })
  } catch (error) {
    console.error("Failed to generate mentor report:", error)
    return NextResponse.json({ error: "Failed to generate mentor report" }, { status: 500 })
  }
}
