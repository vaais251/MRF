"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  Book, LayoutDashboard, GraduationCap, School, Users,
  UserCog, BarChart3, LogOut, Menu, X, ChevronDown
} from "lucide-react"
import type { Session } from "next-auth"
import { cn } from "@/lib/utils"
import { NotificationDropdown } from "./NotificationDropdown"
import { Avatar } from "./Avatar"
import { UserMenu } from "./UserMenu"

interface NavChild {
  label: string
  href: string
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
  children?: NavChild[]
  disabled?: boolean
}

interface NavGroup {
  group: string
  items: NavItem[]
}

interface DashboardShellProps {
  children: React.ReactNode
  session: Session
  userImage: string | null
}

const NAVIGATION: NavGroup[] = [
  {
    group: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "TRUST_MGMT", "PROGRAM_MANAGER", "MEO_OFFICER", "SCHOOL_AUTHORITY", "HOSTEL_INCHARGE", "RFL_COORDINATOR"] }
    ]
  },
  { 
    group: "PROGRAMS", 
    items: [
      { 
        label: "RFL Program", 
        href: "/dashboard/rfl", 
        icon: GraduationCap, 
        roles: ["SUPER_ADMIN", "TRUST_MGMT", "PROGRAM_MANAGER", "MEO_OFFICER", "RFL_COORDINATOR"],
        children: [
          { label: "Overview", href: "/dashboard/rfl" },
          { label: "Participants", href: "/dashboard/rfl/participants" },
          { label: "Mentorship", href: "/dashboard/rfl/mentorship" },
          { label: "Alumni", href: "/dashboard/rfl/alumni" },
          { label: "Sponsorships", href: "/dashboard/rfl/sponsorships" },
          { label: "Activities", href: "/dashboard/activities" },
        ]
      },
      { label: "MRHSS", href: "/dashboard/mrhss", icon: School, roles: ["SUPER_ADMIN", "TRUST_MGMT", "PROGRAM_MANAGER", "MEO_OFFICER", "SCHOOL_AUTHORITY"], disabled: true },
      { label: "MRA", href: "/dashboard/mra", icon: Users, roles: ["SUPER_ADMIN", "TRUST_MGMT", "PROGRAM_MANAGER", "MEO_OFFICER", "HOSTEL_INCHARGE"], disabled: true },
    ]
  },
  { 
    group: "SYSTEM", 
    items: [
      { label: "User Management", href: "/dashboard/users", icon: UserCog, roles: ["SUPER_ADMIN"] },
      { label: "Reports", href: "/dashboard/reports", icon: BarChart3, roles: ["SUPER_ADMIN"] },
    ]
  }
]

// Isolated so its per-second tick doesn't re-render the whole shell (which
// previously caused the sidebar to remount and its submenu to "shake").
function HeaderClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="hidden sm:block text-sm font-medium text-slate-500 dark:text-slate-400 tabular-nums">
      {now
        ? now.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
        : '...'}
    </div>
  )
}

export function DashboardShell({ children, session, userImage }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const userRole = session?.user?.role || "GUEST"

  useEffect(() => {
    setExpandedItems(prev => {
      let newItems = [...prev];
      let changed = false;
      NAVIGATION.forEach(group => {
        group.items.forEach(item => {
          if (item.children && pathname.startsWith(item.href)) {
            if (!newItems.includes(item.label)) {
              newItems.push(item.label);
              changed = true;
            }
          }
        })
      });
      return changed ? newItems : prev;
    });
  }, [pathname])

  // Find current page title
  let currentPageTitle = "Dashboard"
  NAVIGATION.forEach(group => {
    group.items.forEach(item => {
      if (item.href === pathname) {
        currentPageTitle = item.label
      }
      if (item.children) {
        item.children.forEach((child: NavChild) => {
          if (child.href === pathname) {
            currentPageTitle = child.label === "Overview" ? item.label : child.label
          }
        })
      }
    })
  })

  const handleNavigation = (href: string, disabled?: boolean) => {
    if (disabled) return
    router.push(href)
    setIsMobileMenuOpen(false)
  }

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    )
  }

  const renderSidebar = () => (
    <>
      {/* Soft gold glow behind the header */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(ellipse_90%_70%_at_50%_-15%,rgba(201,168,76,0.18),transparent)]" />

      <div className="relative h-[72px] flex items-center px-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E3C778] via-[#C9A84C] to-[#9A7B2E] flex items-center justify-center shadow-[0_4px_16px_rgba(201,168,76,0.35)] ring-1 ring-white/20">
            <Book className="text-[#0A1628] w-5 h-5" />
          </div>
          <div>
            <div className="font-playfair font-bold text-[17px] text-white leading-tight">Miri Roshni Trust</div>
            <div className="text-[#C9A84C] text-[10px] font-semibold uppercase tracking-[0.2em]">M&E System</div>
          </div>
        </div>
        <div aria-hidden className="absolute bottom-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />
      </div>

      <div className="sidebar-scroll relative flex-1 overflow-y-auto py-6 space-y-7">
        {NAVIGATION.map((group, idx) => {
          const visibleItems = group.items.filter(item => item.roles.includes(userRole))
          if (visibleItems.length === 0) return null

          return (
            <div key={idx} className="px-4">
              <div className="flex items-center gap-2 px-3 mb-3">
                <span aria-hidden className="h-px w-4 bg-[#C9A84C]/50" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.22em]">
                  {group.group}
                </span>
              </div>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.children && pathname.startsWith(item.href) && pathname !== item.href)
                  const isExpanded = expandedItems.includes(item.label)
                  const Icon = item.icon
                  
                  return (
                    <div key={item.href} className="space-y-1">
                      <button
                        onClick={() => {
                          if (item.children) {
                            toggleExpand(item.label)
                            if (!isExpanded) {
                              handleNavigation(item.href, item.disabled)
                            }
                          } else {
                            handleNavigation(item.href, item.disabled)
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all duration-200 ease-in-out text-sm font-medium relative group border border-transparent",
                          isActive
                            ? "bg-gradient-to-r from-[#C9A84C]/15 to-transparent text-[#E3C778] border-[#C9A84C]/20"
                            : "text-slate-400 hover:text-white hover:bg-white/[0.06]",
                          item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-slate-400"
                        )}
                      >
                        {isActive && (
                          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-7 bg-gradient-to-b from-[#E3C778] to-[#C9A84C] rounded-r-full shadow-[0_0_8px_rgba(201,168,76,0.6)]" />
                        )}
                        <span
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            isActive
                              ? "bg-[#C9A84C]/15 text-[#E3C778]"
                              : "bg-white/[0.04] text-slate-400 group-hover:bg-white/[0.08] group-hover:text-white"
                          )}
                        >
                          <Icon className="w-[18px] h-[18px]" />
                        </span>
                        <span className="flex-1 text-left">{item.label}</span>

                        {item.children && (
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 mr-1 text-slate-500 transition-transform duration-200",
                              isExpanded && "rotate-180 text-[#C9A84C]"
                            )}
                          />
                        )}

                        {item.disabled && (
                          <span className="text-[9px] px-2 py-0.5 mr-1 rounded-md bg-white/[0.05] border border-white/10 text-slate-400 font-medium tracking-wide">
                            Coming Soon
                          </span>
                        )}
                      </button>
                      
                      {item.children && isExpanded && (
                        <div className="ml-[26px] mt-1 pl-3.5 border-l border-white/[0.08] space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                          {item.children.map((child: NavChild) => {
                            const isChildActive = pathname === child.href
                            return (
                              <button
                                key={child.href}
                                onClick={() => handleNavigation(child.href)}
                                className={cn(
                                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 ease-in-out text-[13px] font-medium text-left",
                                  isChildActive
                                    ? "text-[#E3C778] bg-[#C9A84C]/10"
                                    : "text-slate-400 hover:text-white hover:bg-white/[0.05] hover:translate-x-0.5"
                                )}
                              >
                                <span
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
                                    isChildActive
                                      ? "bg-[#C9A84C] shadow-[0_0_6px_rgba(201,168,76,0.9)]"
                                      : "bg-slate-600"
                                  )}
                                />
                                {child.label}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="relative p-4 shrink-0">
        <div aria-hidden className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <button
          onClick={() => handleNavigation("/dashboard/settings")}
          className="flex items-center gap-3 p-2.5 mb-2 w-full rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] hover:border-[#C9A84C]/30 transition-all duration-200 text-left"
          title="Account settings"
        >
          <Avatar
            name={session.user?.name}
            image={userImage}
            className="w-10 h-10 bg-[#C9A84C]/20 text-[#C9A84C] shrink-0 ring-2 ring-[#C9A84C]/30"
          />
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-white truncate">{session.user?.name}</div>
            <div className="text-[10px] text-[#C9A84C]/80 truncate uppercase tracking-[0.14em] font-medium">{session.user?.role?.replace('_', ' ')}</div>
          </div>
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center justify-center gap-2 px-3 py-2 w-full rounded-lg border border-transparent hover:border-red-500/20 hover:bg-red-500/10 text-slate-400 hover:text-red-300 transition-all duration-200 text-[13px] font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 flex font-dm-sans">
      {/* Desktop Sidebar */}
      <aside className="w-[260px] bg-gradient-to-b from-[#0D1D38] via-[#0A1628] to-[#070F1F] border-r border-white/[0.06] fixed inset-y-0 left-0 z-50 hidden md:flex flex-col shadow-2xl overflow-hidden">
        {renderSidebar()}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "w-[260px] bg-gradient-to-b from-[#0D1D38] via-[#0A1628] to-[#070F1F] border-r border-white/[0.06] fixed inset-y-0 left-0 z-50 flex flex-col shadow-2xl overflow-hidden transition-transform duration-300 ease-in-out md:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-5 right-4 z-10 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        {renderSidebar()}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 md:pl-[260px]">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-playfair font-semibold text-slate-800 dark:text-white">{currentPageTitle}</h1>
          </div>

          <div className="flex items-center gap-5 sm:gap-6">
            <HeaderClock />

            <NotificationDropdown />

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

            <UserMenu session={session} initialImage={userImage} />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
