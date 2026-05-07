import { prisma } from "@/lib/prisma"
import SponsorshipClient from "./SponsorshipClient"

export default async function SponsorshipPage() {
  const now = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(now.getDate() + 30)

  const [activeCount, sponsors, expiringSoon, activeSponsorships] = await Promise.all([
    prisma.rFLSponsorship.count({ where: { status: 'ACTIVE' } }),
    prisma.rFLSponsorship.groupBy({
      by: ['sponsorName'],
      _count: true
    }),
    prisma.rFLSponsorship.count({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: now,
          lte: thirtyDaysFromNow
        }
      }
    }),
    prisma.rFLSponsorship.findMany({
      where: { status: 'ACTIVE' },
      select: { amount: true }
    })
  ])

  const totalSponsors = sponsors.length
  
  // Need to be careful with Decimal amounts
  const totalValue = activeSponsorships.reduce((sum, s) => sum + (s.amount ? Number(s.amount) : 0), 0)

  const stats = {
    activeCount,
    totalSponsors,
    expiringSoon,
    totalValue
  }

  return <SponsorshipClient stats={stats} />
}
