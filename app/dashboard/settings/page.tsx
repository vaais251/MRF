import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { SettingsContent } from "./SettingsContent"
import { redirect } from "next/navigation"

export const metadata = {
  title: 'Settings | MRT M&E System'
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-slate-900 dark:text-white mb-2">Account Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your profile, security, and preferences</p>
        </div>
      </div>
      
      <SettingsContent user={session.user} />
    </div>
  )
}
