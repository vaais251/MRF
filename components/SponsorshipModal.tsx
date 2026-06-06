"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X, Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

const sponsorshipSchema = z.object({
  sponsorName: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum(["FULL", "PARTIAL", "MERIT_BASED", "NEED_BASED"]),
  amount: z.string().optional(),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "EXPIRED", "PENDING", "CANCELLED"]),
  participantId: z.string().optional().nullable(),
  notes: z.string().optional(),
  other: z.string().optional(),
}).refine(data => !data.endDate || new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"]
}).refine(data => !data.amount || parseFloat(data.amount) > 0, {
  message: "Amount must be a positive number",
  path: ["amount"]
})

type SponsorshipFormValues = z.infer<typeof sponsorshipSchema>

interface SponsorshipModalProps {
  isOpen: boolean
  onClose: () => void
  sponsorshipData?: any
  onSuccess: () => void
}

export function SponsorshipModal({ isOpen, onClose, sponsorshipData, onSuccess }: SponsorshipModalProps) {
  const isEdit = !!sponsorshipData
  const [isLoading, setIsLoading] = useState(false)
  
  // Participant search state
  const [participants, setParticipants] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null)
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<SponsorshipFormValues>({
    resolver: zodResolver(sponsorshipSchema),
    defaultValues: {
      sponsorName: "",
      type: "FULL",
      amount: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      status: "ACTIVE",
      participantId: "",
      notes: "",
      other: "",
    }
  })

  useEffect(() => {
    if (isOpen) {
      if (sponsorshipData) {
        reset({
          sponsorName: sponsorshipData.sponsorName,
          type: sponsorshipData.type,
          amount: sponsorshipData.amount ? sponsorshipData.amount.toString() : "",
          startDate: format(new Date(sponsorshipData.startDate), "yyyy-MM-dd"),
          endDate: sponsorshipData.endDate ? format(new Date(sponsorshipData.endDate), "yyyy-MM-dd") : "",
          status: sponsorshipData.status,
          participantId: sponsorshipData.participantId || "",
          notes: sponsorshipData.notes || "",
          other: sponsorshipData.other || "",
        })
        // Show the real participant name (fetch if the record doesn't include it)
        if (sponsorshipData.participant) {
          setSelectedParticipant(sponsorshipData.participant)
        } else if (sponsorshipData.participantId) {
          setSelectedParticipant({ id: sponsorshipData.participantId, name: "Loading…", institute: "" })
          fetch(`/api/rfl/participants/${sponsorshipData.participantId}`)
            .then(r => r.ok ? r.json() : null)
            .then(p => p && setSelectedParticipant({ id: p.id, name: p.name, institute: p.institute }))
            .catch(() => {})
        }
      } else {
        reset({
          sponsorName: "",
          type: "FULL",
          amount: "",
          startDate: format(new Date(), "yyyy-MM-dd"),
          endDate: "",
          status: "ACTIVE",
          participantId: "",
          notes: "",
          other: "",
        })
        setSelectedParticipant(null)
      }
    }
  }, [isOpen, sponsorshipData, reset])

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

  const onSubmit = async (data: SponsorshipFormValues) => {
    setIsLoading(true)
    try {
      const url = isEdit ? `/api/rfl/sponsorships/${sponsorshipData.id}` : '/api/rfl/sponsorships'
      const method = isEdit ? 'PUT' : 'POST'
      
      const payload = {
        ...data,
        amount: data.amount ? parseFloat(data.amount) : null,
        endDate: data.endDate ? data.endDate : null,
        participantId: data.participantId ? data.participantId : null,
        other: data.other || null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Failed to save sponsorship")

      toast.success(`Sponsorship ${isEdit ? 'updated' : 'added'} successfully!`)
      onSuccess()
      onClose()
    } catch (error) {
      toast.error("Failed to save sponsorship.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-playfair font-bold text-slate-800">
            {isEdit ? "Edit Sponsorship" : "Add Sponsorship"}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="sponsorship-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-dm-sans">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Sponsor Name *</label>
                <input {...register("sponsorName")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.sponsorName ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="Sponsor Name" />
                {errors.sponsorName && <p className="text-red-500 text-xs mt-1">{errors.sponsorName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Sponsorship Type *</label>
                <select {...register("type")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.type ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`}>
                  <option value="FULL">Full</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="MERIT_BASED">Merit Based</option>
                  <option value="NEED_BASED">Need Based</option>
                </select>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date *</label>
                <input type="date" {...register("startDate")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.startDate ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">End Date</label>
                <input type="date" {...register("endDate")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.endDate ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (PKR)</label>
                <input type="number" step="0.01" {...register("amount")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.amount ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="E.g. 50000" />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status *</label>
                <select {...register("status")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.status ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`}>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="PENDING">Pending</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Linked Participant (Optional)</label>
              
              {selectedParticipant ? (
                <div className="flex items-center justify-between p-3 border border-[#C9A84C] rounded-lg bg-[#C9A84C]/5">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{selectedParticipant.name}</p>
                    {selectedParticipant.institute && (
                      <p className="text-xs text-slate-500">{selectedParticipant.institute}</p>
                    )}
                  </div>
                  <button
                    type="button" 
                    onClick={() => { setSelectedParticipant(null); setValue("participantId", "") }}
                    className="text-xs font-medium text-red-500 hover:underline"
                  >
                    Clear
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
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
              <textarea {...register("notes")} className="w-full rounded-lg border border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none p-3 resize-none h-24 text-sm" placeholder="Optional notes..."></textarea>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Other</label>
              <textarea {...register("other")} className="w-full rounded-lg border border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none p-3 resize-none h-24 text-sm" placeholder="remarks/comment"></textarea>
            </div>

          </form>
        </div>

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
            form="sponsorship-form" 
            disabled={isLoading}
            className="px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Sponsorship
          </button>
        </div>

      </div>
    </div>
  )
}
