import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"

// Every authenticated role can view the activity feed
const VIEW_ROLES = [
  "SUPER_ADMIN", "TRUST_MGMT", "PROGRAM_MANAGER", "MEO_OFFICER",
  "SCHOOL_AUTHORITY", "HOSTEL_INCHARGE", "RFL_COORDINATOR",
]
// Only these roles can create / edit / delete activities
const MANAGE_ROLES = ["SUPER_ADMIN", "RFL_COORDINATOR"]

const MAX_IMAGES = 10
const MAX_IMAGE_LENGTH = 3_000_000 // ~2.2MB binary per image

function validateImages(images: unknown): string | null {
  if (images === undefined) return null
  if (!Array.isArray(images)) return "Images must be an array"
  if (images.length > MAX_IMAGES) return `A maximum of ${MAX_IMAGES} images is allowed`
  for (const img of images) {
    if (typeof img !== "string" || !img.startsWith("data:image/")) return "Invalid image format"
    if (img.length > MAX_IMAGE_LENGTH) return "One of the images is too large"
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !VIEW_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")))
    const search = searchParams.get("search") || ""
    const participantId = searchParams.get("participantId")
    const skip = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    // Scope to a participant's activities, or the global feed (no participant) otherwise.
    where.participantId = participantId ? participantId : null
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ]
    }

    const [activities, totalCount] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
      }),
      prisma.activity.count({ where }),
    ])

    return NextResponse.json({
      activities,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      canManage: MANAGE_ROLES.includes(session.user.role),
    })
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!MANAGE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, date, location, notes, images, participantId } = body

    if (!title || !description || !date) {
      return NextResponse.json({ error: "Title, description and date are required" }, { status: 400 })
    }

    const imageError = validateImages(images)
    if (imageError) {
      return NextResponse.json({ error: imageError }, { status: 400 })
    }

    const activity = await prisma.activity.create({
      data: {
        title,
        description,
        date: new Date(date),
        location: location || null,
        notes: notes || null,
        images: Array.isArray(images) ? images : [],
        participantId: participantId || null,
        createdBy: session.user.id,
        createdByName: session.user.name || null,
      },
    })

    await logAction({
      userId: session.user.id,
      userEmail: session.user.email || "",
      action: "CREATE",
      module: "SYSTEM",
      description: `Created activity "${title}"`,
      req,
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error("Error creating activity:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
