"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { 
  ArrowLeft, Edit, GraduationCap, MapPin, 
  Briefcase, Plus, Loader2, Calendar
} from "lucide-react"
import { toast } from "sonner"
import { AlumniModal } from "@/components/AlumniModal"
import { ActivityModal } from "@/components/ActivityModal"
import { Avatar } from "@/components/Avatar"

export default function AlumniDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [alumni, setAlumni] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)

  const fetchAlumni = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/rfl/alumni/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setAlumni(data)
      } else {
        toast.error("Alumni not found")
        router.push("/dashboard/rfl/alumni")
      }
    } catch (e) {
      toast.error("Failed to load details")
    } finally {
      setIsLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchAlumni()
  }, [fetchAlumni])

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'employed': return 'bg-green-100 text-green-700 border-green-200'
      case 'studying': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'entrepreneur': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getActivityColor = (type: string) => {
    switch(type.toLowerCase()) {
      case 'workshop': return 'bg-blue-500'
      case 'seminar': return 'bg-purple-500'
      case 'meetup': return 'bg-amber-500'
      default: return 'bg-slate-400'
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" />
      </div>
    )
  }

  if (!alumni) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Navigation */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push("/dashboard/rfl/alumni")}
          className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-playfair font-bold text-slate-800">Alumni Profile</h2>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - 40% */}
        <div className="w-full lg:w-[40%] space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center relative group">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="absolute top-6 right-6 p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Edit className="w-5 h-5" />
            </button>

            <Avatar
              name={alumni.name}
              image={alumni.image}
              className="w-24 h-24 bg-gradient-to-br from-[#C9A84C]/40 to-[#C9A84C]/10 text-[#C9A84C] text-3xl mx-auto mb-4 border border-[#C9A84C]/20 shadow-sm"
            />

            <h1 className="text-2xl font-playfair font-bold text-slate-800 mb-2">{alumni.name}</h1>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border mb-6 ${getStatusColor(alumni.currentStatus)}`}>
              {alumni.currentStatus}
            </span>

            <div className="space-y-4 text-left border-t border-slate-100 pt-6">
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-slate-700">{alumni.program}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-slate-700">{alumni.institute}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-slate-700">Class of {alumni.graduationYear}</span>
              </div>
              {alumni.tenure && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-slate-700">Tenure: {alumni.tenure}</span>
                </div>
              )}
              {alumni.qualification && (
                <div className="flex items-center gap-3 text-sm">
                  <GraduationCap className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-slate-700">{alumni.qualification}</span>
                </div>
              )}
            </div>
          </div>

          {alumni.professionalJourney && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-playfair text-lg font-bold text-slate-800 mb-3">Professional Journey after MRA</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{alumni.professionalJourney}</p>
            </div>
          )}
        </div>

        {/* Right Column - 60% */}
        <div className="w-full lg:w-[60%] space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-playfair text-lg font-bold text-slate-800">Activities</h3>
              <button 
                onClick={() => setIsActivityModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#C9A84C]/30 text-[#C9A84C] font-semibold text-xs transition-all duration-200 hover:bg-[#C9A84C] hover:text-white hover:border-[#C9A84C] shadow-sm"
              >
                <Plus className="w-3 h-3" /> Add Activity
              </button>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
              {alumni.activities && alumni.activities.length > 0 ? (
                <div className="relative border-l border-slate-200 ml-3 space-y-8 pb-4">
                  {alumni.activities.map((activity: any) => (
                    <div key={activity.id} className="relative pl-6 group">
                      <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white shadow-sm ${getActivityColor(activity.type)}`} />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-slate-800">{activity.activityName}</h4>
                        <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">
                          {format(new Date(activity.date), "dd MMM yyyy")}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {activity.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          activity.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          activity.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <Calendar className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-medium text-slate-600">No activities recorded</p>
                  <p className="text-sm">Add an activity to start tracking their engagement.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlumniModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        alumniData={alumni}
        onSuccess={fetchAlumni}
      />

      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        alumniId={alumni.id}
        onSuccess={fetchAlumni}
      />
    </div>
  )
}
