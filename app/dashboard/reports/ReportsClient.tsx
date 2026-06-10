"use client"

import { useState, useEffect } from "react"
import {
  FileText, FileSpreadsheet, Loader2, Users,
  GraduationCap, BookOpen, DollarSign, Printer
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  BarChart, Bar, Legend
} from "recharts"

const COLORS = ['#0A1628', '#C9A84C', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

// Convert a camelCase / snake_case key into a human-friendly column header.
function humanLabel(key: string): string {
  return key
    .replace(/[_-]/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Columns that should never appear in an export, plus anything holding
// objects or embedded images (base64 data URLs).
function exportableKeys(row: Record<string, unknown>): string[] {
  return Object.keys(row).filter(k => {
    if (/^id$|Id$|^image$|^createdBy$/.test(k)) return false
    const v = row[k]
    if (v !== null && typeof v === "object") return false
    if (typeof v === "string" && v.startsWith("data:")) return false
    return true
  })
}

// Render any value safely as a table cell: dates -> "DD MMM YYYY", null -> "-".
function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-"
  if (typeof value === "string") {
    if (value.startsWith("data:")) return "[image]"
    // ISO date-string detection
    const m = /^\d{4}-\d{2}-\d{2}(T|$)/.exec(value)
    if (m) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      }
    }
    return value
  }
  if (value instanceof Date) {
    return value.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  }
  return String(value)
}

export default function ReportsClient() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loadingCard, setLoadingCard] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/reports/analytics")
      .then(res => res.json())
      .then(data => setAnalytics(data))
      .catch(() => toast.error("Failed to load analytics"))
  }, [])

  const handleExport = async (type: "PARTICIPANTS" | "MENTORSHIP" | "ALUMNI" | "SPONSORSHIPS", format: "PDF" | "EXCEL") => {
    setLoadingCard(`${type}_${format}`)
    try {
      const endpointMap = {
        PARTICIPANTS: "/api/reports/participants",
        MENTORSHIP: "/api/reports/mentorship",
        ALUMNI: "/api/reports/alumni",
        SPONSORSHIPS: "/api/reports/sponsorships",
      }
      const titleMap = {
        PARTICIPANTS: "Participant Progress Report",
        MENTORSHIP: "Mentorship Activity Report",
        ALUMNI: "Alumni Engagement Report",
        SPONSORSHIPS: "Sponsorship Status Report",
      }

      const res = await fetch(endpointMap[type])
      if (!res.ok) throw new Error("Failed to fetch report data")
      const data = await res.json()

      if (data.length === 0) {
        toast.info("No data available for this report")
        setLoadingCard(null)
        return
      }

      const title = titleMap[type]
      const filename = `${type.toLowerCase()}_report_${new Date().toISOString().split('T')[0]}`

      if (format === "EXCEL") {
        const excelKeys = exportableKeys(data[0])
        const rows = data.map((item: any) =>
          Object.fromEntries(excelKeys.map(k => [humanLabel(k), formatCell(item[k])]))
        )
        const worksheet = XLSX.utils.json_to_sheet(rows)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report")
        XLSX.writeFile(workbook, `${filename}.xlsx`)
        toast.success(`${title} exported as Excel`)
      } else {
        const doc = new jsPDF()
        
        // Header
        doc.setFontSize(20)
        doc.setTextColor(10, 22, 40) // Navy
        doc.text("Miri Roshni Trust", 14, 22)
        
        doc.setFontSize(14)
        doc.setTextColor(201, 168, 76) // Gold
        doc.text(title, 14, 30)

        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36)

        const keys = exportableKeys(data[0])
        const tableData = data.map((item: any) => keys.map(k => formatCell(item[k])))

        autoTable(doc, {
          startY: 42,
          head: [keys.map(humanLabel)],
          body: tableData,
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [10, 22, 40], textColor: 255 },
          alternateRowStyles: { fillColor: [248, 249, 252] },
        })

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i)
          doc.setFontSize(8)
          doc.setTextColor(150)
          doc.text(`Generated by MRT M&E System | Confidential | Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' })
        }

        doc.save(`${filename}.pdf`)
        toast.success(`${title} exported as PDF`)
      }
    } catch (error) {
      toast.error("An error occurred during export")
    } finally {
      setLoadingCard(null)
    }
  }

  // Print: open a clean printable window with just the report table.
  const handlePrint = async (type: "PARTICIPANTS" | "MENTORSHIP" | "ALUMNI" | "SPONSORSHIPS") => {
    setLoadingCard(`${type}_PRINT`)
    try {
      const endpointMap = {
        PARTICIPANTS: "/api/reports/participants",
        MENTORSHIP: "/api/reports/mentorship",
        ALUMNI: "/api/reports/alumni",
        SPONSORSHIPS: "/api/reports/sponsorships",
      }
      const titleMap = {
        PARTICIPANTS: "Participant Progress Report",
        MENTORSHIP: "Mentorship Activity Report",
        ALUMNI: "Alumni Engagement Report",
        SPONSORSHIPS: "Sponsorship Status Report",
      }

      const res = await fetch(endpointMap[type])
      if (!res.ok) throw new Error("Failed to fetch report data")
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) {
        toast.info("No data available for this report")
        return
      }

      const title = titleMap[type]
      const keys = exportableKeys(data[0])

      const headHtml = keys.map(k => `<th>${humanLabel(k)}</th>`).join("")
      const bodyHtml = data
        .map(
          (row: any) =>
            `<tr>${keys
              .map(k => `<td>${String(formatCell(row[k])).replace(/</g, "&lt;")}</td>`)
              .join("")}</tr>`
        )
        .join("")

      const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>
  *{ box-sizing: border-box; }
  body{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 24px; color: #111; }
  .meta{ color:#666; font-size:12px; margin-top:4px; }
  h1{ color:#0A1628; margin:0; }
  h2{ color:#C9A84C; margin:0 0 4px; font-size:18px; }
  table{ width:100%; border-collapse: collapse; margin-top:18px; font-size:12px; }
  th{ background:#0A1628; color:#fff; text-align:left; padding:8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  td{ border-bottom: 1px solid #eee; padding:6px 8px; vertical-align: top; }
  tr:nth-child(even) td{ background:#fafafa; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .footer{ margin-top: 24px; text-align:center; color:#999; font-size:10px; }
  @page{ margin: 14mm; }
</style></head>
<body>
  <h1>Miri Roshni Trust</h1>
  <h2>${title}</h2>
  <div class="meta">Generated on ${new Date().toLocaleString()}</div>
  <table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>
  <div class="footer">Generated by MRT M&E System · Confidential</div>
</body></html>`

      // Print via a hidden iframe: opens the browser's native print preview
      // dialog and is immune to pop-up blockers.
      const iframe = document.createElement("iframe")
      iframe.style.position = "fixed"
      iframe.style.right = "0"
      iframe.style.bottom = "0"
      iframe.style.width = "0"
      iframe.style.height = "0"
      iframe.style.border = "0"
      iframe.onload = () => {
        const frameWin = iframe.contentWindow
        if (!frameWin) return
        frameWin.onafterprint = () => setTimeout(() => iframe.remove(), 100)
        // Defer print() out of doc.close()'s synchronous stack: the modal
        // dialog otherwise blocks inside this try block and the iframe
        // teardown on dialog close throws a spurious error.
        setTimeout(() => {
          try {
            frameWin.focus()
            frameWin.print()
          } catch {
            iframe.remove()
          }
        }, 50)
      }
      document.body.appendChild(iframe)
      const doc = iframe.contentDocument
      if (!doc) {
        iframe.remove()
        throw new Error("Could not create print frame")
      }
      doc.open()
      doc.write(html)
      doc.close()
    } catch {
      toast.error("Failed to open print view")
    } finally {
      setLoadingCard(null)
    }
  }

  const reports = [
    {
      id: "PARTICIPANTS",
      title: "Participant Progress Report",
      description: "Complete list of RFL participants with academic results and semester progress",
      icon: <Users className="w-6 h-6 text-blue-500" />
    },
    {
      id: "MENTORSHIP",
      title: "Mentorship Activity Report",
      description: "All mentorship sessions with mentor names, types, and attendance summary",
      icon: <BookOpen className="w-6 h-6 text-purple-500" />
    },
    {
      id: "ALUMNI",
      title: "Alumni Engagement Report",
      description: "Alumni profiles and activity participation records",
      icon: <GraduationCap className="w-6 h-6 text-green-500" />
    },
    {
      id: "SPONSORSHIPS",
      title: "Sponsorship Status Report",
      description: "Active and expired sponsorships with financial summary",
      icon: <DollarSign className="w-6 h-6 text-amber-500" />
    }
  ] as const

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-playfair font-bold text-slate-800">Reports & Dashboards</h2>
          <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#C9A84C] font-medium">Reports</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map(report => (
          <div key={report.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                {report.icon}
              </div>
              <div>
                <h3 className="font-playfair text-lg font-bold text-slate-800">{report.title}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{report.description}</p>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-end gap-2 flex-wrap">
              <button
                onClick={() => handlePrint(report.id)}
                disabled={loadingCard === `${report.id}_PRINT`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm"
                title="Print this report"
              >
                {loadingCard === `${report.id}_PRINT` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                Print
              </button>
              <button
                onClick={() => handleExport(report.id, "EXCEL")}
                disabled={loadingCard === `${report.id}_EXCEL`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#C9A84C]/20 text-[#C9A84C] font-medium hover:bg-[#C9A84C]/5 transition-colors disabled:opacity-50 text-sm"
              >
                {loadingCard === `${report.id}_EXCEL` ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                Excel
              </button>
              <button
                onClick={() => handleExport(report.id, "PDF")}
                disabled={loadingCard === `${report.id}_PDF`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C9A84C] text-white font-medium hover:bg-[#B8943D] transition-colors disabled:opacity-70 shadow-sm text-sm"
              >
                {loadingCard === `${report.id}_PDF` ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-slate-200">
        <h3 className="text-xl font-playfair font-bold text-slate-800 mb-6">Analytics Dashboard</h3>
        
        {!analytics ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Participants by Program */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
              <h4 className="font-semibold text-slate-800 mb-4 w-full text-left">Participants by Program</h4>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.participantsByProgram}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analytics.participantsByProgram.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Monthly Sessions Trend */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-4">Monthly Sessions Trend</h4>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.monthlySessions}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="sessions" stroke="#C9A84C" strokeWidth={3} dot={{ r: 4, fill: '#C9A84C', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Sponsorship Status */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-4">Sponsorship Status Distribution</h4>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.sponsorshipStatus}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" fill="#0A1628" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Alumni by Year */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h4 className="font-semibold text-slate-800 mb-4">Alumni by Graduation Year</h4>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.alumniByYear}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="alumni" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  )
}
