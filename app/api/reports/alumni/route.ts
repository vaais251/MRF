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

    const alumni = await prisma.rFLAlumni.findMany({
      include: {
        _count: {
          select: { activities: true }
        }
      },
      orderBy: { graduationYear: "desc" }
    })

    const flatData = alumni.map(a => ({
      id: a.id,
      name: a.name,
      program: a.program,
      institute: a.institute,
      graduationYear: a.graduationYear,
      currentStatus: a.currentStatus,
      activityCount: a._count.activities
    }))

    await logAction({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "EXPORT",
      module: "REPORTS",
      description: "Generated Alumni Engagement Report",
      req
    })

    return NextResponse.json(flatData)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
