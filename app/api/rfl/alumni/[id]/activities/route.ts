import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const WRITE_ROLES = ["SUPER_ADMIN", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"]

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { activityName, type, date, status } = body

    if (!activityName || !type || !date || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const activity = await prisma.rFLAlumniActivity.create({
      data: {
        alumniId: params.id,
        activityName,
        type,
        date: new Date(date),
        status
      }
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error("Error creating alumni activity:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
