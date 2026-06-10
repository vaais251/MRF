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

    const participants = await prisma.rFLParticipant.findMany({
      orderBy: { createdAt: "desc" }
    })

    // Flatten to report-friendly columns (no id, image, audit fields).
    const flatData = participants.map(p => ({
      name: p.name,
      program: p.program,
      institute: p.institute,
      startYear: p.startYear,
      endYear: p.endYear,
      courseType: p.courseType,
      currentProgress:
        p.courseType === "Semester System" ? (p.currentSemester ? `Semester ${p.currentSemester}` : null)
        : p.courseType === "Annual" ? (p.currentYear ? `Year ${p.currentYear}` : null)
        : p.courseType === "Course" ? p.duration
        : p.fieldRemarks,
      status: p.status,
    }))

    await logAction({
      userId: session.user.id,
      userEmail: session.user.email ?? "",
      action: "EXPORT",
      module: "REPORTS",
      description: "Generated Participant Progress Report",
      req
    })

    return NextResponse.json(flatData)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
