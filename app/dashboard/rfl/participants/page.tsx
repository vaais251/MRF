"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { 
  Plus, Search, Filter, Eye, Edit, Trash2, 
  ChevronLeft, ChevronRight, ArrowUpDown
} from "lucide-react"
import { ParticipantModal } from "@/components/ParticipantModal"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function ParticipantsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [participants, setParticipants] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("ALL")
  const [program, setProgram] = useState("ALL")
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)

  const fetchParticipants = useCallback(async () => {
    setIsLoading(true)
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search,
        status,
        program
      })
      const res = await fetch(`/api/rfl/participants?${query.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setParticipants(data.participants)
        setTotalCount(data.totalCount)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error("Failed to fetch participants:", error)
      toast.error("Failed to load participants")
    } finally {
      setIsLoading(false)
    }
  }, [page, search, status, program])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchParticipants()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [fetchParticipants])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to drop this participant?")) return
    
    try {
      const res = await fetch(`/api/rfl/participants/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("Participant status updated to Dropped")
        fetchParticipants()
      } else {
        toast.error("Failed to delete participant")
      }
    } catch {
      toast.error("An error occurred")
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200'
      case 'COMPLETED': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'DROPPED': return 'bg-red-100 text-red-700 border-red-200'
      case 'ON_HOLD': return 'bg-amber-100 text-amber-700 border-amber-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-slate-800">RFL Participants</h2>
          <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span>RFL Program</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#C9A84C] font-medium">Participants</span>
          </div>
        </div>
        
        {["SUPER_ADMIN", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"].includes(session?.user?.role || "") && (
          <button 
            onClick={() => { setSelectedParticipant(null); setIsModalOpen(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Add Participant
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name, program or institute..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none transition-all text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="text-slate-400 w-5 h-5 hidden sm:block" />
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none bg-white min-w-[140px]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="DROPPED">Dropped</option>
              <option value="ON_HOLD">On Hold</option>
            </select>

            <select 
              value={program} 
              onChange={(e) => setProgram(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none bg-white min-w-[140px]"
            >
              <option value="ALL">All Programs</option>
              <option value="BS Computer Science">BS Computer Science</option>
              <option value="BS Software Engineering">BS Software Eng.</option>
              <option value="BBA">BBA</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-slate-500 font-medium">
          Showing {participants.length} of {totalCount} participants
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 group transition-colors">
                  <div className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" /></div>
                </th>
                <th className="px-6 py-4">Program</th>
                <th className="px-6 py-4">Institute</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Semester</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Skeleton Loader
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-4 h-4 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200" />
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-6 w-16 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : participants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-lg font-medium text-slate-600">No participants found</p>
                      <p className="text-sm">Try adjusting your filters or adding a new participant.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                participants.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-[#C9A84C]/5 transition-colors group">
                    <td className="px-6 py-4 text-slate-400">{(page - 1) * 10 + idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-bold text-xs shrink-0">
                          {p.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{p.program}</td>
                    <td className="px-6 py-4 text-slate-600">{p.institute}</td>
                    <td className="px-6 py-4 text-slate-600">{p.startYear} - {p.endYear}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Semester {p.currentSemester}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(p.status)}`}>
                        {p.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => router.push(`/dashboard/rfl/participants/${p.id}`)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {["SUPER_ADMIN", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"].includes(session?.user?.role || "") && (
                          <button 
                            onClick={() => { setSelectedParticipant(p); setIsModalOpen(true) }}
                            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-md transition-colors" title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {["SUPER_ADMIN", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"].includes(session?.user?.role || "") && (
                          <button 
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-700">{participants.length > 0 ? (page - 1) * 10 + 1 : 0}</span> to <span className="font-medium text-slate-700">{Math.min(page * 10, totalCount)}</span> of <span className="font-medium text-slate-700">{totalCount}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({length: totalPages}).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${page === i + 1 ? 'bg-[#C9A84C] text-white' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ParticipantModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        participant={selectedParticipant} 
        onSuccess={fetchParticipants}
      />
    </div>
  )
}
