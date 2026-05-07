import { Users, HandHeart, Award, DollarSign, Plus, UserPlus, GraduationCap, Coins } from "lucide-react"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export default async function RFLPage() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [
    totalParticipants,
    activeMentorships,
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
    prisma.rFLParticipant.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { name: true, createdAt: true, id: true } }),
    prisma.rFLMentorship.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { participant: { select: { name: true } }, createdAt: true, id: true } }),
    prisma.rFLAlumni.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { name: true, createdAt: true, id: true } }),
    prisma.rFLSponsorship.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { sponsorName: true, createdAt: true, id: true } })
  ])
  
  const activities = [
    ...recentParticipants.map(p => ({
      id: `p-${p.id}`,
      type: 'PARTICIPANT',
      description: `New participant added: ${p.name}`,
      date: p.createdAt,
      icon: UserPlus,
      color: "text-[#C9A84C]",
      bg: "bg-[#C9A84C]/10"
    })),
    ...recentSessions.map(s => ({
      id: `s-${s.id}`,
      type: 'SESSION',
      description: `Mentorship session recorded for ${s.participant.name}`,
      date: s.createdAt,
      icon: HandHeart,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    })),
    ...recentAlumni.map(a => ({
      id: `a-${a.id}`,
      type: 'ALUMNI',
      description: `New alumni record: ${a.name}`,
      date: a.createdAt,
      icon: GraduationCap,
      color: "text-green-500",
      bg: "bg-green-500/10"
    })),
    ...recentSponsorships.map(s => ({
      id: `sp-${s.id}`,
      type: 'SPONSORSHIP',
      description: `Sponsorship created: ${s.sponsorName}`,
      date: s.createdAt,
      icon: Coins,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5)

  const stats = [
    { label: "Total Participants", value: totalParticipants, icon: Users, colorClass: "text-[#C9A84C]", bgClass: "bg-[#C9A84C]/10" },
    { label: "Active Mentorships", value: activeMentorships, icon: HandHeart, colorClass: "text-blue-500", bgClass: "bg-blue-500/10" },
    { label: "Alumni Members", value: alumniMembers, icon: Award, colorClass: "text-green-500", bgClass: "bg-green-500/10" },
    { label: "Active Sponsorships", value: activeSponsorships, icon: DollarSign, colorClass: "text-purple-500", bgClass: "bg-purple-500/10" },
  ]

  const actions = [
    { label: "Add Participant", href: "/dashboard/rfl/participants" },
    { label: "Record Mentorship Session", href: "/dashboard/rfl/mentorship" },
    { label: "Add Alumni", href: "/dashboard/rfl/alumni" },
    { label: "Add Sponsorship", href: "/dashboard/rfl/sponsorships" }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-slate-800">RFL Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Manage Roshni Future Leaders program participants and activities.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div 
              key={idx} 
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md group"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${stat.bgClass} ${stat.colorClass}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-800 font-playfair">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions Row */}
      <div className="flex flex-wrap items-center gap-3">
        {actions.map((action, idx) => (
          <Link 
            key={idx}
            href={action.href}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#C9A84C]/30 text-[#C9A84C] font-semibold text-sm transition-all duration-200 hover:bg-[#C9A84C] hover:text-white hover:border-[#C9A84C] active:scale-[0.98] shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {action.label}
          </Link>
        ))}
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="font-playfair text-lg font-bold text-slate-800">Recent Activity Feed</h3>
        </div>
        <div className="p-6">
          {activities.length > 0 ? (
            <div className="space-y-6">
              {activities.map((activity, idx) => {
                const Icon = activity.icon
                return (
                  <div key={idx} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.bg} ${activity.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm font-medium text-slate-800">{activity.description}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatDistanceToNow(activity.date, { addSuffix: true })}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              No recent activity found.
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
