"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { Search, Filter, Download, Activity } from "lucide-react"
import { toast } from "sonner"

export function AuditLogsViewer() {
  const [logs, setLogs] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  
  // Filters
  const [actionFilter, setActionFilter] = useState("ALL")
  const [moduleFilter, setModuleFilter] = useState("ALL")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "20"
      })
      if (actionFilter !== "ALL") query.append("action", actionFilter)
      if (moduleFilter !== "ALL") query.append("module", moduleFilter)
      if (fromDate) query.append("fromDate", fromDate)
      if (toDate) query.append("toDate", toDate)

      const res = await fetch(`/api/audit-logs?${query.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setTotalCount(data.totalCount)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      toast.error("Failed to load audit logs")
    } finally {
      setIsLoading(false)
    }
  }, [page, actionFilter, moduleFilter, fromDate, toDate])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const getActionColor = (action: string) => {
    switch(action) {
      case 'CREATE': return 'bg-green-100 text-green-700 border-green-200'
      case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'DELETE': return 'bg-red-100 text-red-700 border-red-200'
      case 'LOGIN': return 'bg-slate-100 text-slate-700 border-slate-200'
      case 'LOGOUT': return 'bg-slate-100 text-slate-500 border-slate-200'
      case 'EXPORT': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast.error("No logs to export")
      return
    }

    const headers = ["Timestamp", "User Email", "Action", "Module", "Description", "IP Address"]
    const csvContent = [
      headers.join(","),
      ...logs.map(log => [
        `"${format(new Date(log.createdAt), "dd MMM yyyy, h:mm a")}"`,
        `"${log.userEmail}"`,
        `"${log.action}"`,
        `"${log.module}"`,
        `"${log.description.replace(/"/g, '""')}"`,
        `"${log.ipAddress || ''}"`
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `audit_logs_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="text-slate-400 w-4 h-4" />
            <select 
              value={actionFilter} 
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none bg-white"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="EXPORT">EXPORT</option>
            </select>
          </div>
          
          <select 
            value={moduleFilter} 
            onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
            className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 outline-none bg-white"
          >
            <option value="ALL">All Modules</option>
            <option value="USERS">USERS</option>
            <option value="RFL">RFL</option>
            <option value="SYSTEM">SYSTEM</option>
            <option value="REPORTS">REPORTS</option>
          </select>

          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2 bg-white">
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="h-10 bg-transparent text-sm outline-none"
            />
            <span className="text-slate-400 text-sm">to</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="h-10 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-32 h-4 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-40 h-4 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-16 h-6 bg-slate-200 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="w-16 h-6 bg-slate-200 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="w-64 h-4 bg-slate-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-24 h-4 bg-slate-200 rounded" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <Activity className="w-6 h-6 text-slate-300" />
                      </div>
                      <p>No audit logs found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-slate-600 font-medium">
                      {format(new Date(log.createdAt), "dd MMM yyyy, h:mm a")}
                    </td>
                    <td className="px-6 py-3 text-slate-800">
                      {log.userEmail}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border bg-slate-100 text-slate-600 border-slate-200">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      <span className="truncate max-w-[300px] inline-block" title={log.description}>
                        {log.description}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-700">{logs.length > 0 ? (page - 1) * 20 + 1 : 0}</span> to <span className="font-medium text-slate-700">{Math.min(page * 20, totalCount)}</span> of <span className="font-medium text-slate-700">{totalCount}</span> logs
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
