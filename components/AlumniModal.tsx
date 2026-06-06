"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X, Loader2, Camera, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Avatar } from "@/components/Avatar"
import { fileToResizedDataUrl, PROFILE_IMAGE } from "@/lib/image"

const alumniSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  program: z.string().min(1, "Program is required"),
  institute: z.string().min(1, "Institute is required"),
  graduationYear: z.string().min(4, "Graduation year is required"),
  currentStatus: z.enum(["Employed", "Studying", "Entrepreneur", "Other"]),
  tenure: z.string().optional(),
  qualification: z.string().optional(),
  professionalJourney: z.string().optional(),
})

type AlumniFormValues = z.infer<typeof alumniSchema>

interface AlumniModalProps {
  isOpen: boolean
  onClose: () => void
  alumniData?: any
  onSuccess: () => void
}

export function AlumniModal({ isOpen, onClose, alumniData, onSuccess }: AlumniModalProps) {
  const isEdit = !!alumniData
  const [isLoading, setIsLoading] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<AlumniFormValues>({
    resolver: zodResolver(alumniSchema),
    defaultValues: {
      name: "",
      program: "",
      institute: "",
      graduationYear: new Date().getFullYear().toString(),
      currentStatus: "Employed",
      tenure: "",
      qualification: "",
      professionalJourney: "",
    },
  })

  const watchedName = watch("name")

  useEffect(() => {
    if (!isOpen) return
    setImage(alumniData?.image || null)
    if (alumniData) {
      reset({
        name: alumniData.name,
        program: alumniData.program,
        institute: alumniData.institute,
        graduationYear: alumniData.graduationYear.toString(),
        currentStatus: alumniData.currentStatus,
        tenure: alumniData.tenure || "",
        qualification: alumniData.qualification || "",
        professionalJourney: alumniData.professionalJourney || "",
      })
    } else {
      reset({
        name: "",
        program: "",
        institute: "",
        graduationYear: new Date().getFullYear().toString(),
        currentStatus: "Employed",
        tenure: "",
        qualification: "",
        professionalJourney: "",
      })
    }
  }, [isOpen, alumniData, reset])

  if (!isOpen) return null

  const handleSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setIsProcessingImage(true)
    try {
      setImage(await fileToResizedDataUrl(file, PROFILE_IMAGE))
    } catch (error: any) {
      toast.error(error.message || "Could not process image")
    } finally {
      setIsProcessingImage(false)
    }
  }

  const onSubmit = async (data: AlumniFormValues) => {
    setIsLoading(true)
    try {
      const url = isEdit ? `/api/rfl/alumni/${alumniData.id}` : "/api/rfl/alumni"
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, image }),
      })
      if (!res.ok) throw new Error("Failed to save alumni")

      toast.success(`Alumni ${isEdit ? "updated" : "added"} successfully!`)
      onSuccess()
      onClose()
    } catch {
      toast.error("Failed to save alumni.")
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = (err?: boolean) =>
    `w-full rounded-lg border h-11 px-3 outline-none transition-all ${err ? "border-red-400" : "border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"}`
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1"
  const years = Array.from({ length: 21 }, (_, i) => (2010 + i).toString())

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-playfair font-bold text-slate-800">
            {isEdit ? "Edit Alumni" : "Add New Alumni"}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="alumni-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-dm-sans">
            {/* Profile photo */}
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <Avatar name={watchedName} image={image} className="w-20 h-20 bg-[#C9A84C]/20 text-[#C9A84C] text-2xl border border-slate-100" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  aria-label="Add alumni photo"
                  className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity disabled:opacity-100"
                >
                  {isProcessingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSelectImage} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Alumni Photo</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isProcessingImage} className="text-sm font-medium text-[#C9A84C] hover:text-[#B8943D] disabled:opacity-50">
                    {image ? "Change photo" : "Upload photo"}
                  </button>
                  {image && (
                    <button type="button" onClick={() => setImage(null)} className="inline-flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">Optional · JPG or PNG, auto-resized.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input {...register("name")} className={inputClass(!!errors.name)} placeholder="Full Name" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className={labelClass}>Program *</label>
                <input {...register("program")} className={inputClass(!!errors.program)} placeholder="Program" />
                {errors.program && <p className="text-red-500 text-xs mt-1">{errors.program.message}</p>}
              </div>

              <div>
                <label className={labelClass}>Institute *</label>
                <input {...register("institute")} className={inputClass(!!errors.institute)} placeholder="Institute Name" />
                {errors.institute && <p className="text-red-500 text-xs mt-1">{errors.institute.message}</p>}
              </div>

              <div>
                <label className={labelClass}>Graduation Year *</label>
                <select {...register("graduationYear")} className={inputClass(!!errors.graduationYear)}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {errors.graduationYear && <p className="text-red-500 text-xs mt-1">{errors.graduationYear.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Current Status *</label>
                <select {...register("currentStatus")} className={inputClass()}>
                  <option value="Employed">Employed</option>
                  <option value="Studying">Studying</option>
                  <option value="Entrepreneur">Entrepreneur</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Tenure</label>
                <input {...register("tenure")} className={inputClass()} placeholder="e.g. 2018 – 2022" />
              </div>

              <div>
                <label className={labelClass}>Qualification</label>
                <input {...register("qualification")} className={inputClass()} placeholder="e.g. BS Computer Science" />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Professional Journey after MRA</label>
                <textarea
                  {...register("professionalJourney")}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none p-3 resize-none text-sm"
                  placeholder="Roles, achievements, current path…"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button type="submit" form="alumni-form" disabled={isLoading} className="px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors flex items-center gap-2 disabled:opacity-70">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Alumni
          </button>
        </div>
      </div>
    </div>
  )
}
