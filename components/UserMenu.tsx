"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import type { Session } from "next-auth"
import { Camera, Settings, LogOut, ChevronDown, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Avatar } from "./Avatar"
import { fileToResizedDataUrl } from "@/lib/image"

export function UserMenu({ session, initialImage }: { session: Session; initialImage: string | null }) {
  const router = useRouter()
  const user = session.user

  const [image, setImage] = useState<string | null>(initialImage)
  const [open, setOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keep in sync if the server re-renders with a new image (e.g. after refresh)
  useEffect(() => { setImage(initialImage) }, [initialImage])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const role = (user?.role || "").replace(/_/g, " ")

  const saveImage = async (nextImage: string | null) => {
    setIsUploading(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: nextImage ?? "" }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to update picture")
      }
      setImage(nextImage)
      router.refresh() // re-render server components (sidebar avatar) with the new image
      toast.success(nextImage ? "Profile picture updated" : "Profile picture removed")
    } catch (error: any) {
      toast.error(error.message || "Failed to update picture")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    try {
      const dataUrl = await fileToResizedDataUrl(file, { maxSize: 256, quality: 0.85 })
      await saveImage(dataUrl)
    } catch (error: any) {
      toast.error(error.message || "Could not process image")
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 py-1 pl-1 pr-1 sm:pr-3 rounded-full border border-transparent sm:border-slate-100 sm:dark:border-slate-700 sm:bg-slate-50 sm:dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Avatar
          name={user?.name}
          image={image}
          className="w-8 h-8 bg-[#C9A84C]/20 text-[#C9A84C] text-xs shrink-0"
        />
        <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[10rem] truncate">
          {user?.name}
        </span>
        <span className="hidden md:inline-block text-[10px] uppercase font-bold text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
          {role}
        </span>
        <ChevronDown className={`hidden sm:block w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        >
          {/* Profile header */}
          <div className="p-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative group shrink-0">
              <Avatar
                name={user?.name}
                image={image}
                className="w-14 h-14 bg-[#C9A84C]/20 text-[#C9A84C] text-lg"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                aria-label="Change profile picture"
                className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity disabled:opacity-100"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </button>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              <span className="inline-block mt-1 text-[10px] uppercase font-bold text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                {role}
              </span>
            </div>
          </div>

          {/* Picture actions */}
          <div className="p-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <Camera className="w-4 h-4 text-slate-400" />
              {image ? "Change photo" : "Upload photo"}
            </button>
            {image && (
              <button
                type="button"
                onClick={() => saveImage(null)}
                disabled={isUploading}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Remove photo
              </button>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 p-2">
            <button
              type="button"
              onClick={() => { setOpen(false); router.push("/dashboard/settings") }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Account settings
            </button>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSelectImage} />
        </div>
      )}
    </div>
  )
}
