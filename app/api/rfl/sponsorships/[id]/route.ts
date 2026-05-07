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
    const { sponsorName, type, amount, startDate, endDate, status, participantId, notes } = body

    const sponsorship = await prisma.rFLSponsorship.update({
      where: { id: params.id },
      data: {
        sponsorName,
        type,
        amount: amount ? parseFloat(amount) : null,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        status,
        participantId: participantId || null,
        notes
      }
    })

    return NextResponse.json(sponsorship)
  } catch (error) {
    console.error("Error updating sponsorship:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.rFLSponsorship.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting sponsorship:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
