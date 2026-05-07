import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["SUPER_ADMIN", "TRUST_MGMT", "PROGRAM_MANAGER", "MEO_OFFICER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Chart 1: Participants by Program
    const participantGrouping = await prisma.rFLParticipant.groupBy({
      by: ['program'],
      _count: true
    })
    const participantsByProgram = participantGrouping.map(g => ({
      name: g.program,
      value: g._count
    }))

    // Chart 2: Monthly Sessions Trend (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1) // Start of the month 6 months ago

    const mentorships = await prisma.rFLMentorship.findMany({
      where: { sessionDate: { gte: sixMonthsAgo } },
      select: { sessionDate: true }
    })

    const monthMap: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      monthMap[d.toLocaleString('default', { month: 'short' })] = 0
    }

    mentorships.forEach(m => {
      const monthStr = new Date(m.sessionDate).toLocaleString('default', { month: 'short' })
      if (monthMap[monthStr] !== undefined) {
        monthMap[monthStr]++
      }
    })

    const monthlySessions = Object.keys(monthMap).map(k => ({
      name: k,
      sessions: monthMap[k]
    }))

    // Chart 3: Sponsorship Status Distribution
    const sponsorshipGrouping = await prisma.rFLSponsorship.groupBy({
      by: ['status'],
      _count: true
    })
    const sponsorshipStatus = sponsorshipGrouping.map(g => ({
      name: g.status,
      count: g._count
    }))

    // Chart 4: Alumni by Graduation Year
    const alumniGrouping = await prisma.rFLAlumni.groupBy({
      by: ['graduationYear'],
      _count: true,
      orderBy: { graduationYear: 'asc' }
    })
    const alumniByYear = alumniGrouping.map(g => ({
      name: g.graduationYear.toString(),
      alumni: g._count
    }))

    return NextResponse.json({
      participantsByProgram,
      monthlySessions,
      sponsorshipStatus,
      alumniByYear
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
