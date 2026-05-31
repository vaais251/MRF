import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"

const VIEW_ROLES = [
  "SUPER_ADMIN", "TRUST_MGMT", "PROGRAM_MANAGER", "MEO_OFFICER",
  "SCHOOL_AUTHORITY", "HOSTEL_INCHARGE", "RFL_COORDINATOR",
]
const MANAGE_ROLES = ["SUPER_ADMIN", "RFL_COORDINATOR"]

const MAX_IMAGES = 10
const MAX_IMAGE_LENGTH = 3_000_000

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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !VIEW_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const activity = await prisma.activity.findUnique({ where: { id: params.id } })
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error("Error fetching activity:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!MANAGE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { title, description, date, location, notes, images } = body

    if (!title || !description || !date) {
      return NextResponse.json({ error: "Title, description and date are required" }, { status: 400 })
    }

    const imageError = validateImages(images)
    if (imageError) {
      return NextResponse.json({ error: imageError }, { status: 400 })
    }

    const activity = await prisma.activity.update({
      where: { id: params.id },
      data: {
        title,
        description,
        date: new Date(date),
        location: location || null,
        notes: notes || null,
        images: Array.isArray(images) ? images : [],
      },
    })

    await logAction({
      userId: session.user.id,
      userEmail: session.user.email || "",
      action: "UPDATE",
      module: "SYSTEM",
      description: `Updated activity "${title}"`,
      req,
    })

    return NextResponse.json(activity)
  } catch (error) {
    console.error("Error updating activity:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!MANAGE_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const existing = await prisma.activity.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    await prisma.activity.delete({ where: { id: params.id } })

    await logAction({
      userId: session.user.id,
      userEmail: session.user.email || "",
      action: "DELETE",
      module: "SYSTEM",
      description: `Deleted activity "${existing.title}"`,
      req,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting activity:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
