"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X, Loader2, Users, User, Search } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

const sessionSchema = z.object({
  participantId: z.string().min(1, "Please select a participant"),
  mentorName: z.string().min(3, "Mentor name must be at least 3 characters"),
  sessionType: z.enum(["GROUP", "ONE_ON_ONE"]),
  sessionDate: z.string().min(1, "Date is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional()
})

type SessionFormValues = z.infer<typeof sessionSchema>

interface SessionModalProps {
  isOpen: boolean
  onClose: () => void
  sessionData?: any
  onSuccess: () => void
}

export function SessionModal({ isOpen, onClose, sessionData, onSuccess }: SessionModalProps) {
  const isEdit = !!sessionData
  const [isLoading, setIsLoading] = useState(false)
  
  // Participant search state
  const [participants, setParticipants] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      participantId: "",
      mentorName: "",
      sessionType: "ONE_ON_ONE",
      sessionDate: format(new Date(), "yyyy-MM-dd"),
      targetAudience: "",
      notes: ""
    }
  })

  const notesWatch = watch("notes")

  useEffect(() => {
    if (isOpen) {
      if (sessionData) {
        reset({
          participantId: sessionData.participantId,
          mentorName: sessionData.mentorName,
          sessionType: sessionData.sessionType,
          sessionDate: format(new Date(sessionData.sessionDate), "yyyy-MM-dd"),
          targetAudience: sessionData.targetAudience,
          notes: sessionData.notes || ""
        })
        setSelectedParticipant(sessionData.participant)
      } else {
        reset({
          participantId: "",
          mentorName: "",
          sessionType: "ONE_ON_ONE",
          sessionDate: format(new Date(), "yyyy-MM-dd"),
          targetAudience: "",
          notes: ""
        })
        setSelectedParticipant(null)
      }
    }
  }, [isOpen, sessionData, reset])

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!search) {
        setParticipants([])
        return
      }
      setIsSearching(true)
      try {
        const res = await fetch(`/api/rfl/participants?limit=5&search=${search}`)
        if (res.ok) {
          const data = await res.json()
          setParticipants(data.participants)
        }
      } catch (error) {
        console.error("Error fetching participants", error)
      } finally {
        setIsSearching(false)
      }
    }

    const delayDebounceFn = setTimeout(() => {
      fetchParticipants()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [search])

  if (!isOpen) return null

  const onSubmit = async (data: SessionFormValues) => {
    // Check if date is in future
    if (new Date(data.sessionDate) > new Date()) {
      toast.error("Session date cannot be in the future")
      return
    }

    setIsLoading(true)
    try {
      const url = isEdit ? `/api/rfl/mentorship/${sessionData.id}` : '/api/rfl/mentorship'
      const method = isEdit ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error("Failed to save session")

      toast.success(`Session ${isEdit ? 'updated' : 'recorded'} successfully!`)
      onSuccess()
      onClose()
    } catch (error) {
      toast.error("Failed to save session.")
    } finally {
      setIsLoading(false)
    }
  }

  const sessionTypeWatch = watch("sessionType")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-playfair font-bold text-slate-800">
            {isEdit ? "Edit Session" : "Record Session"}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="session-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-dm-sans">
            
            {/* Participant Search */}
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Participant *</label>
              
              {selectedParticipant ? (
                <div className="flex items-center justify-between p-3 border border-[#C9A84C] rounded-lg bg-[#C9A84C]/5">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{selectedParticipant.name}</p>
                    <p className="text-xs text-slate-500">{selectedParticipant.institute}</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setSelectedParticipant(null); setValue("participantId", "") }}
                    className="text-xs font-medium text-red-500 hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search participant by name..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setShowDropdown(true) }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full pl-10 pr-4 h-11 rounded-lg border border-slate-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none transition-all"
                  />
                  
                  {showDropdown && search && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-100 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center text-slate-500 text-sm">Searching...</div>
                      ) : participants.length > 0 ? (
                        <ul className="py-1">
                          {participants.map(p => (
                            <li key={p.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedParticipant(p)
                                  setValue("participantId", p.id)
                                  setShowDropdown(false)
                                  setSearch("")
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors"
                              >
                                <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                                <div className="text-xs text-slate-500">{p.institute}</div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 text-center text-slate-500 text-sm">No participants found.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {errors.participantId && <p className="text-red-500 text-xs mt-1">{errors.participantId.message as string}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mentor Name *</label>
                <input {...register("mentorName")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.mentorName ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="Mentor Name" />
                {errors.mentorName && <p className="text-red-500 text-xs mt-1">{errors.mentorName.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Session Date *</label>
                <input type="date" {...register("sessionDate")} max={format(new Date(), "yyyy-MM-dd")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.sessionDate ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} />
                {errors.sessionDate && <p className="text-red-500 text-xs mt-1">{errors.sessionDate.message as string}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Session Type *</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${sessionTypeWatch === 'ONE_ON_ONE' ? 'border-[#C9A84C] bg-[#C9A84C]/5 text-[#C9A84C]' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                  <input type="radio" value="ONE_ON_ONE" {...register("sessionType")} className="hidden" />
                  <User className="w-5 h-5" />
                  <span className="font-semibold text-sm">One-on-One</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${sessionTypeWatch === 'GROUP' ? 'border-purple-500 bg-purple-500/5 text-purple-600' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}>
                  <input type="radio" value="GROUP" {...register("sessionType")} className="hidden" />
                  <Users className="w-5 h-5" />
                  <span className="font-semibold text-sm">Group</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Target Audience *</label>
              <input {...register("targetAudience")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.targetAudience ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="e.g. Grade 9-10, Semester 3" />
              {errors.targetAudience && <p className="text-red-500 text-xs mt-1">{errors.targetAudience.message as string}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1 flex justify-between">
                <span>Notes</span>
                <span className="text-xs font-normal text-slate-400">{notesWatch?.length || 0}/500</span>
              </label>
              <textarea {...register("notes")} className="w-full rounded-lg border border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none p-3 resize-none h-24 text-sm" placeholder="Optional notes about the session..."></textarea>
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="session-form" 
            disabled={isLoading || !selectedParticipant}
            className="px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Session
          </button>
        </div>

      </div>
    </div>
  )
}
