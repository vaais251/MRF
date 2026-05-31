"use client"

import { useState, useRef, useEffect } from "react"
import { X, Loader2, ImagePlus, Trash2, CalendarDays } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { fileToResizedDataUrl, ACTIVITY_IMAGE } from "@/lib/image"

const MAX_IMAGES = 10

interface ActivityRecord {
  id: string
  title: string
  description: string
  date: string
  location?: string | null
  notes?: string | null
  images: string[]
}

interface ActivityFormModalProps {
  isOpen: boolean
  onClose: () => void
  activity?: ActivityRecord | null
  onSuccess: () => void
}

export function ActivityFormModal({ isOpen, onClose, activity, onSuccess }: ActivityFormModalProps) {
  const isEdit = Boolean(activity)
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTitle(activity?.title || "")
      setDate(activity?.date ? format(new Date(activity.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"))
      setLocation(activity?.location || "")
      setDescription(activity?.description || "")
      setNotes(activity?.notes || "")
      setImages(activity?.images || [])
    }
  }, [isOpen, activity])

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
    const toProcess = files.slice(0, remaining)
    if (files.length > remaining) {
      toast.warning(`Only ${remaining} more image(s) could be added`)
    }

    setIsProcessing(true)
    try {
      const processed = await Promise.all(
        toProcess.map((file) => fileToResizedDataUrl(file, ACTIVITY_IMAGE))
      )
      setImages((prev) => [...prev, ...processed])
    } catch (error: any) {
      toast.error(error.message || "Could not process one of the images")
    } finally {
      setIsProcessing(false)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim() || !date) {
      toast.error("Please fill in the title, date and description")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        date,
        location: location.trim() || null,
        notes: notes.trim() || null,
        images,
      }
      const res = await fetch(isEdit ? `/api/activities/${activity!.id}` : "/api/activities", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to save activity")
      }
      toast.success(isEdit ? "Activity updated" : "Activity published")
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to save activity")
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass =
    "w-full rounded-lg border h-11 px-3 outline-none transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"
  const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 className="text-xl font-playfair font-bold text-slate-800 dark:text-white">
            {isEdit ? "Edit Activity" : "New Activity"}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="activity-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="E.g. Annual Sports Day 2026"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date *</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={inputClass}
                  placeholder="E.g. MRHSS Main Campus"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={inputClass.replace("h-11", "min-h-[7rem] py-3")}
                placeholder="What happened during this activity?"
              />
            </div>

            <div>
              <label className={labelClass}>Additional Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={inputClass.replace("h-11", "min-h-[4rem] py-3")}
                placeholder="Optional internal notes, outcomes, follow-ups…"
              />
            </div>

            <div>
              <label className={labelClass}>Photos <span className="font-normal text-slate-400">({images.length}/{MAX_IMAGES})</span></label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((img, index) => (
                  <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      aria-label="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="aspect-square rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                    <span className="text-[11px] font-medium">Add</span>
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddImages} />
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="activity-form"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
            {isEdit ? "Save Changes" : "Publish Activity"}
          </button>
        </div>
      </div>
    </div>
  )
}
