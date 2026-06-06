"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X, Loader2, Users, User, ImagePlus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { fileToResizedDataUrl, ACTIVITY_IMAGE } from "@/lib/image"

const MAX_IMAGES = 8

const sessionSchema = z.object({
  mentorName: z.string().min(3, "Mentor name must be at least 3 characters"),
  sessionType: z.enum(["GROUP", "ONE_ON_ONE"]),
  sessionDate: z.string().min(1, "Date is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
})

type SessionFormValues = z.infer<typeof sessionSchema>

interface SessionModalProps {
  isOpen: boolean
  onClose: () => void
  sessionData?: any
  onSuccess: () => void
  participantId?: string // when adding from a participant's page, the session links to them
}

export function SessionModal({ isOpen, onClose, sessionData, onSuccess, participantId }: SessionModalProps) {
  const isEdit = !!sessionData
  const [isLoading, setIsLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      mentorName: "",
      sessionType: "ONE_ON_ONE",
      sessionDate: format(new Date(), "yyyy-MM-dd"),
      targetAudience: "",
      notes: "",
    },
  })

  const notesWatch = watch("notes")
  const sessionTypeWatch = watch("sessionType")

  useEffect(() => {
    if (!isOpen) return
    setImages(sessionData?.images || [])
    if (sessionData) {
      reset({
        mentorName: sessionData.mentorName,
        sessionType: sessionData.sessionType,
        sessionDate: format(new Date(sessionData.sessionDate), "yyyy-MM-dd"),
        targetAudience: sessionData.targetAudience,
        notes: sessionData.notes || "",
      })
    } else {
      reset({
        mentorName: "",
        sessionType: "ONE_ON_ONE",
        sessionDate: format(new Date(), "yyyy-MM-dd"),
        targetAudience: "",
        notes: "",
      })
    }
  }, [isOpen, sessionData, reset])

  if (!isOpen) return null

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ""
    if (files.length === 0) return
    const remaining = MAX_IMAGES - images.length
    if (remaining <= 0) {
      toast.error(`You can attach up to ${MAX_IMAGES} images`)
      return
    }
    setIsProcessing(true)
    try {
      const processed = await Promise.all(files.slice(0, remaining).map((f) => fileToResizedDataUrl(f, ACTIVITY_IMAGE)))
      setImages((prev) => [...prev, ...processed])
    } catch (error: any) {
      toast.error(error.message || "Could not process image")
    } finally {
      setIsProcessing(false)
    }
  }

  const onSubmit = async (data: SessionFormValues) => {
    if (new Date(data.sessionDate) > new Date()) {
      toast.error("Session date cannot be in the future")
      return
    }

    setIsLoading(true)
    try {
      const url = isEdit ? `/api/rfl/mentorship/${sessionData.id}` : "/api/rfl/mentorship"
      const payload = {
        ...data,
        images,
        participantId: participantId ?? sessionData?.participantId ?? null,
      }
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to save session")

      toast.success(`Session ${isEdit ? "updated" : "added"} successfully!`)
      onSuccess()
      onClose()
    } catch {
      toast.error("Failed to save session.")
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = (err?: boolean) =>
    `w-full rounded-lg border h-11 px-3 outline-none transition-all ${err ? "border-red-400" : "border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-playfair font-bold text-slate-800">
            {isEdit ? "Edit Session" : "Add Session"}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="session-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-dm-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mentor Name *</label>
                <input {...register("mentorName")} className={inputClass(!!errors.mentorName)} placeholder="Mentor Name" />
                {errors.mentorName && <p className="text-red-500 text-xs mt-1">{errors.mentorName.message as string}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Session Date *</label>
                <input type="date" {...register("sessionDate")} max={format(new Date(), "yyyy-MM-dd")} className={inputClass(!!errors.sessionDate)} />
                {errors.sessionDate && <p className="text-red-500 text-xs mt-1">{errors.sessionDate.message as string}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Session Type *</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${sessionTypeWatch === "ONE_ON_ONE" ? "border-[#C9A84C] bg-[#C9A84C]/5 text-[#C9A84C]" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}>
                  <input type="radio" value="ONE_ON_ONE" {...register("sessionType")} className="hidden" />
                  <User className="w-5 h-5" />
                  <span className="font-semibold text-sm">One-on-One</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${sessionTypeWatch === "GROUP" ? "border-purple-500 bg-purple-500/5 text-purple-600" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}>
                  <input type="radio" value="GROUP" {...register("sessionType")} className="hidden" />
                  <Users className="w-5 h-5" />
                  <span className="font-semibold text-sm">Group</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Target Audience *</label>
              <input {...register("targetAudience")} className={inputClass(!!errors.targetAudience)} placeholder="e.g. Grade 9-10, Semester 3" />
              {errors.targetAudience && <p className="text-red-500 text-xs mt-1">{errors.targetAudience.message as string}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 flex justify-between">
                <span>Notes</span>
                <span className="text-xs font-normal text-slate-400">{notesWatch?.length || 0}/500</span>
              </label>
              <textarea {...register("notes")} className="w-full rounded-lg border border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none p-3 resize-none h-24 text-sm" placeholder="Optional notes about the session..."></textarea>
            </div>

            {/* Pictures */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Pictures <span className="font-normal text-slate-400">({images.length}/{MAX_IMAGES})</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Session photo ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors disabled:opacity-50">
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                    <span className="text-[11px] font-medium">Add</span>
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddImages} />
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button type="submit" form="session-form" disabled={isLoading} className="px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors flex items-center gap-2 disabled:opacity-70">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Session
          </button>
        </div>
      </div>
    </div>
  )
}
