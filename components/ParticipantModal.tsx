"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X, Plus, Trash2, Loader2, Camera, ImagePlus } from "lucide-react"
import { toast } from "sonner"
import { Avatar } from "@/components/Avatar"
import { fileToResizedDataUrl, PROFILE_IMAGE, ACTIVITY_IMAGE } from "@/lib/image"

const COURSE_TYPES = ["Annual", "Semester System", "Course", "Other"] as const

const participantSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  program: z.string().min(1, "Program is required"),
  institute: z.string().min(1, "Institute is required"),
  startYear: z.number().min(2000).max(2035),
  endYear: z.number().min(2000).max(2035),
  courseType: z.enum(COURSE_TYPES),
  currentYear: z.number().optional(),
  currentSemester: z.number().optional(),
  duration: z.string().optional(),
  fieldRemarks: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "DROPPED", "ON_HOLD"]).optional(),
}).refine(d => d.endYear > d.startYear, {
  message: "End Year must be greater than Start Year",
  path: ["endYear"],
})

type ParticipantFormValues = z.infer<typeof participantSchema>

interface ResultRow {
  name: string
  period: string
  grade: string
  percentage: string
  gpa: string
  cgpa: string
  comments: string
  file: string | null
}

function periodOptions(courseType: string): string[] {
  switch (courseType) {
    case "Annual":
      return ["1st Year", "2nd Year", "3rd Year", "4th Year", "Mid Term", "Other"]
    case "Semester System":
      return [...Array.from({ length: 10 }, (_, i) => `Semester ${i + 1}`), "Mid Term", "Other"]
    case "Course":
      return ["Course", "Mid Term", "Other"]
    default:
      return ["Other"]
  }
}

const isSemester = (period: string) => (period || "").startsWith("Semester")

function emptyResult(period = ""): ResultRow {
  return { name: "", period, grade: "", percentage: "", gpa: "", cgpa: "", comments: "", file: null }
}

// Normalize results that may be in the old shape {subjectName, grade, semester}
function normalizeResults(raw: any): ResultRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map((r) => ({
    name: r.name ?? r.subjectName ?? "",
    period: r.period ?? (r.semester ? `Semester ${r.semester}` : ""),
    grade: r.grade ?? "",
    percentage: r.percentage ?? "",
    gpa: r.gpa ?? "",
    cgpa: r.cgpa ?? "",
    comments: r.comments ?? "",
    file: r.file ?? null,
  }))
}

interface ParticipantModalProps {
  isOpen: boolean
  onClose: () => void
  participant?: any // edit mode if provided
  onSuccess: () => void
}

export function ParticipantModal({ isOpen, onClose, participant, onSuccess }: ParticipantModalProps) {
  const isEdit = !!participant
  const [isLoading, setIsLoading] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [results, setResults] = useState<ResultRow[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ParticipantFormValues>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      name: "", program: "", institute: "",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 4,
      courseType: "Semester System",
      status: "ACTIVE",
    },
  })

  const courseType = watch("courseType")
  const watchedName = watch("name")

  useEffect(() => {
    if (!isOpen) return
    setImage(participant?.image || null)
    setResults(normalizeResults(participant?.academicResults))
    if (participant) {
      reset({
        name: participant.name,
        program: participant.program,
        institute: participant.institute,
        startYear: participant.startYear,
        endYear: participant.endYear,
        courseType: participant.courseType || "Semester System",
        currentYear: participant.currentYear ?? undefined,
        currentSemester: participant.currentSemester ?? undefined,
        duration: participant.duration ?? "",
        fieldRemarks: participant.fieldRemarks ?? "",
        status: participant.status,
      })
    } else {
      reset({
        name: "", program: "", institute: "",
        startYear: new Date().getFullYear(),
        endYear: new Date().getFullYear() + 4,
        courseType: "Semester System",
        currentYear: undefined, currentSemester: undefined, duration: "", fieldRemarks: "",
        status: "ACTIVE",
      })
    }
  }, [isOpen, participant, reset])

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

  const updateResult = (index: number, patch: Partial<ResultRow>) => {
    setResults((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const addResult = () => {
    const opts = periodOptions(courseType)
    setResults((prev) => [...prev, emptyResult(opts[0] || "")])
  }

  const handleResultFile = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    try {
      const url = await fileToResizedDataUrl(file, ACTIVITY_IMAGE)
      updateResult(index, { file: url })
    } catch (error: any) {
      toast.error(error.message || "Could not process file")
    }
  }

  const onSubmit = async (data: ParticipantFormValues) => {
    setIsLoading(true)
    try {
      // Keep only the conditional field relevant to the chosen course type
      const payload: any = {
        name: data.name,
        program: data.program,
        institute: data.institute,
        startYear: data.startYear,
        endYear: data.endYear,
        courseType: data.courseType,
        status: data.status,
        currentYear: data.courseType === "Annual" ? data.currentYear : null,
        currentSemester: data.courseType === "Semester System" ? data.currentSemester : null,
        duration: data.courseType === "Course" ? data.duration : null,
        fieldRemarks: data.courseType === "Other" ? data.fieldRemarks : null,
        academicResults: results,
        image,
      }

      const url = isEdit ? `/api/rfl/participants/${participant.id}` : "/api/rfl/participants"
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to save participant")

      toast.success(`Participant ${isEdit ? "updated" : "added"} successfully!`)
      onSuccess()
      onClose()
    } catch {
      toast.error("Failed to save participant.")
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = (hasError?: boolean) =>
    `w-full rounded-lg border h-11 px-3 outline-none transition-all ${hasError ? "border-red-400 focus:ring-red-400/20" : "border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"}`
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1"
  const smallInput = "w-full rounded-lg border h-10 px-3 text-sm outline-none border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[720px] max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-playfair font-bold text-slate-800">
            {isEdit ? "Edit Participant" : "Add New Participant"}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="participant-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-dm-sans">
            {/* Profile photo */}
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <Avatar name={watchedName} image={image} className="w-20 h-20 bg-[#C9A84C]/20 text-[#C9A84C] text-2xl border border-slate-100" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  aria-label="Add participant photo"
                  className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity disabled:opacity-100"
                >
                  {isProcessingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSelectImage} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Participant Photo</p>
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

            {/* Main fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input {...register("name")} className={inputClass(!!errors.name)} placeholder="John Doe" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Program *</label>
                  <input {...register("program")} className={inputClass(!!errors.program)} placeholder="BS Computer Science" />
                  {errors.program && <p className="text-red-500 text-xs mt-1">{errors.program.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Institute *</label>
                  <input {...register("institute")} className={inputClass(!!errors.institute)} placeholder="University Name" />
                  {errors.institute && <p className="text-red-500 text-xs mt-1">{errors.institute.message}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Start Year *</label>
                  <input type="number" {...register("startYear", { valueAsNumber: true })} className={inputClass(!!errors.startYear)} />
                  {errors.startYear && <p className="text-red-500 text-xs mt-1">{errors.startYear.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>End Year *</label>
                  <input type="number" {...register("endYear", { valueAsNumber: true })} className={inputClass(!!errors.endYear)} />
                  {errors.endYear && <p className="text-red-500 text-xs mt-1">{errors.endYear.message}</p>}
                </div>
              </div>
            </div>

            {/* Course Type + conditional field */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Course Type *</label>
                <select {...register("courseType")} className={inputClass(!!errors.courseType)}>
                  {COURSE_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                {courseType === "Annual" && (
                  <>
                    <label className={labelClass}>Current Year</label>
                    <select {...register("currentYear", { setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)) })} className={inputClass()}>
                      <option value="">Select year</option>
                      {[1, 2, 3, 4].map((y) => <option key={y} value={y}>{["1st", "2nd", "3rd", "4th"][y - 1]} year</option>)}
                    </select>
                  </>
                )}
                {courseType === "Semester System" && (
                  <>
                    <label className={labelClass}>Current Semester</label>
                    <select {...register("currentSemester", { setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)) })} className={inputClass()}>
                      <option value="">Select semester</option>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </>
                )}
                {courseType === "Course" && (
                  <>
                    <label className={labelClass}>Duration</label>
                    <input {...register("duration")} className={inputClass()} placeholder="e.g. 6 months, 1 year" />
                  </>
                )}
                {courseType === "Other" && (
                  <>
                    <label className={labelClass}>Field Remarks</label>
                    <input {...register("fieldRemarks")} className={inputClass()} placeholder="Describe the program" />
                  </>
                )}
              </div>
            </div>

            {isEdit && (
              <div className="w-full">
                <label className={labelClass}>Status</label>
                <select {...register("status")} className={inputClass()}>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DROPPED">Dropped</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </div>
            )}

            {/* Academic Results */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Academic Results</h3>
                <button type="button" onClick={addResult} className="flex items-center gap-1 text-sm font-medium text-[#C9A84C] hover:text-[#B8943D]">
                  <Plus className="w-4 h-4" /> Add Result
                </button>
              </div>

              <div className="space-y-4">
                {results.map((r, index) => {
                  const opts = periodOptions(courseType)
                  const sem = isSemester(r.period)
                  return (
                    <div key={index} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <input value={r.name} onChange={(e) => updateResult(index, { name: e.target.value })} placeholder="Result / Subject name" className={smallInput} />
                        </div>
                        <div className="w-40">
                          <select value={r.period} onChange={(e) => updateResult(index, { period: e.target.value })} className={smallInput}>
                            {!opts.includes(r.period) && r.period && <option value={r.period}>{r.period}</option>}
                            {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <button type="button" onClick={() => setResults((prev) => prev.filter((_, i) => i !== index))} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {sem ? (
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Percentage</label>
                            <input value={r.percentage} onChange={(e) => updateResult(index, { percentage: e.target.value })} placeholder="%" className={smallInput} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">GPA</label>
                            <input value={r.gpa} onChange={(e) => updateResult(index, { gpa: e.target.value })} placeholder="GPA" className={smallInput} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">CGPA</label>
                            <input value={r.cgpa} onChange={(e) => updateResult(index, { cgpa: e.target.value })} placeholder="CGPA" className={smallInput} />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Grade / Result</label>
                          <input value={r.grade} onChange={(e) => updateResult(index, { grade: e.target.value })} placeholder="e.g. A, 85%, Pass" className={smallInput} />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Comments / Remarks</label>
                        <input value={r.comments} onChange={(e) => updateResult(index, { comments: e.target.value })} placeholder="Optional comments" className={smallInput} />
                      </div>

                      {/* Upload result */}
                      <div className="flex items-center gap-3">
                        {r.file ? (
                          <div className="relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={r.file} alt="Result" className="h-14 w-14 rounded-md object-cover border border-slate-200" />
                            <button type="button" onClick={() => updateResult(index, { file: null })} className="absolute -top-2 -right-2 p-1 bg-black/60 text-white rounded-full hover:bg-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors cursor-pointer text-sm">
                            <ImagePlus className="w-4 h-4" /> Upload result
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleResultFile(index, e)} />
                          </label>
                        )}
                      </div>
                    </div>
                  )
                })}
                {results.length === 0 && <p className="text-sm text-slate-400 italic">No results added yet.</p>}
              </div>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button type="submit" form="participant-form" disabled={isLoading} className="px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors flex items-center gap-2 disabled:opacity-70">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Participant
          </button>
        </div>
      </div>
    </div>
  )
}
