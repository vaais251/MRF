"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { 
  Plus, Search, DollarSign, Users, AlertCircle, 
  Wallet, Loader2, Edit, Trash2, Calendar
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { SponsorshipModal } from "@/components/SponsorshipModal"

interface SponsorshipClientProps {
  stats: {
    activeCount: number
    totalSponsors: number
    expiringSoon: number
    totalValue: number
  }
}

export default function SponsorshipClient({ stats }: SponsorshipClientProps) {
  const { data: session } = useSession()
  
  const [sponsorships, setSponsorships] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState("")
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSponsorship, setSelectedSponsorship] = useState<any>(null)

  const fetchSponsorships = useCallback(async () => {
    setIsLoading(true)
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search
      })
      const res = await fetch(`/api/rfl/sponsorships?${query.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setSponsorships(data.sponsorships)
        setTotalCount(data.totalCount)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      toast.error("Failed to load sponsorships")
    } finally {
      setIsLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSponsorships()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [fetchSponsorships])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return
    
    try {
      const res = await fetch(`/api/rfl/sponsorships/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("Sponsorship deleted")
        fetchSponsorships()
      } else {
        toast.error("Failed to delete sponsorship")
      }
    } catch (e) {
      toast.error("An error occurred")
    }
  }

  const canEdit = ["SUPER_ADMIN", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"].includes(session?.user?.role || "")

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'FULL': return 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20'
      case 'PARTIAL': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'MERIT_BASED': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'NEED_BASED': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200'
      case 'EXPIRED': return 'bg-red-100 text-red-700 border-red-200'
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'CANCELLED': return 'bg-slate-100 text-slate-700 border-slate-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getEndDateDisplay = (endDate: string | null) => {
    if (!endDate) return "No End Date"
    const end = new Date(endDate)
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)
    
    const formatted = format(end, "dd MMM yyyy")
    if (end < now) return <span className="text-red-500 font-medium">{formatted}</span>
    if (end <= thirtyDaysFromNow) return <span className="text-amber-500 font-medium">{formatted}</span>
    return formatted
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-slate-800">Sponsorships</h2>
          <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span>RFL</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#C9A84C] font-medium">Sponsorships</span>
          </div>
        </div>
        
        {canEdit && (
          <button 
            onClick={() => { setSelectedSponsorship(null); setIsModalOpen(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Add Sponsorship
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-green-50 text-green-500">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Active Sponsorships</p>
            <p className="text-3xl font-bold text-slate-800 font-playfair">{stats.activeCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-blue-50 text-blue-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Sponsors</p>
            <p className="text-3xl font-bold text-slate-800 font-playfair">{stats.totalSponsors}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-amber-50 text-amber-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Expiring Soon</p>
            <p className="text-3xl font-bold text-slate-800 font-playfair">{stats.expiringSoon}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-[#C9A84C]/10 text-[#C9A84C]">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Value (Active)</p>
            <p className="text-xl font-bold text-slate-800 font-playfair mt-1.5">PKR {stats.totalValue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search sponsor..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* Sponsorships Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Sponsor Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Linked Participant</th>
                <th className="px-6 py-4">Start Date</th>
                <th className="px-6 py-4">End Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                {canEdit && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-32 h-4 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-20 h-6 bg-slate-200 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-20 h-4 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-20 h-6 bg-slate-200 rounded-full" /></td>
                    {canEdit && <td className="px-6 py-4 text-right"><div className="w-16 h-6 bg-slate-200 rounded ml-auto" /></td>}
                  </tr>
                ))
              ) : sponsorships.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <Wallet className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-lg font-medium text-slate-600">No sponsorships found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sponsorships.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-slate-800">{s.sponsorName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getTypeColor(s.type)}`}>
                        {s.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{s.participantId ? s.participantId : <span className="text-slate-400 italic">General</span>}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {format(new Date(s.startDate), "dd MMM yyyy")}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {getEndDateDisplay(s.endDate)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {s.amount ? `PKR ${Number(s.amount).toLocaleString()}` : "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setSelectedSponsorship(s); setIsModalOpen(true) }}
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
            Showing <span className="font-medium text-slate-700">{sponsorships.length > 0 ? (page - 1) * 10 + 1 : 0}</span> to <span className="font-medium text-slate-700">{Math.min(page * 10, totalCount)}</span> of <span className="font-medium text-slate-700">{totalCount}</span> results
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
        <SponsorshipModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          sponsorshipData={selectedSponsorship} 
          onSuccess={fetchSponsorships}
        />
      )}
    </div>
  )
}
