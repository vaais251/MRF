import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const [
      totalParticipants,
      activeMentorshipsThisMonth,
      alumniMembers,
      activeSponsorships,
      recentParticipants,
      recentSessions,
      recentAlumni,
      recentSponsorships
    ] = await Promise.all([
      prisma.rFLParticipant.count(),
      prisma.rFLMentorship.count({
        where: {
          sessionDate: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),
      prisma.rFLAlumni.count(),
      prisma.rFLSponsorship.count({ where: { status: 'ACTIVE' } }),
      
      // Fetch recent activities for the feed
      prisma.rFLParticipant.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { name: true, createdAt: true, id: true }
      }),
      prisma.rFLMentorship.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { participant: { select: { name: true } }, createdAt: true, id: true }
      }),
      prisma.rFLAlumni.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { name: true, createdAt: true, id: true }
      }),
      prisma.rFLSponsorship.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { sponsorName: true, createdAt: true, id: true }
      })
    ])

    // Combine and sort recent activities
    const activities = [
      ...recentParticipants.map(p => ({
        id: `p-${p.id}`,
        type: 'PARTICIPANT',
        description: `New participant added: ${p.name}`,
        date: p.createdAt
      })),
      ...recentSessions.map(s => ({
        id: `s-${s.id}`,
        type: 'SESSION',
        description: `Mentorship session recorded for ${s.participant.name}`,
        date: s.createdAt
      })),
      ...recentAlumni.map(a => ({
        id: `a-${a.id}`,
        type: 'ALUMNI',
        description: `New alumni record: ${a.name}`,
        date: a.createdAt
      })),
      ...recentSponsorships.map(s => ({
        id: `sp-${s.id}`,
        type: 'SPONSORSHIP',
        description: `Sponsorship created: ${s.sponsorName}`,
        date: s.createdAt
      }))
    ]
    
    // Sort descending by date and take top 5
    activities.sort((a, b) => b.date.getTime() - a.date.getTime())
    const recentActivityFeed = activities.slice(0, 5)

    return NextResponse.json({
      stats: {
        totalParticipants,
        activeMentorships: activeMentorshipsThisMonth,
        alumniMembers,
        activeSponsorships
      },
      recentActivityFeed
    })

  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
