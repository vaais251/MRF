"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

const activitySchema = z.object({
  activityName: z.string().min(3, "Name must be at least 3 characters"),
  type: z.enum(["Workshop", "Seminar", "Meetup", "Other"]),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["Upcoming", "Completed", "Cancelled"])
})

type ActivityFormValues = z.infer<typeof activitySchema>

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  alumniId: string
  onSuccess: () => void
}

export function ActivityModal({ isOpen, onClose, alumniId, onSuccess }: ActivityModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      activityName: "",
      type: "Meetup",
      date: format(new Date(), "yyyy-MM-dd"),
      status: "Completed"
    }
  })

  if (!isOpen) return null

  const onSubmit = async (data: ActivityFormValues) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/rfl/alumni/${alumniId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error("Failed to save activity")

      toast.success(`Activity added successfully!`)
      reset()
      onSuccess()
      onClose()
    } catch (error) {
      toast.error("Failed to save activity.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-playfair font-bold text-slate-800">
            Add Activity
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="activity-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-dm-sans">
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Activity Name *</label>
              <input {...register("activityName")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.activityName ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="E.g. Annual Tech Meetup" />
              {errors.activityName && <p className="text-red-500 text-xs mt-1">{errors.activityName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Activity Type *</label>
              <select {...register("type")} className="w-full rounded-lg border h-11 px-3 outline-none transition-all border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20">
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Meetup">Meetup</option>
                <option value="Other">Other</option>
              </select>
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Date *</label>
              <input type="date" {...register("date")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.date ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status *</label>
              <select {...register("status")} className="w-full rounded-lg border h-11 px-3 outline-none transition-all border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20">
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
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
            form="activity-form" 
            disabled={isLoading}
            className="px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Activity
          </button>
        </div>

      </div>
    </div>
  )
}
