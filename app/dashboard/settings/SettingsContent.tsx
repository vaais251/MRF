"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { User, Shield, Sliders, Loader2, Camera, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useTheme } from "next-themes"

export function SettingsContent({ user }: { user: any }) {
  const { update } = useSession()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("profile")
  
  // Profile State
  const [name, setName] = useState(user.name || "")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Security State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      })

      if (!res.ok) throw new Error("Failed to update profile")
      
      await update({ name }) // Update NextAuth session
      toast.success("Profile updated successfully")
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    setIsUpdatingPassword(true)
    try {
      const res = await fetch("/api/users/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update password")
      }
      
      toast.success("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Sliders },
  ]

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Tabs */}
      <div className="w-full md:w-64 flex-shrink-0 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                isActive 
                  ? "bg-mrt-navy text-white dark:bg-mrt-gold dark:text-slate-900 shadow-sm" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {activeTab === "profile" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Profile Information</h2>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-mrt-gold text-white flex items-center justify-center text-3xl font-bold font-playfair shadow-lg">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <button className="absolute inset-0 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6" />
                </button>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{user.name}</h3>
                <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 uppercase">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  value={user.email} 
                  disabled 
                  className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500">Email cannot be changed.</p>
              </div>
              <Button type="submit" className="bg-mrt-navy hover:bg-mrt-navy/90 text-white dark:bg-mrt-gold dark:text-slate-900 dark:hover:bg-mrt-gold/90" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </form>
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Security Settings</h2>
            
            <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password *</Label>
                <Input 
                  id="current" 
                  type="password"
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  required
                  className="bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password *</Label>
                <Input 
                  id="new" 
                  type="password"
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required
                  className="bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm New Password *</Label>
                <Input 
                  id="confirm" 
                  type="password"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required
                  className="bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <Button type="submit" className="bg-mrt-navy hover:bg-mrt-navy/90 text-white dark:bg-mrt-gold dark:text-slate-900 dark:hover:bg-mrt-gold/90" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Update Password
              </Button>
            </form>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Preferences</h2>
            
            <div className="space-y-8 max-w-md">
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">Theme</h3>
                <div className="flex gap-3">
                  {['light', 'dark', 'system'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        theme === t 
                          ? "border-mrt-gold bg-mrt-gold/5" 
                          : "border-slate-200 dark:border-slate-700 hover:border-mrt-gold/50"
                      }`}
                    >
                      <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
