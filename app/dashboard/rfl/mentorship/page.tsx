import { prisma } from "@/lib/prisma"
import MentorshipClient from "./MentorshipClient"

export default async function MentorshipPage() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [totalSessions, thisMonthSessions, groupSessions, oneOnOneSessions] = await Promise.all([
    prisma.rFLMentorship.count(),
    prisma.rFLMentorship.count({
      where: {
        sessionDate: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    }),
    prisma.rFLMentorship.count({ where: { sessionType: 'GROUP' } }),
    prisma.rFLMentorship.count({ where: { sessionType: 'ONE_ON_ONE' } })
  ])

  const total = groupSessions + oneOnOneSessions
  const groupPercent = total > 0 ? Math.round((groupSessions / total) * 100) : 0
  const oneOnOnePercent = total > 0 ? Math.round((oneOnOneSessions / total) * 100) : 0

  const stats = {
    totalSessions,
    thisMonthSessions,
    ratio: `${groupPercent}% Group · ${oneOnOnePercent}% One-on-One`
  }

  return <MentorshipClient stats={stats} />
}
