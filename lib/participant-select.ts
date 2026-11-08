import type { Prisma } from "@prisma/client"
import { participantAdmissionFields } from "./participant-admission"

export const participantSummarySelect = {
  id: true,
  name: true,
  image: true,
  program: true,
  institute: true,
  startYear: true,
  endYear: true,
  courseType: true,
  currentSemester: true,
  currentYear: true,
  duration: true,
  fieldRemarks: true,
  academicResults: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
} satisfies Prisma.RFLParticipantSelect

export const participantAdmissionSelect = Object.fromEntries(
  participantAdmissionFields.map(({ name }) => [name, true]),
)
