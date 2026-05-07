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
    const sessionType = searchParams.get("sessionType") || ""
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")

    const skip = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    
    if (search) {
      where.OR = [
        { mentorName: { contains: search, mode: "insensitive" } },
        { participant: { name: { contains: search, mode: "insensitive" } } },
      ]
    }
    
    if (sessionType && sessionType !== "ALL") {
      where.sessionType = sessionType
    }

    if (fromDate || toDate) {
      where.sessionDate = {}
      if (fromDate) where.sessionDate.gte = new Date(fromDate)
      if (toDate) where.sessionDate.lte = new Date(toDate)
    }

    const [sessions, totalCount] = await Promise.all([
      prisma.rFLMentorship.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sessionDate: "desc" },
        include: { participant: { select: { id: true, name: true, institute: true } } }
      }),
      prisma.rFLMentorship.count({ where })
    ])

    return NextResponse.json({
      sessions,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    })
  } catch (error) {
    console.error("Error fetching mentorships:", error)
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
    const { participantId, mentorName, sessionType, sessionDate, targetAudience, notes } = body

    if (!participantId || !mentorName || !sessionType || !sessionDate || !targetAudience) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const mentorship = await prisma.rFLMentorship.create({
      data: {
        participantId,
        mentorName,
        sessionType,
        sessionDate: new Date(sessionDate),
        targetAudience,
        notes
      }
    })

    return NextResponse.json(mentorship, { status: 201 })
  } catch (error) {
    console.error("Error creating mentorship:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
