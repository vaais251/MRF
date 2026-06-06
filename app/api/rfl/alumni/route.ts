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
    const search = searchParams.get("search") || ""

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { program: { contains: search, mode: "insensitive" } },
        { institute: { contains: search, mode: "insensitive" } },
      ]
    }

    const alumni = await prisma.rFLAlumni.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { activities: true } } }
    })

    return NextResponse.json(alumni)
  } catch (error) {
    console.error("Error fetching alumni:", error)
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
    const { name, program, institute, graduationYear, currentStatus, image, tenure, qualification, professionalJourney } = body

    if (!name || !program || !institute || !graduationYear || !currentStatus) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (typeof image === "string" && image && !image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 })
    }
    if (typeof image === "string" && image.length > 500_000) {
      return NextResponse.json({ error: "Image is too large" }, { status: 413 })
    }

    const alumni = await prisma.rFLAlumni.create({
      data: {
        name,
        program,
        institute,
        graduationYear: parseInt(graduationYear),
        currentStatus,
        image: image || null,
        tenure: tenure || null,
        qualification: qualification || null,
        professionalJourney: professionalJourney || null,
      }
    })

    return NextResponse.json(alumni, { status: 201 })
  } catch (error) {
    console.error("Error creating alumni:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
