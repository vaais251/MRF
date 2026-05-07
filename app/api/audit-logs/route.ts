import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const action = searchParams.get("action") || ""
    const moduleStr = searchParams.get("module") || ""
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")

    const skip = (page - 1) * limit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (action && action !== "ALL") {
      where.action = action
    }

    if (moduleStr && moduleStr !== "ALL") {
      where.module = moduleStr
    }

    if (fromDate || toDate) {
      where.createdAt = {}
      if (fromDate) where.createdAt.gte = new Date(fromDate)
      if (toDate) {
        const to = new Date(toDate)
        to.setHours(23, 59, 59, 999)
        where.createdAt.lte = to
      }
    }

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.auditLog.count({ where })
    ])

    return NextResponse.json({
      logs,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    })

  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
