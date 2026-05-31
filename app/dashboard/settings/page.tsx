import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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

  // Image lives in the DB (not the session cookie), so load it here.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true },
  })

  const user = {
    id: session.user.id,
    role: session.user.role,
    name: dbUser?.name ?? session.user.name,
    email: dbUser?.email ?? session.user.email,
    image: dbUser?.image ?? null,
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-slate-900 dark:text-white mb-2">Account Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your profile, security, and preferences</p>
        </div>
      </div>
      
      <SettingsContent user={user} />
    </div>
  )
}
