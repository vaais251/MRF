import { FileText } from "lucide-react"

export function IndividualReportButton({ kind, id, name }: { kind: "participants" | "mentorship"; id: string; name: string }) {
  return (
    <a
      href={`/api/rfl/${kind}/${encodeURIComponent(id)}/report`}
      target="_blank"
      rel="noopener noreferrer"
      title={`Print PDF report for ${name}`}
      aria-label={`Print PDF report for ${name}`}
      className="inline-flex items-center gap-1.5 p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
    >
      <FileText className="w-4 h-4" />
      Report
    </a>
  )
}
