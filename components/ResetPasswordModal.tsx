"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

const resetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type ResetFormValues = z.infer<typeof resetSchema>

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
}

export function ResetPasswordModal({ isOpen, onClose, user }: ResetPasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{label: string, color: string}>({ label: "Weak", color: "bg-red-500" })

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" }
  })

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

  if (!isOpen || !user) return null

  const onSubmit = async (data: ResetFormValues) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: data.password })
      })

      if (!res.ok) throw new Error("Failed to reset password")

      toast.success(`Password reset for ${user.email}`)
      reset()
      onClose()
    } catch (error) {
      toast.error("Failed to reset password.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-playfair font-bold text-slate-800">
            Reset Password
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-3 p-4 mb-6 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <span className="font-bold">Warning: </span> 
              You are resetting the password for <strong className="font-bold">{user.email}</strong>. 
              The user will be notified via system notification.
            </div>
          </div>

          <form id="reset-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-dm-sans">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1 flex justify-between">
                <span>New Password *</span>
                {watchPassword && watchPassword.length > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                )}
              </label>
              <input type="password" {...register("password")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.password ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="New Password" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm Password *</label>
              <input type="password" {...register("confirmPassword")} className={`w-full rounded-lg border h-11 px-3 outline-none transition-all ${errors.confirmPassword ? 'border-red-400' : 'border-gray-200 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20'}`} placeholder="Confirm Password" />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
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
            form="reset-form" 
            disabled={isLoading}
            className="px-5 py-2.5 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Reset Password
          </button>
        </div>

      </div>
    </div>
  )
}
