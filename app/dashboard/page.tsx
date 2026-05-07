import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NoticeBanner } from "@/components/NoticeBanner"
import { Greeting } from "@/components/Greeting"
import { Book, Users, GraduationCap, Award, ArrowRight, ShieldCheck, Activity, UserPlus, Calendar, Gift, FileText, Settings } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export const metadata = {
  title: 'Dashboard Home | MRT M&E System'
}

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions)
  const user = session?.user

  if (!user) return null

  const isSuper = user.role === "SUPER_ADMIN" || user.role === "TRUST_MGMT"

  // Fetch stats based on role
  let stats = {
    participants: 0,
    mentorships: 0,
    alumni: 0,
    sponsorships: 0,
    users: 0,
  }

  if (isSuper) {
    const [p, m, a, s, u] = await Promise.all([
      prisma.rFLParticipant.count(),
      prisma.rFLMentorship.count(),
      prisma.rFLAlumni.count(),
      prisma.rFLSponsorship.count({ where: { status: "ACTIVE" } }),
      prisma.user.count(),
    ])
    stats = { participants: p, mentorships: m, alumni: a, sponsorships: s, users: u }
  } else {
    const [p, m, a, s] = await Promise.all([
      prisma.rFLParticipant.count(),
      prisma.rFLMentorship.count(),
      prisma.rFLAlumni.count(),
      prisma.rFLSponsorship.count({ where: { status: "ACTIVE" } }),
    ])
    stats = { participants: p, mentorships: m, alumni: a, sponsorships: s, users: 0 }
  }

  // Fetch user's recent activity
  const recentLogs = await prisma.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  // Format role for display
  const displayRole = user.role.replace('_', ' ')

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <NoticeBanner />

      {/* Welcome Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden flex items-center justify-between">
        <div className="relative z-10">
          <Greeting name={user.name || "User"} />
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-4 h-4 text-mrt-gold" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{displayRole} · Miri Roshni Trust</span>
          </div>
        </div>
        
        {/* Large watermark logo */}
        <Book className="absolute -right-8 -bottom-16 w-64 h-64 text-mrt-gold opacity-[0.03] dark:opacity-[0.05] rotate-12 pointer-events-none" />
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-mrt-gold/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-500 dark:text-slate-400">Total Participants</h3>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.participants}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-mrt-gold/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-500 dark:text-slate-400">Mentorships</h3>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Book className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.mentorships}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-mrt-gold/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-500 dark:text-slate-400">Alumni</h3>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.alumni}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-mrt-gold/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-500 dark:text-slate-400">Active Sponsorships</h3>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.sponsorships}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Links Grid */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-mrt-gold" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/dashboard/rfl/participants" className="group p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-mrt-gold shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-mrt-gold/10 transition-colors">
                  <UserPlus className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-mrt-gold transition-colors" />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-mrt-navy dark:group-hover:text-white transition-colors">Add Participant</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </Link>
            
            <Link href="/dashboard/rfl/mentorship" className="group p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-mrt-gold shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-mrt-gold/10 transition-colors">
                  <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-mrt-gold transition-colors" />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-mrt-navy dark:group-hover:text-white transition-colors">Record Session</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </Link>

            <Link href="/dashboard/rfl/alumni" className="group p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-mrt-gold shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-mrt-gold/10 transition-colors">
                  <GraduationCap className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-mrt-gold transition-colors" />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-mrt-navy dark:group-hover:text-white transition-colors">View Alumni</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </Link>

            <Link href="/dashboard/rfl/sponsorships" className="group p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-mrt-gold shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-mrt-gold/10 transition-colors">
                  <Gift className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-mrt-gold transition-colors" />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-mrt-navy dark:group-hover:text-white transition-colors">Manage Sponsorships</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </Link>

            {isSuper && (
              <>
                <Link href="/dashboard/users" className="group p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-mrt-gold shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-mrt-gold/10 transition-colors">
                      <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-mrt-gold transition-colors" />
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-mrt-navy dark:group-hover:text-white transition-colors">Manage Users</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Link>

                <Link href="/dashboard/reports" className="group p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-mrt-gold shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-mrt-gold/10 transition-colors">
                      <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-mrt-gold transition-colors" />
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-mrt-navy dark:group-hover:text-white transition-colors">View Reports</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* My Recent Activity */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            My Recent Activity
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative">
            {recentLogs.length > 0 ? (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                {recentLogs.map((log) => (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 group-hover:bg-mrt-gold group-hover:text-white transition-colors">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group-hover:border-mrt-gold/30 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-mrt-gold uppercase tracking-wider">{log.action}</span>
                        <time className="text-xs text-slate-500">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</time>
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">
                        {log.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 mb-3">
                  <Activity className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No recent activity found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
