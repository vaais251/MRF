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

    const alumni = await prisma.rFLAlumni.findUnique({
      where: { id: params.id },
      include: {
        activities: {
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!alumni) {
      return NextResponse.json({ error: "Alumni not found" }, { status: 404 })
    }

    return NextResponse.json(alumni)
  } catch (error) {
    console.error("Error fetching alumni:", error)
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
    const { name, program, institute, graduationYear, currentStatus } = body

    const alumni = await prisma.rFLAlumni.update({
      where: { id: params.id },
      data: {
        name,
        program,
        institute,
        graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
        currentStatus
      }
    })

    return NextResponse.json(alumni)
  } catch (error) {
    console.error("Error updating alumni:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.rFLAlumniActivity.deleteMany({ where: { alumniId: params.id } })
    await prisma.rFLAlumni.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting alumni:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
