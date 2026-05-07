"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X, Loader2 } from "lucide-react"
import { toast } from "sonner"

const userSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  role: z.enum([
    "SUPER_ADMIN", "TRUST_MGMT", "PROGRAM_MANAGER", 
    "MEO_OFFICER", "SCHOOL_AUTHORITY", "HOSTEL_INCHARGE", "RFL_COORDINATOR"
  ])
}).refine(data => {
  if (!data.password && !data.confirmPassword) return true // Allow empty in edit mode if untouched
  return data.password === data.confirmPassword
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type UserFormValues = z.infer<typeof userSchema>

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  userData?: any
  onSuccess: () => void
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPER_ADMIN: "Full system access (IT/Trust leadership)",
  TRUST_MGMT: "High level viewing & reports for Trust Management",
  PROGRAM_MANAGER: "Manages multiple programs and operations",
  MEO_OFFICER: "Monitoring & Evaluation Officer, full read/write for M&E",
  SCHOOL_AUTHORITY: "Manages MRHSS related entities",
  HOSTEL_INCHARGE: "Manages MRA Hostel related entities",
  RFL_COORDINATOR: "Manages Roshni Future Leaders program"
}

export function UserModal({ isOpen, onClose, userData, onSuccess }: UserModalProps) {
  const isEdit = !!userData
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{label: string, color: string}>({ label: "Weak", color: "bg-red-500" })

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "RFL_COORDINATOR"
    }
  })

  const watchRole = watch("role", "RFL_COORDINATOR")
  const watchPassword = watch("password")

  useEffect(() => {
    if (watchPassword) {
      if (watchPassword.length >= 8 && /[A-Z]/.test(watchPassword) && /[0-9]/.test(watchPassword)) {
        setPasswordStrength({ label: "Strong", color: "bg-green-500" })
      } else if (watchPassword.length >= 8) {
        setPasswordStrength({ label: "Fair", color: "bg-amber-500" })
      } else {
        setPasswordStrength({ label: "Weak", color: "bg-red-500" })
      }
    }
  }, [watchPassword])

  useEffect(() => {
    if (isOpen) {
      if (userData) {
        reset({
          name: userData.name,
          email: userData.email,
          role: userData.role
        })
      } else {
        reset({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "RFL_COORDINATOR"
        })
      }
    }
  }, [isOpen, userData, reset])

  if (!isOpen) return null

  const onSubmit = async (data: UserFormValues) => {
    if (!isEdit && (!data.password || data.password.length < 8)) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)
    try {
      const url = isEdit ? `/api/users/${userData.id}` : '/api/users'
      const method = isEdit ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save user")
      }

      toast.success(`User ${isEdit ? 'updated' : 'created'} successfully!`)
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to save user.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-playfair font-bold text-slate-800">
            {isEdit ? "Edit User Role" : "Add New User"}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 font-dm-sans">
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
              <input {...register("name")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.name ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="Full Name" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address *</label>
              <input {...register("email")} disabled={isEdit} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 ${errors.email ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="Email" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              {isEdit && <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>}
            </div>

            {!isEdit && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1 flex justify-between">
                    <span>Password *</span>
                    {watchPassword && watchPassword.length > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    )}
                  </label>
                  <input type="password" {...register("password")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.password ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="Password" />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm Password *</label>
                  <input type="password" {...register("confirmPassword")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.confirmPassword ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="Confirm Password" />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Role *</label>
              <select {...register("role")} className="w-full rounded-lg border h-11 px-3 outline-none transition-all border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20">
                {Object.keys(ROLE_DESCRIPTIONS).map(r => (
                  <option key={r} value={r}>{r.replace("_", " ")}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-md border border-slate-100">
                <span className="font-semibold">{watchRole.replace("_", " ")}: </span>
                {ROLE_DESCRIPTIONS[watchRole]}
              </p>
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
            form="user-form" 
            disabled={isLoading}
            className="px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save User
          </button>
        </div>

      </div>
    </div>
  )
}
