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

    const skip = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    
    if (search) {
      where.sponsorName = { contains: search, mode: "insensitive" }
    }

    const [sponsorships, totalCount] = await Promise.all([
      prisma.rFLSponsorship.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.rFLSponsorship.count({ where })
    ])

    return NextResponse.json({
      sponsorships,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    })
  } catch (error) {
    console.error("Error fetching sponsorships:", error)
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
    const { sponsorName, type, amount, startDate, endDate, status, participantId, notes } = body

    if (!sponsorName || !type || !startDate || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const sponsorship = await prisma.rFLSponsorship.create({
      data: {
        sponsorName,
        type,
        amount: amount ? parseFloat(amount) : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status,
        participantId: participantId || null,
        notes
      }
    })

    return NextResponse.json(sponsorship, { status: 201 })
  } catch (error) {
    console.error("Error creating sponsorship:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
