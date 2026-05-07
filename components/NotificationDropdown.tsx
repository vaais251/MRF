"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, CheckCircle, Info, AlertTriangle, XCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (e) {
      console.error("Failed to load notifications")
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every minute
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PUT" })
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      }
    } catch (e) {
      // Ignore
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`/api/notifications/read-all`, { method: "PUT" })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        toast.success("All notifications marked as read")
      }
    } catch (e) {
      // Ignore
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'ERROR': return <XCircle className="w-5 h-5 text-red-500" />
      case 'INFO': default: return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors relative focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0A1628]"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-semibold text-[#C9A84C] hover:text-[#B8943D] transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[24rem] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-600 font-medium">You're all caught up!</p>
                <p className="text-xs text-slate-400 mt-1">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => { if (!notif.isRead) markAsRead(notif.id) }}
                    className={`flex items-start gap-3 p-4 transition-colors cursor-pointer hover:bg-slate-50 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm text-slate-800 ${!notif.isRead ? 'font-bold' : 'font-medium'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
