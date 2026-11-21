import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SPONSORSHIP_PAGE_ROLES } from "@/lib/rbac"

export default async function SponsorshipDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (!SPONSORSHIP_PAGE_ROLES.includes(session.user.role)) redirect("/unauthorized")

  const sponsorship = await prisma.rFLSponsorship.findUnique({ where: { id: params.id } })
  if (!sponsorship) notFound()

  const participant = sponsorship.participantId
    ? await prisma.rFLParticipant.findUnique({
        where: { id: sponsorship.participantId },
        select: { id: true, name: true, institute: true },
      })
    : null

  const details = [
    { label: "Sponsor Name", value: sponsorship.sponsorName },
    { label: "Type", value: sponsorship.type.replace(/_/g, " ") },
    { label: "Status", value: sponsorship.status },
    { label: "Amount", value: sponsorship.amount !== null ? `PKR ${Number(sponsorship.amount).toLocaleString()}` : "Not recorded" },
    { label: "Start Date", value: format(sponsorship.startDate, "dd MMM yyyy") },
    { label: "End Date", value: sponsorship.endDate ? format(sponsorship.endDate, "dd MMM yyyy") : "No End Date" },
    { label: "Other Details", value: sponsorship.other || "Not recorded" },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/rfl/sponsorships" aria-label="Back to sponsorships" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-playfair font-bold text-slate-800">Sponsorship Details</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {details.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</dt>
              <dd className="mt-1 font-medium text-slate-700 whitespace-pre-wrap break-words">{value}</dd>
            </div>
          ))}
          <div>
            <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Participant</dt>
            <dd className="mt-1 font-medium text-slate-700">
              {participant ? (
                <Link href={`/dashboard/rfl/participants/${participant.id}`} className="text-[#C9A84C] hover:underline">
                  {participant.name}
                </Link>
              ) : sponsorship.participantId ? "Participant no longer available" : "General"}
            </dd>
          </div>
          {participant && (
            <div>
              <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Institute</dt>
              <dd className="mt-1 font-medium text-slate-700">{participant.institute}</dd>
            </div>
          )}
        </dl>

        <section className="border-t border-slate-100 pt-6">
          <h3 className="font-playfair text-lg font-bold text-slate-800 mb-2">Notes</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap break-words leading-relaxed">{sponsorship.notes || "No notes recorded."}</p>
        </section>
      </div>
    </div>
  )
}
