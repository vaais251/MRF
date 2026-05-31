import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED_ROLES = ["SUPER_ADMIN", "TRUST_MGMT", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"]
const WRITE_ROLES = ["SUPER_ADMIN", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"]

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const program = searchParams.get("program") || ""

    const skip = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { institute: { contains: search, mode: "insensitive" } },
        { program: { contains: search, mode: "insensitive" } },
      ]
    }
    
    if (status && status !== "ALL") {
      where.status = status
    }
    
    if (program && program !== "ALL") {
      where.program = program
    }

    const [participants, totalCount] = await Promise.all([
      prisma.rFLParticipant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.rFLParticipant.count({ where })
    ])

    return NextResponse.json({
      participants,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    })
  } catch (error) {
    console.error("Error fetching participants:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !WRITE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, program, institute, startYear, endYear, currentSemester, academicResults, status, image } = body

    if (!name || !program || !institute || !startYear || !endYear || !currentSemester) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (typeof image === "string" && image && !image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 })
    }
    if (typeof image === "string" && image.length > 500_000) {
      return NextResponse.json({ error: "Image is too large" }, { status: 413 })
    }

    const participant = await prisma.rFLParticipant.create({
      data: {
        name,
        program,
        institute,
        startYear: parseInt(startYear),
        endYear: parseInt(endYear),
        currentSemester: parseInt(currentSemester),
        academicResults: academicResults || [],
        status: status || "ACTIVE",
        image: image || null,
        createdBy: session.user.id
      }
    })

    return NextResponse.json(participant, { status: 201 })
  } catch (error) {
    console.error("Error creating participant:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
