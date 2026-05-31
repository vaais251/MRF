"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus, Search, CalendarDays, MapPin, Edit, Trash2, Loader2,
  ImageIcon, X, ChevronLeft, ChevronRight, StickyNote, Images
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ActivityFormModal } from "@/components/ActivityFormModal"

interface Activity {
  id: string
  title: string
  description: string
  date: string
  location?: string | null
  notes?: string | null
  images: string[]
  createdByName?: string | null
  createdAt: string
}

const LIMIT = 12

export default function ActivitiesClient({ canManage }: { canManage: boolean }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [selected, setSelected] = useState<Activity | null>(null)

  const fetchActivities = useCallback(async () => {
    setIsLoading(true)
    try {
      const query = new URLSearchParams({ page: page.toString(), limit: LIMIT.toString(), search })
      const res = await fetch(`/api/activities?${query.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities)
        setTotalCount(data.totalCount)
        setTotalPages(data.totalPages)
      } else {
        toast.error("Failed to load activities")
      }
    } catch {
      toast.error("Failed to load activities")
    } finally {
      setIsLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    const t = setTimeout(fetchActivities, 300)
    return () => clearTimeout(t)
  }, [fetchActivities])

  useEffect(() => {
    setPage(1)
  }, [search])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this activity? This cannot be undone.")) return
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Activity deleted")
        setSelected(null)
        fetchActivities()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || "Failed to delete activity")
      }
    } catch {
      toast.error("An error occurred")
    }
  }

  const openCreate = () => { setEditing(null); setIsFormOpen(true) }
  const openEdit = (a: Activity) => { setSelected(null); setEditing(a); setIsFormOpen(true) }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-slate-800 dark:text-white">Activities</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            School and program activities, events and highlights.
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Add Activity
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search activities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-pulse">
              <div className="h-44 bg-slate-200 dark:bg-slate-800" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No activities yet</p>
          <p className="text-sm text-slate-400 mt-1">
            {canManage ? "Click “Add Activity” to publish the first one." : "Check back soon for updates."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((a) => (
            <div
              key={a.id}
              onClick={() => setSelected(a)}
              className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md hover:border-[#C9A84C]/50 transition-all cursor-pointer flex flex-col"
            >
              {/* Cover */}
              <div className="relative h-44 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {a.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.images[0]} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}
                {a.images.length > 1 && (
                  <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-[11px] font-medium">
                    <Images className="w-3.5 h-3.5" /> {a.images.length}
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="inline-flex items-center gap-1 font-medium text-[#C9A84C]">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {format(new Date(a.date), "dd MMM yyyy")}
                  </span>
                  {a.location && (
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{a.location}</span>
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white line-clamp-1">{a.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 flex-1">{a.description}</p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 truncate">
                    {a.createdByName ? `By ${a.createdByName}` : " "}
                  </span>
                  {canManage && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(a)} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-md transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-medium text-slate-700 dark:text-slate-200">{(page - 1) * LIMIT + 1}</span> to{" "}
            <span className="font-medium text-slate-700 dark:text-slate-200">{Math.min(page * LIMIT, totalCount)}</span> of{" "}
            <span className="font-medium text-slate-700 dark:text-slate-200">{totalCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail view */}
      {selected && (
        <ActivityDetail
          activity={selected}
          canManage={canManage}
          onClose={() => setSelected(null)}
          onEdit={() => openEdit(selected)}
          onDelete={() => handleDelete(selected.id)}
        />
      )}

      {/* Create / Edit form */}
      <ActivityFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        activity={editing}
        onSuccess={fetchActivities}
      />
    </div>
  )
}

function ActivityDetail({
  activity, canManage, onClose, onEdit, onDelete,
}: {
  activity: Activity
  canManage: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [active, setActive] = useState(0)
  const images = activity.images || []
  const hasImages = images.length > 0

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length)
  const next = () => setActive((i) => (i + 1) % images.length)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-playfair font-bold text-slate-800 dark:text-white">{activity.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              <span className="inline-flex items-center gap-1 font-medium text-[#C9A84C]">
                <CalendarDays className="w-3.5 h-3.5" />
                {format(new Date(activity.date), "dd MMM yyyy")}
              </span>
              {activity.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {activity.location}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {hasImages && (
            <div className="bg-slate-950">
              <div className="relative aspect-video flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={images[active]} alt={`${activity.title} ${active + 1}`} className="max-h-full max-w-full object-contain" />
                {images.length > 1 && (
                  <>
                    <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <span className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-black/60 text-white text-[11px]">
                      {active + 1} / {images.length}
                    </span>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      className={`h-14 w-14 rounded-md overflow-hidden border-2 shrink-0 transition-colors ${i === active ? "border-[#C9A84C]" : "border-transparent opacity-70 hover:opacity-100"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-6 space-y-5">
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{activity.description}</p>

            {activity.notes && (
              <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  <StickyNote className="w-4 h-4" /> Notes
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{activity.notes}</p>
              </div>
            )}

            {activity.createdByName && (
              <p className="text-xs text-slate-400">Posted by {activity.createdByName}</p>
            )}
          </div>
        </div>

        {canManage && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-500/30 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
