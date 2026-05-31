import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name } = body
    // `image` may be a base64 data URL (new picture), an empty string (remove), or undefined (unchanged)
    const hasImage = Object.prototype.hasOwnProperty.call(body, "image")
    const image: string | null | undefined = hasImage ? (body.image || null) : undefined

    if (name !== undefined && !name) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
    }

    // Backstop guard (the client compresses profile images to ~120KB; this is the safety net).
    if (typeof image === "string" && image.length > 500_000) {
      return NextResponse.json({ error: "Image is too large" }, { status: 413 })
    }
    if (typeof image === "string" && !image.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}
    if (name !== undefined) data.name = name
    if (image !== undefined) data.image = image

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: "UPDATE",
        module: "SYSTEM",
        description: image !== undefined && name === undefined ? "Updated profile picture" : "Updated profile",
      }
    })

    return NextResponse.json({ user: { id: user.id, name: user.name, image: user.image } })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
