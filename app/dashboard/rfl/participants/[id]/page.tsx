"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import {
  ArrowLeft, Edit, GraduationCap, School, Calendar, Book,
  Clock, Plus, ChevronDown, ChevronUp, Loader2, UserCircle, CalendarDays
} from "lucide-react"
import { toast } from "sonner"
import { ParticipantModal } from "@/components/ParticipantModal"
import { SessionModal } from "@/components/SessionModal"
import ActivitiesClient from "@/app/dashboard/activities/ActivitiesClient"
import { Avatar } from "@/components/Avatar"

export default function ParticipantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const role = session?.user?.role || ""
  const canManageActivities = ["SUPER_ADMIN", "RFL_COORDINATOR"].includes(role)
  const canEditSessions = ["SUPER_ADMIN", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"].includes(role)

  const [participant, setParticipant] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"profile" | "activities">("profile")
  const [expandedNotes, setExpandedNotes] = useState<string[]>([])

  const fetchParticipant = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/rfl/participants/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setParticipant(data)
      } else {
        toast.error("Participant not found")
        router.push("/dashboard/rfl/participants")
      }
    } catch {
      toast.error("Failed to load details")
    } finally {
      setIsLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchParticipant()
  }, [fetchParticipant])

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200'
      case 'COMPLETED': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'DROPPED': return 'bg-red-100 text-red-700 border-red-200'
      case 'ON_HOLD': return 'bg-amber-100 text-amber-700 border-amber-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const toggleNote = (id: string) => {
    setExpandedNotes(prev => 
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" />
      </div>
    )
  }

  if (!participant) return null

  const yearLabel = (y: number) => ["1st", "2nd", "3rd", "4th"][y - 1] || `${y}th`
  const courseDetail = (() => {
    switch (participant.courseType) {
      case "Annual": return { label: "Current Year", value: participant.currentYear ? `${yearLabel(participant.currentYear)} year` : "—" }
      case "Semester System": return { label: "Current Semester", value: participant.currentSemester ? `Semester ${participant.currentSemester}` : "—" }
      case "Course": return { label: "Course Duration", value: participant.duration || "—" }
      case "Other": return { label: "Field Remarks", value: participant.fieldRemarks || "—" }
      default: return { label: "Current Semester", value: participant.currentSemester ? `Semester ${participant.currentSemester}` : "—" }
    }
  })()

  // Normalize results (supports old {subjectName, semester, grade} shape)
  const results = (Array.isArray(participant.academicResults) ? participant.academicResults : []).map((r: any) => ({
    name: r.name ?? r.subjectName ?? "",
    period: r.period ?? (r.semester ? `Semester ${r.semester}` : ""),
    grade: r.grade ?? "",
    percentage: r.percentage ?? "",
    gpa: r.gpa ?? "",
    cgpa: r.cgpa ?? "",
    comments: r.comments ?? "",
    file: r.file ?? null,
  }))
  const scoreText = (r: any) => {
    if ((r.period || "").startsWith("Semester")) {
      return [r.percentage && `${r.percentage}%`, r.gpa && `GPA ${r.gpa}`, r.cgpa && `CGPA ${r.cgpa}`].filter(Boolean).join(" · ") || "—"
    }
    return r.grade || "—"
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Navigation */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push("/dashboard/rfl/participants")}
          className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-playfair font-bold text-slate-800">Participant Details</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { id: "profile", label: "Profile", icon: UserCircle },
          { id: "activities", label: "Activities", icon: CalendarDays },
        ].map((t) => {
          const Icon = t.icon
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as "profile" | "activities")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${active ? "border-[#C9A84C] text-[#C9A84C]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>

      {activeTab === "profile" && (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - 60% */}
        <div className="w-full lg:w-[60%] space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative group">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="absolute top-6 right-6 p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Edit className="w-5 h-5" />
            </button>
            
            <div className="p-8 pb-6 border-b border-slate-100">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <Avatar name={participant.name} image={participant.image} className="w-20 h-20 bg-[#C9A84C]/20 text-[#C9A84C] text-2xl shrink-0 shadow-inner" />
                <div>
                  <h1 className="text-3xl font-playfair font-bold text-slate-800 mb-2">{participant.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(participant.status)}`}>
                    {participant.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Program</div>
                    <div className="font-medium text-slate-700">{participant.program}</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <School className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Institute</div>
                    <div className="font-medium text-slate-700">{participant.institute}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Years</div>
                    <div className="font-medium text-slate-700">{participant.startYear} — {participant.endYear}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Book className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Course Type</div>
                    <div className="font-medium text-slate-700">{participant.courseType || "—"}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{courseDetail.label}</div>
                    <div className="font-medium text-slate-700">{courseDetail.value}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Results Table */}
            <div className="p-8 pt-0 bg-slate-50/30">
              <h3 className="font-playfair text-lg font-bold text-slate-800 mb-4 pt-6 border-t border-slate-200">Academic Results</h3>
              {results.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white text-slate-500 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3 border-b border-slate-200">Result</th>
                        <th className="px-4 py-3 border-b border-slate-200">Period</th>
                        <th className="px-4 py-3 border-b border-slate-200">Score</th>
                        <th className="px-4 py-3 border-b border-slate-200">Comments</th>
                        <th className="px-4 py-3 border-b border-slate-200 text-right">File</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {results.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors align-top">
                          <td className="px-4 py-3 font-medium text-slate-700">{r.name || "—"}</td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.period || "—"}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 bg-slate-100 rounded-md font-semibold text-slate-700">{scoreText(r)}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-[14rem]">{r.comments || "—"}</td>
                          <td className="px-4 py-3 text-right">
                            {r.file ? (
                              <a href={r.file} target="_blank" rel="noopener noreferrer" className="inline-block">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={r.file} alt="Result" className="h-10 w-10 rounded object-cover border border-slate-200 ml-auto" />
                              </a>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 bg-white text-center text-slate-500 text-sm">
                  No academic results recorded yet.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column - 40% */}
        <div className="w-full lg:w-[40%] space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-playfair text-lg font-bold text-slate-800">Mentorship Sessions</h3>
              {canEditSessions && (
                <button onClick={() => setIsSessionModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#C9A84C]/30 text-[#C9A84C] font-semibold text-xs transition-all duration-200 hover:bg-[#C9A84C] hover:text-white hover:border-[#C9A84C] shadow-sm">
                  <Plus className="w-3 h-3" /> Add Session
                </button>
              )}
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {participant.mentorships && participant.mentorships.length > 0 ? (
                (participant as unknown as { mentorships: unknown[] }).mentorships.map((sessionData: unknown) => {
                  const session = sessionData as { id: string, mentorName: string, sessionDate: string, sessionType: string, targetAudience: string, notes?: string, images?: string[] }
                  const isExpanded = expandedNotes.includes(session.id)
                  return (
                    <div key={session.id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-slate-800">{session.mentorName}</div>
                          <div className="text-xs text-slate-400">{format(new Date(session.sessionDate), "dd MMM yyyy")}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${
                          session.sessionType === 'GROUP' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>
                          {session.sessionType.replace("_", " ")}
                        </span>
                      </div>
                      
                      <div className="text-xs font-medium text-slate-500 mb-2">
                        Target: <span className="text-slate-700">{session.targetAudience}</span>
                      </div>

                      {session.notes && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className={`text-sm text-slate-600 ${!isExpanded && 'line-clamp-2'}`}>
                            {session.notes}
                          </p>
                          {session.notes.length > 100 && (
                            <button
                              onClick={() => toggleNote(session.id)}
                              className="mt-1 text-xs font-medium text-[#C9A84C] flex items-center gap-1 hover:text-[#B8943D]"
                            >
                              {isExpanded ? <><ChevronUp className="w-3 h-3"/> Show Less</> : <><ChevronDown className="w-3 h-3"/> Read More</>}
                            </button>
                          )}
                        </div>
                      )}

                      {session.images && session.images.length > 0 && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {session.images.map((img, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                              <img src={img} alt="Session" className="h-12 w-12 rounded object-cover border border-slate-200" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <HandHeart className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-medium text-slate-600">No sessions yet</p>
                  <p className="text-sm">Record a mentorship session to track progress.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === "activities" && (
        <ActivitiesClient canManage={canManageActivities} participantId={params.id as string} embedded />
      )}

      <ParticipantModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        participant={participant}
        onSuccess={fetchParticipant}
      />

      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        participantId={params.id as string}
        onSuccess={fetchParticipant}
      />
    </div>
  )
}

function HandHeart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" />
      <path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
      <path d="m2 15 6 6" />
      <path d="M19.5 8.5 22 6" />
      <path d="m21.5 8.5-2.5-2.5" />
      <path d="M22 6 19.5 3.5" />
    </svg>
  )
}
