import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { Activity, RFLMentorship, RFLParticipant } from "@prisma/client"
import { participantAdmissionFields } from "./participant-admission"

type AdmissionField = typeof participantAdmissionFields[number]["name"]
export type ParticipantReportData = Omit<RFLParticipant, AdmissionField> & Partial<Pick<RFLParticipant, AdmissionField>> & {
  mentorships: RFLMentorship[]
  activities: Activity[]
}
export type MentorReportSession = RFLMentorship & {
  participant: Pick<RFLParticipant, "id" | "name" | "institute" | "program" | "status"> | null
}

function text(value: unknown): string {
  return value === null || value === undefined || value === "" ? "-" : String(value)
}

function date(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

class IndividualReport {
  readonly doc = new jsPDF({ compress: true })
  private y = 29

  constructor(title: string, name: string) {
    this.doc.setProperties({ title: `${title} - ${name}`, author: "Miri Roshni Trust", subject: title })
    this.doc.setFont("helvetica", "bold")
    this.doc.setTextColor(10, 22, 40)
    this.doc.setFontSize(18)
    this.doc.text(title, 16, this.y)
    this.doc.setFontSize(12)
    const lines = this.doc.splitTextToSize(name, 178)
    this.doc.text(lines, 16, this.y + 8)
    this.y += 12 + lines.length * 5
  }

  private space(height: number) {
    if (this.y + height > 276) {
      this.doc.addPage()
      this.y = 27
    }
  }

  heading(title: string) {
    this.space(22)
    this.doc.setFont("helvetica", "bold")
    this.doc.setFontSize(12)
    this.doc.setTextColor(10, 22, 40)
    this.doc.text(title, 16, this.y + 4)
    this.y += 8
  }

  table(head: string[] | null, body: string[][]) {
    autoTable(this.doc, {
      startY: this.y,
      head: head ? [head] : undefined,
      body,
      margin: { top: 25, right: 16, bottom: 21, left: 16 },
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3, overflow: "linebreak", textColor: [51, 65, 85] },
      headStyles: { fillColor: [10, 22, 40], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: head ? {} : { 0: { cellWidth: 55, fontStyle: "bold" } },
      rowPageBreak: "avoid",
      didDrawPage: (data) => { this.y = data.cursor?.y ?? 27 },
    })
    this.y += 7
  }

  paragraph(value: string) {
    autoTable(this.doc, {
      startY: this.y,
      body: [[value]],
      theme: "plain",
      margin: { top: 25, right: 16, bottom: 21, left: 16 },
      styles: { fontSize: 9, cellPadding: 1, textColor: [51, 65, 85], overflow: "linebreak" },
      didDrawPage: (data) => { this.y = data.cursor?.y ?? 27 },
    })
    this.y += 6
  }

  image(source: string | null | undefined, caption: string, maxWidth = 178, maxHeight = 95) {
    if (!source) return
    if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(source)) {
      this.paragraph(`${caption}: attachment format cannot be printed.`)
      return
    }
    try {
      const properties = this.doc.getImageProperties(source)
      const scale = Math.min(maxWidth / properties.width, maxHeight / properties.height)
      const width = properties.width * scale
      const height = properties.height * scale
      this.space(height + 15)
      this.doc.addImage(source, properties.fileType, 16, this.y, width, height)
      this.y += height + 3
    } catch {
      this.paragraph("Image could not be included.")
    }
    this.paragraph(caption)
  }

  finish(): ArrayBuffer {
    const count = this.doc.getNumberOfPages()
    const generated = new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi", hour12: false })
    for (let page = 1; page <= count; page++) {
      this.doc.setPage(page)
      this.doc.setFont("helvetica", "normal")
      this.doc.setFontSize(9)
      this.doc.setTextColor(100)
      this.doc.text("MIRI ROSHNI TRUST | RFL", 16, 12)
      this.doc.setDrawColor(201, 168, 76)
      this.doc.line(16, 17, 194, 17)
      this.doc.setFontSize(8)
      this.doc.text(`Generated: ${generated} PKT | Confidential`, 16, 286)
      this.doc.text(`Page ${page} of ${count}`, 194, 286, { align: "right" })
    }
    this.doc.autoPrint()
    return this.doc.output("arraybuffer")
  }
}

function sessionDetails(report: IndividualReport, session: RFLMentorship, index: number) {
  report.heading(`Session ${index + 1} - ${date(session.sessionDate)}`)
  report.table(null, [
    ["Mentor", session.mentorName],
    ["Type", session.sessionType === "GROUP" ? "Group" : "One-on-One"],
    ["Target Audience", session.targetAudience],
    ["Recorded", date(session.createdAt)],
  ])
  report.paragraph(`Notes: ${session.notes || "No notes recorded."}`)
  session.images.forEach((image, photo) => report.image(image, `Session ${index + 1} - Picture ${photo + 1}`))
}

export function createParticipantReport(participant: ParticipantReportData): ArrayBuffer {
  const report = new IndividualReport("Participant Detail Report", participant.name)
  report.heading("Profile")
  report.table(null, [
    ["Name", participant.name], ["Program", participant.program], ["Institute", participant.institute],
    ["Status", participant.status.replaceAll("_", " ")],
    ["Years", `${participant.startYear} - ${participant.endYear}`], ["Course Type", text(participant.courseType)],
    ["Current Semester", text(participant.currentSemester)], ["Current Year", text(participant.currentYear)],
    ["Course Duration", text(participant.duration)], ["Field Remarks", text(participant.fieldRemarks)],
    ["Registered", date(participant.createdAt)], ["Last Updated", date(participant.updatedAt)],
  ])
  report.image(participant.image, "Participant photo", 45, 35)

  // The caller selects only the admission fields the current role may view.
  const admission = participantAdmissionFields.filter(({ name }) => Object.hasOwn(participant, name))
  if (admission.length) {
    report.heading("Personal details")
    report.table(null, admission.map(({ name, label }) => [label, text(participant[name])]))
  }

  report.heading("Academic Results")
  const results = Array.isArray(participant.academicResults) ? participant.academicResults.map(record) : []
  if (results.length) {
    report.table(["Result", "Period", "Scores", "Comments"], results.map((result) => [
      text(result.name ?? result.subjectName), text(result.period ?? (result.semester ? `Semester ${result.semester}` : null)),
      [["Grade", result.grade], ["Percentage", result.percentage], ["GPA", result.gpa], ["CGPA", result.cgpa]]
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([label, value]) => `${label}: ${value}${label === "Percentage" ? "%" : ""}`).join("\n") || "-",
      text(result.comments),
    ]))
    results.forEach((result, index) => {
      if (typeof result.file === "string") report.image(result.file, `Academic result ${index + 1} - ${text(result.name ?? result.subjectName)}`)
    })
  } else report.paragraph("No academic results recorded.")

  report.heading(`Mentorship History (${participant.mentorships.length} sessions)`)
  if (!participant.mentorships.length) report.paragraph("No mentorship sessions recorded.")
  participant.mentorships.forEach((session, index) => sessionDetails(report, session, index))

  report.heading(`Activities (${participant.activities.length})`)
  if (!participant.activities.length) report.paragraph("No activities recorded.")
  participant.activities.forEach((activity, index) => {
    report.heading(`Activity ${index + 1}`)
    report.table(null, [["Title", activity.title], ["Date", date(activity.date)], ["Location", text(activity.location)],
      ["Posted By", text(activity.createdByName)], ["Recorded", date(activity.createdAt)], ["Last Updated", date(activity.updatedAt)]])
    report.paragraph(`Description: ${activity.description}`)
    report.paragraph(`Notes: ${activity.notes || "No notes recorded."}`)
    activity.images.forEach((image, photo) => report.image(image, `Activity ${index + 1} - Picture ${photo + 1}`))
  })
  return report.finish()
}

export function createMentorReport(mentorName: string, sessions: MentorReportSession[]): ArrayBuffer {
  const report = new IndividualReport("Mentor Detail Report", mentorName)
  report.heading("Summary")
  report.table(null, [
    ["Mentor", mentorName], ["Total Sessions", String(sessions.length)],
    ["Group Sessions", String(sessions.filter(session => session.sessionType === "GROUP").length)],
    ["One-on-One Sessions", String(sessions.filter(session => session.sessionType === "ONE_ON_ONE").length)],
    ["Linked Participants", String(new Set(sessions.map(session => session.participantId).filter(Boolean)).size)],
  ])
  report.paragraph("Includes all recorded sessions under this mentor name.")
  sessions.forEach((session, index) => {
    sessionDetails(report, session, index)
    report.table(null, [["Participant", session.participant?.name || "General / Group"],
      ["Program", text(session.participant?.program)], ["Institute", text(session.participant?.institute)],
      ["Participant Status", text(session.participant?.status).replaceAll("_", " ")]])
  })
  return report.finish()
}

export function reportFilename(name: string, kind: "participant" | "mentor"): string {
  const safe = name.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || kind
  return `${kind}_${safe}_report.pdf`
}
