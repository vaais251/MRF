"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { 
  Plus, Search, Filter, Calendar, Users, 
  Trash2, Edit, PieChart, Info
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { SessionModal } from "@/components/SessionModal"

interface MentorshipClientProps {
  stats: {
    totalSessions: number
    thisMonthSessions: number
    ratio: string
  }
}

export default function MentorshipClient({ stats }: MentorshipClientProps) {
  const { data: session } = useSession()
  
  const [sessions, setSessions] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState("")
  const [sessionType, setSessionType] = useState("ALL")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<any>(null)

  const fetchSessions = useCallback(async () => {
    setIsLoading(true)
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        sessionType,
        fromDate,
        toDate
      })
      const res = await fetch(`/api/rfl/mentorship?${query.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions)
        setTotalCount(data.totalCount)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      toast.error("Failed to load sessions")
    } finally {
      setIsLoading(false)
    }
  }, [page, search, sessionType, fromDate, toDate])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSessions()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [fetchSessions])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return
    
    try {
      const res = await fetch(`/api/rfl/mentorship/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("Session deleted")
        fetchSessions()
      } else {
        toast.error("Failed to delete session")
      }
    } catch (e) {
      toast.error("An error occurred")
    }
  }

  const resetFilters = () => {
    setSearch("")
    setSessionType("ALL")
    setFromDate("")
    setToDate("")
    setPage(1)
  }

  const canEdit = ["SUPER_ADMIN", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"].includes(session?.user?.role || "")

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-slate-800">Mentorship Sessions</h2>
          <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span>RFL</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#C9A84C] font-medium">Mentorship</span>
          </div>
        </div>
        
        {canEdit && (
          <button 
            onClick={() => { setSelectedSession(null); setIsModalOpen(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Record Session
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-blue-50 text-blue-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Sessions</p>
            <p className="text-3xl font-bold text-slate-800 font-playfair">{stats.totalSessions}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-green-50 text-green-500">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">This Month Sessions</p>
            <p className="text-3xl font-bold text-slate-800 font-playfair">{stats.thisMonthSessions}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-purple-50 text-purple-500">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Group vs 1-on-1</p>
            <p className="text-lg font-bold text-slate-800 font-playfair mt-1.5">{stats.ratio}</p>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search mentor or participant..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none transition-all text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="text-slate-400 w-5 h-5 hidden sm:block" />
            <select 
              value={sessionType} 
              onChange={(e) => setSessionType(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none bg-white min-w-[140px]"
            >
              <option value="ALL">All Types</option>
              <option value="GROUP">Group</option>
              <option value="ONE_ON_ONE">One-on-One</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none bg-white"
            />
            <span className="text-slate-400">—</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none bg-white"
            />
          </div>

          {(search || sessionType !== "ALL" || fromDate || toDate) && (
            <button onClick={resetFilters} className="text-sm text-[#C9A84C] hover:underline font-medium">
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Participant Name</th>
                <th className="px-6 py-4">Mentor Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Target Audience</th>
                <th className="px-6 py-4">Notes</th>
                {canEdit && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-20 h-4 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-32 h-4 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-32 h-4 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-20 h-6 bg-slate-200 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-40 h-4 bg-slate-200 rounded" /></td>
                    {canEdit && <td className="px-6 py-4 text-right"><div className="w-16 h-6 bg-slate-200 rounded ml-auto" /></td>}
                  </tr>
                ))
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <Calendar className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-lg font-medium text-slate-600">No sessions found</p>
                      <p className="text-sm">Try adjusting your filters or record a new session.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {format(new Date(s.sessionDate), "dd MMM yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <a href={`/dashboard/rfl/participants/${s.participantId}`} className="font-semibold text-slate-800 hover:text-[#C9A84C] transition-colors">
                        {s.participant.name}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{s.mentorName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        s.sessionType === 'GROUP' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {s.sessionType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{s.targetAudience}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate relative group/tooltip">
                      {s.notes || "—"}
                      {s.notes && s.notes.length > 40 && (
                        <div className="absolute hidden group-hover/tooltip:block z-10 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-normal">
                          {s.notes}
                          <div className="absolute w-3 h-3 bg-slate-800 rotate-45 -bottom-1.5 left-1/2 -translate-x-1/2"></div>
                        </div>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setSelectedSession(s); setIsModalOpen(true) }}
                            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-md transition-colors" title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-700">{sessions.length > 0 ? (page - 1) * 10 + 1 : 0}</span> to <span className="font-medium text-slate-700">{Math.min(page * 10, totalCount)}</span> of <span className="font-medium text-slate-700">{totalCount}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <SessionModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          sessionData={selectedSession} 
          onSuccess={fetchSessions}
        />
      )}
    </div>
  )
}
