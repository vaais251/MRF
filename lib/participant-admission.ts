import { z } from "zod"

function optionalText(maxLength: number) {
  return z.string().trim().max(maxLength).transform(value => value || null).nullish()
}

export const participantAdmissionSchema = z.object({
  fatherName: optionalText(200),
  phone1: optionalText(40),
  phone2: optionalText(40),
  whatsAppNumber: optionalText(40),
  guardianName: optionalText(200),
  guardianRelation: optionalText(200),
  guardianPhone: optionalText(40),
  permanentAddress: optionalText(1000),
  currentAddress: optionalText(1000),
  cnic: optionalText(40),
  district: optionalText(200),
  medicalConditions: optionalText(1000),
})

export const participantAdmissionFields = [
  { name: "fatherName", label: "Father’s name", input: "text" },
  { name: "phone1", label: "Primary phone number", input: "tel" },
  { name: "phone2", label: "Secondary phone number", input: "tel" },
  { name: "whatsAppNumber", label: "WhatsApp number", input: "tel" },
  { name: "guardianName", label: "Guardian’s name", input: "text" },
  { name: "guardianRelation", label: "Guardian’s relationship to student", input: "text" },
  { name: "guardianPhone", label: "Guardian’s phone number", input: "tel" },
  { name: "cnic", label: "CNIC number", input: "text" },
  { name: "district", label: "District", input: "text" },
  { name: "permanentAddress", label: "Permanent address (as on CNIC)", input: "textarea" },
  { name: "currentAddress", label: "Current address", input: "textarea" },
  { name: "medicalConditions", label: "Medical conditions", input: "textarea" },
] as const satisfies ReadonlyArray<{
  name: keyof z.infer<typeof participantAdmissionSchema>
  label: string
  input: "text" | "tel" | "textarea"
}>
