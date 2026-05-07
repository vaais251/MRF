"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { 
  Plus, Search, GraduationCap, Users, Calendar, 
  MapPin, Loader2, Edit, Trash2, Link as LinkIcon
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { AlumniModal } from "@/components/AlumniModal"

interface AlumniClientProps {
  stats: {
    totalAlumni: number
    activitiesThisYear: number
    mostRecentGraduationYear: number | string
  }
}

export default function AlumniClient({ stats }: AlumniClientProps) {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [alumni, setAlumni] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState("")
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchAlumni = useCallback(async () => {
    setIsLoading(true)
    try {
      const query = new URLSearchParams()
      if (search) query.append("search", search)
      
      const res = await fetch(`/api/rfl/alumni?${query.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setAlumni(data)
      }
    } catch (error) {
      toast.error("Failed to load alumni")
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAlumni()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [fetchAlumni])

  const canEdit = ["SUPER_ADMIN", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"].includes(session?.user?.role || "")

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'employed': return 'bg-green-100 text-green-700 border-green-200'
      case 'studying': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'entrepreneur': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-slate-800">Alumni Association</h2>
          <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span>RFL</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#C9A84C] font-medium">Alumni</span>
          </div>
        </div>
        
        {canEdit && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Add Alumni
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
            <p className="text-slate-500 text-sm font-medium mb-1">Total Alumni</p>
            <p className="text-3xl font-bold text-slate-800 font-playfair">{stats.totalAlumni}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-green-50 text-green-500">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Activities This Year</p>
            <p className="text-3xl font-bold text-slate-800 font-playfair">{stats.activitiesThisYear}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 transition-all hover:shadow-md">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-amber-50 text-amber-500">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Most Recent Grad</p>
            <p className="text-3xl font-bold text-slate-800 font-playfair">{stats.mostRecentGraduationYear}</p>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search alumni, program or institute..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none transition-all text-sm"
          />
        </div>
        <div className="text-sm text-slate-500 font-medium hidden sm:block">
          {alumni.length} results
        </div>
      </div>

      {/* Alumni Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-6 animate-pulse">
              <div className="w-16 h-16 bg-slate-200 rounded-full mb-4" />
              <div className="w-3/4 h-5 bg-slate-200 rounded mb-2" />
              <div className="w-1/2 h-4 bg-slate-200 rounded mb-4" />
              <div className="w-1/3 h-6 bg-slate-200 rounded-full mb-6" />
              <div className="w-full h-10 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>
      ) : alumni.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 py-16 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-lg font-medium text-slate-600">No alumni records yet</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your search or add a new record.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {alumni.map((a) => (
            <div 
              key={a.id} 
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-[#C9A84C]/30 flex flex-col group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A84C]/40 to-[#C9A84C]/10 flex items-center justify-center text-[#C9A84C] font-bold text-xl border border-[#C9A84C]/20 shadow-sm">
                  {a.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(a.currentStatus)}`}>
                  {a.currentStatus}
                </span>
              </div>
              
              <h3 className="text-xl font-bold font-playfair text-slate-800 mb-1">{a.name}</h3>
              <p className="text-sm text-slate-500 mb-1">{a.program}</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                <MapPin className="w-3.5 h-3.5" /> {a.institute}
              </div>

              <div className="flex items-center justify-between mb-6 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Class of {a.graduationYear}</span>
                </div>
                <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                  {a._count.activities} Activities
                </div>
              </div>

              <div className="mt-auto">
                <button 
                  onClick={() => router.push(`/dashboard/rfl/alumni/${a.id}`)}
                  className="w-full py-2.5 rounded-lg border-2 border-[#C9A84C]/30 text-[#C9A84C] font-semibold text-sm transition-all duration-200 hover:bg-[#C9A84C] hover:text-white"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <AlumniModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchAlumni}
        />
      )}
    </div>
  )
}
