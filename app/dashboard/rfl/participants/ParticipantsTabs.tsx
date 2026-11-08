import Link from "next/link"
import { CalendarDays, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { id: "participants", label: "Participants", href: "/dashboard/rfl/participants", icon: Users },
  { id: "activities", label: "Activities", href: "/dashboard/rfl/participants/activities", icon: CalendarDays },
] as const

export function ParticipantsTabs({ active, canViewParticipants = true }: {
  active: (typeof tabs)[number]["id"]
  canViewParticipants?: boolean
}) {
  const visibleTabs = canViewParticipants ? tabs : tabs.slice(1)

  return (
    <nav aria-label="Participants sections" className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
      {visibleTabs.map(({ id, label, href, icon: Icon }) => (
        <Link
          key={id}
          href={href}
          aria-current={active === id ? "page" : undefined}
          className={cn(
            "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
            active === id
              ? "border-[#C9A84C] text-[#C9A84C]"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <Icon className="h-4 w-4" /> {label}
        </Link>
      ))}
    </nav>
  )
}
