const image = "data:image/png;base64," + require("node:fs").readFileSync(require("node:path").join(__dirname, "report-photo.png")).toString("base64")
const timestamp = new Date("2026-11-01T12:00:00Z")
const sessions = Array.from({ length: 3 }, (_, index) => ({
  id: `session-${index}`, participantId: "member-id", mentorName: "Test Mentor", sessionType: index === 0 ? "GROUP" : "ONE_ON_ONE",
  sessionDate: timestamp, targetAudience: "University students", notes: "Detailed session notes with next steps. ".repeat(18), images: index === 0 ? [image] : [], createdAt: timestamp,
}))
const participant = {
  id: "member-id", name: "Test Participant", program: "BS Computer Science", institute: "Test University", status: "ACTIVE", image,
  startYear: 2023, endYear: 2027, courseType: "Semester System", currentSemester: 6, currentYear: null, duration: null, fieldRemarks: null,
  createdAt: timestamp, updatedAt: timestamp, createdBy: "staff-id",
  fatherName: "Test Father", phone1: "0300-0000000", phone2: null, whatsAppNumber: "0300-0000000", guardianName: "Test Guardian",
  guardianRelation: "Parent", guardianPhone: "0300-0000001", cnic: "00000-0000000-0", district: "Skardu",
  permanentAddress: "Test address with a long note. ".repeat(10), currentAddress: "University hostel", medicalConditions: "None recorded",
  academicResults: [
    { name: "Semester Results", period: "Semester 6", percentage: "87", gpa: "3.7", cgpa: "3.6", comments: "Strong progress", file: image },
    { subjectName: "Legacy Result", semester: 5, grade: "A", comments: "Legacy format remains readable" },
  ],
  mentorships: sessions,
  activities: [{ id: "activity-id", participantId: "member-id", title: "Leadership workshop", description: "A complete description of the leadership workshop. ".repeat(25),
    date: timestamp, location: "Campus hall", notes: "Follow up next month.", images: [image], createdBy: "staff-id", createdByName: "Coordinator", createdAt: timestamp, updatedAt: timestamp }],
}
module.exports = { participant, mentorSessions: sessions.map(session => ({ ...session, participant: { id: participant.id, name: participant.name, program: participant.program, institute: participant.institute, status: participant.status } })) }
