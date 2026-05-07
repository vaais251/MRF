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

    await logAction({
      userId: session.user.id,
      userEmail: session.user.email ?? "",
      action: "EXPORT",
      module: "REPORTS",
      description: "Generated Participant Progress Report",
      req
    })

    return NextResponse.json(participants)
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
