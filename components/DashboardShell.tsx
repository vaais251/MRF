"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { 
  Book, LayoutDashboard, GraduationCap, School, Users, 
  UserCog, BarChart3, LogOut, Menu, Bell, X, ChevronDown 
} from "lucide-react"
import type { Session } from "next-auth"
import { cn } from "@/lib/utils"
import { NotificationDropdown } from "./NotificationDropdown"

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

export function DashboardShell({ children, session }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const userRole = session?.user?.role || "GUEST"

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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

  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
  }

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

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#C9A84C]/20 flex items-center justify-center">
            <Book className="text-[#C9A84C] w-5 h-5" />
          </div>
          <div>
            <div className="font-playfair font-bold text-lg text-white leading-tight">Miri Roshni Trust</div>
            <div className="text-[#C9A84C] text-[10px] font-semibold uppercase tracking-wider">M&E System</div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 space-y-8">
        {NAVIGATION.map((group, idx) => {
          const visibleItems = group.items.filter(item => item.roles.includes(userRole))
          if (visibleItems.length === 0) return null

          return (
            <div key={idx} className="px-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">
                {group.group}
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
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ease-in-out text-sm font-medium relative group",
                          isActive 
                            ? "bg-[#C9A84C]/10 text-[#C9A84C]" 
                            : "text-white/60 hover:text-white hover:bg-white/5",
                          item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-white/60"
                        )}
                      >
                        {isActive && !item.children && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#C9A84C] rounded-r-md" />
                        )}
                        <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-[#C9A84C]" : "text-white/60 group-hover:text-white")} />
                        <span className="flex-1 text-left">{item.label}</span>
                        
                        {item.children && (
                          <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
                        )}
                        
                        {item.disabled && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                            Coming Soon
                          </span>
                        )}
                      </button>
                      
                      {item.children && isExpanded && (
                        <div className="pl-11 pr-3 py-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                          {item.children.map((child: NavChild) => {
                            const isChildActive = pathname === child.href
                            return (
                              <button
                                key={child.href}
                                onClick={() => handleNavigation(child.href)}
                                className={cn(
                                  "w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 ease-in-out text-xs font-medium text-left",
                                  isChildActive
                                    ? "text-[#C9A84C] bg-white/5"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                              >
                                {isChildActive && <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />}
                                {!isChildActive && <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
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

      <div className="p-4 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] font-bold shrink-0 shadow-inner">
            {getInitials(session.user?.name)}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-medium text-white truncate">{session.user?.name}</div>
            <div className="text-[10px] text-slate-400 truncate uppercase tracking-wider">{session.user?.role?.replace('_', ' ')}</div>
          </div>
        </div>
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign out</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex font-dm-sans">
      {/* Desktop Sidebar */}
      <aside className="w-[260px] bg-[#0A1628] fixed inset-y-0 left-0 z-50 hidden md:flex flex-col shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "w-[260px] bg-[#0A1628] fixed inset-y-0 left-0 z-50 flex flex-col shadow-xl transition-transform duration-300 ease-in-out md:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 md:pl-[260px]">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-playfair font-semibold text-slate-800">{currentPageTitle}</h1>
          </div>
          
          <div className="flex items-center gap-5 sm:gap-6">
            <div className="hidden sm:block text-sm font-medium text-slate-500 tabular-nums">
              {currentTime ? currentTime.toLocaleString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              }) : '...'}
            </div>
            
            <NotificationDropdown />

            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-100 py-1.5 px-3 rounded-full">
              <span className="text-sm font-medium text-slate-700">{session.user?.name}</span>
              <span className="text-[10px] uppercase font-bold text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded-full">
                {session.user?.role?.replace('_', ' ')}
              </span>
            </div>
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
