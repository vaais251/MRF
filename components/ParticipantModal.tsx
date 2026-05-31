"use client"

import { useState, useEffect, useRef } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X, Plus, Trash2, Loader2, Camera } from "lucide-react"
import { toast } from "sonner"
import { Avatar } from "@/components/Avatar"
import { fileToResizedDataUrl, PROFILE_IMAGE } from "@/lib/image"

const academicResultSchema = z.object({
  subjectName: z.string().min(1, "Required"),
  grade: z.string().min(1, "Required"),
  semester: z.string().min(1, "Required")
})

const participantSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  program: z.string().min(1, "Program is required"),
  institute: z.string().min(1, "Institute is required"),
  startYear: z.number().min(2000).max(2030),
  endYear: z.number().min(2000).max(2030),
  currentSemester: z.number().min(1).max(8),
  status: z.enum(["ACTIVE", "COMPLETED", "DROPPED", "ON_HOLD"]).optional(),
  academicResults: z.array(academicResultSchema).max(10, "Max 10 subjects")
}).refine(data => data.endYear > data.startYear, {
  message: "End Year must be greater than Start Year",
  path: ["endYear"]
})

type ParticipantFormValues = z.infer<typeof participantSchema>

interface ParticipantModalProps {
  isOpen: boolean
  onClose: () => void
  participant?: any // if provided, it's edit mode
  onSuccess: () => void
}

export function ParticipantModal({ isOpen, onClose, participant, onSuccess }: ParticipantModalProps) {
  const isEdit = !!participant
  const [isLoading, setIsLoading] = useState(false)
  const [image, setImage] = useState<string | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ParticipantFormValues>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      name: "",
      program: "",
      institute: "",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 4,
      currentSemester: 1,
      status: "ACTIVE",
      academicResults: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "academicResults"
  })

  const startYear = watch("startYear")
  const watchedName = watch("name")

  useEffect(() => {
    if (startYear && !isEdit) {
      setValue("endYear", parseInt(startYear.toString()) + 4)
    }
  }, [startYear, isEdit, setValue])

  useEffect(() => {
    if (isOpen) {
      setImage(participant?.image || null)
      if (participant) {
        reset({
          name: participant.name,
          program: participant.program,
          institute: participant.institute,
          startYear: participant.startYear,
          endYear: participant.endYear,
          currentSemester: participant.currentSemester,
          status: participant.status,
          academicResults: participant.academicResults || []
        })
      } else {
        reset({
          name: "",
          program: "",
          institute: "",
          startYear: new Date().getFullYear(),
          endYear: new Date().getFullYear() + 4,
          currentSemester: 1,
          status: "ACTIVE",
          academicResults: []
        })
      }
    }
  }, [isOpen, participant, reset])

  if (!isOpen) return null

  const onSubmit = async (data: ParticipantFormValues) => {
    setIsLoading(true)
    try {
      const url = isEdit ? `/api/rfl/participants/${participant.id}` : '/api/rfl/participants'
      const method = isEdit ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, image })
      })

      if (!res.ok) {
        throw new Error("Failed to save participant")
      }

      toast.success(`Participant ${isEdit ? 'updated' : 'added'} successfully!`)
      onSuccess()
      onClose()
    } catch {
      toast.error("Failed to save participant.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-playfair font-bold text-slate-800">
            {isEdit ? "Edit Participant" : "Add New Participant"}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="participant-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-dm-sans">

            {/* Profile photo */}
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <Avatar
                  name={watchedName}
                  image={image}
                  className="w-20 h-20 bg-[#C9A84C]/20 text-[#C9A84C] text-2xl border border-slate-100"
                />
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
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                    className="text-sm font-medium text-[#C9A84C] hover:text-[#B8943D] disabled:opacity-50"
                  >
                    {image ? "Change photo" : "Upload photo"}
                  </button>
                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">Optional · JPG or PNG, auto-resized.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input {...register("name")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.name ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="John Doe" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Program *</label>
                  <input {...register("program")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.program ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="BS Computer Science" />
                  {errors.program && <p className="text-red-500 text-xs mt-1">{errors.program.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Institute *</label>
                  <input {...register("institute")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.institute ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="University Name" />
                  {errors.institute && <p className="text-red-500 text-xs mt-1">{errors.institute.message}</p>}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Start Year *</label>
                  <input type="number" {...register("startYear", { valueAsNumber: true })} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.startYear ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} />
                  {errors.startYear && <p className="text-red-500 text-xs mt-1">{errors.startYear.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">End Year *</label>
                  <input type="number" {...register("endYear", { valueAsNumber: true })} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.endYear ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} />
                  {errors.endYear && <p className="text-red-500 text-xs mt-1">{errors.endYear.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Current Semester *</label>
                  <select {...register("currentSemester", { valueAsNumber: true })} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.currentSemester ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`}>
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                  {errors.currentSemester && <p className="text-red-500 text-xs mt-1">{errors.currentSemester.message}</p>}
                </div>
              </div>
            </div>

            {isEdit && (
              <div className="w-full">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                <select {...register("status")} className="w-full rounded-lg border h-11 px-3 outline-none border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20">
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DROPPED">Dropped</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </div>
            )}

            {/* Academic Results Section */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Academic Results</h3>
                <button 
                  type="button" 
                  onClick={() => {
                    if (fields.length < 10) append({ subjectName: "", grade: "", semester: "1" })
                  }}
                  className="flex items-center gap-1 text-sm font-medium text-[#C9A84C] hover:text-[#B8943D]"
                  disabled={fields.length >= 10}
                >
                  <Plus className="w-4 h-4" /> Add Subject
                </button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input {...register(`academicResults.${index}.subjectName`)} placeholder="Subject Name" className={`w-full rounded-lg border h-10 px-3 text-sm outline-none ${errors.academicResults?.[index]?.subjectName ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C]'}`} />
                    </div>
                    <div className="w-24">
                      <input {...register(`academicResults.${index}.grade`)} placeholder="Grade" className={`w-full rounded-lg border h-10 px-3 text-sm outline-none ${errors.academicResults?.[index]?.grade ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C]'}`} />
                    </div>
                    <div className="w-28">
                      <select {...register(`academicResults.${index}.semester`)} className={`w-full rounded-lg border h-10 px-3 text-sm outline-none ${errors.academicResults?.[index]?.semester ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C]'}`}>
                        {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>Sem {sem}</option>)}
                      </select>
                    </div>
                    <button type="button" onClick={() => remove(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg mt-0.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {fields.length === 0 && <p className="text-sm text-slate-400 italic">No subjects added yet.</p>}
                {errors.academicResults?.root && <p className="text-red-500 text-xs">{errors.academicResults.root.message}</p>}
              </div>
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
            form="participant-form" 
            disabled={isLoading}
            className="px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Participant
          </button>
        </div>

      </div>
    </div>
  )
}
