import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MENTORSHIP_PAGE_ROLES } from "@/lib/rbac"

export default async function MentorshipDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (!MENTORSHIP_PAGE_ROLES.includes(session.user.role)) redirect("/unauthorized")

  const mentorship = await prisma.rFLMentorship.findUnique({
    where: { id: params.id },
    include: { participant: { select: { id: true, name: true, institute: true } } },
  })
  if (!mentorship) notFound()

  const details = [
    { label: "Mentor Name", value: mentorship.mentorName },
    { label: "Session Date", value: format(mentorship.sessionDate, "dd MMM yyyy") },
    { label: "Session Type", value: mentorship.sessionType === "GROUP" ? "Group" : "One-on-One" },
    { label: "Target Audience", value: mentorship.targetAudience },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/rfl/mentorship" aria-label="Back to mentorship sessions" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-playfair font-bold text-slate-800">Mentorship Session Details</h2>
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
              {mentorship.participant ? (
                <Link href={`/dashboard/rfl/participants/${mentorship.participant.id}`} className="text-[#C9A84C] hover:underline">
                  {mentorship.participant.name}
                </Link>
              ) : "General"}
            </dd>
          </div>
          {mentorship.participant && (
            <div>
              <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Institute</dt>
              <dd className="mt-1 font-medium text-slate-700">{mentorship.participant.institute}</dd>
            </div>
          )}
        </dl>

        <section className="border-t border-slate-100 pt-6">
          <h3 className="font-playfair text-lg font-bold text-slate-800 mb-2">Notes</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap break-words leading-relaxed">{mentorship.notes || "No notes recorded."}</p>
        </section>

        <section className="border-t border-slate-100 pt-6">
          <h3 className="font-playfair text-lg font-bold text-slate-800 mb-3">Pictures</h3>
          {mentorship.images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mentorship.images.map((image, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={index} src={image} alt={`Mentorship session photo ${index + 1}`} className="w-full max-h-96 object-contain rounded-lg border border-slate-100 bg-slate-50" />
              ))}
            </div>
          ) : <p className="text-sm text-slate-400">No pictures recorded.</p>}
        </section>
      </div>
    </div>
  )
}
