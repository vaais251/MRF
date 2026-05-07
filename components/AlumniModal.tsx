"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X, Loader2 } from "lucide-react"
import { toast } from "sonner"

const alumniSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  program: z.string().min(1, "Program is required"),
  institute: z.string().min(1, "Institute is required"),
  graduationYear: z.string().min(4, "Graduation year is required"),
  currentStatus: z.enum(["Employed", "Studying", "Entrepreneur", "Other"])
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
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AlumniFormValues>({
    resolver: zodResolver(alumniSchema),
    defaultValues: {
      name: "",
      program: "",
      institute: "",
      graduationYear: new Date().getFullYear().toString(),
      currentStatus: "Employed"
    }
  })

  useEffect(() => {
    if (isOpen) {
      if (alumniData) {
        reset({
          name: alumniData.name,
          program: alumniData.program,
          institute: alumniData.institute,
          graduationYear: alumniData.graduationYear.toString(),
          currentStatus: alumniData.currentStatus as any
        })
      } else {
        reset({
          name: "",
          program: "",
          institute: "",
          graduationYear: new Date().getFullYear().toString(),
          currentStatus: "Employed"
        })
      }
    }
  }, [isOpen, alumniData, reset])

  if (!isOpen) return null

  const onSubmit = async (data: AlumniFormValues) => {
    setIsLoading(true)
    try {
      const url = isEdit ? `/api/rfl/alumni/${alumniData.id}` : '/api/rfl/alumni'
      const method = isEdit ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error("Failed to save alumni")

      toast.success(`Alumni ${isEdit ? 'updated' : 'added'} successfully!`)
      onSuccess()
      onClose()
    } catch (error) {
      toast.error("Failed to save alumni.")
    } finally {
      setIsLoading(false)
    }
  }

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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                <input {...register("name")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.name ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="Full Name" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Program *</label>
                <input {...register("program")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.program ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="Program" />
                {errors.program && <p className="text-red-500 text-xs mt-1">{errors.program.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Institute *</label>
                <input {...register("institute")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.institute ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="Institute Name" />
                {errors.institute && <p className="text-red-500 text-xs mt-1">{errors.institute.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Graduation Year *</label>
                <select {...register("graduationYear")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.graduationYear ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {errors.graduationYear && <p className="text-red-500 text-xs mt-1">{errors.graduationYear.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Current Status *</label>
                <select {...register("currentStatus")} className="w-full rounded-lg border h-11 px-3 outline-none transition-all border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20">
                  <option value="Employed">Employed</option>
                  <option value="Studying">Studying</option>
                  <option value="Entrepreneur">Entrepreneur</option>
                  <option value="Other">Other</option>
                </select>
                {errors.currentStatus && <p className="text-red-500 text-xs mt-1">{errors.currentStatus.message}</p>}
              </div>
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
            form="alumni-form" 
            disabled={isLoading}
            className="px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Alumni
          </button>
        </div>

      </div>
    </div>
  )
}
