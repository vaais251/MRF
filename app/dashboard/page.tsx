import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NoticeBanner } from "@/components/NoticeBanner"
import { Greeting } from "@/components/Greeting"
import { Book, Users, GraduationCap, School, ArrowRight, ShieldCheck, Activity, UserPlus, Calendar, Gift, FileText, Settings } from "lucide-react"
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

  // General dashboard: total strength per program.
  // MRHSS and MRA modules aren't built yet, so they show 0 for now.
  const rflStrength = await prisma.rFLParticipant.count()
  const stats = {
    mrhss: 0,
    mra: 0,
    rfl: rflStrength,
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

      {/* Program Strength Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-mrt-gold/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-500 dark:text-slate-400">MRHSS Total Strength</h3>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <School className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.mrhss}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-mrt-gold/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-500 dark:text-slate-400">MRA Total Strength</h3>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.mra}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-mrt-gold/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-500 dark:text-slate-400">RFL Total Strength</h3>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.rfl}</p>
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
                <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-mrt-navy dark:group-hover:text-white transition-colors">Add Session</span>
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
              <ol className="relative ml-2 border-l border-slate-200 dark:border-slate-700 space-y-6">
                {recentLogs.map((log) => (
                  <li key={log.id} className="relative pl-6 group">
                    <span className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900 group-hover:bg-mrt-gold transition-colors" />
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                      <span className="text-xs font-semibold text-mrt-gold uppercase tracking-wider">{log.action}</span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <time className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </time>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                      {log.description}
                    </p>
                  </li>
                ))}
              </ol>
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
