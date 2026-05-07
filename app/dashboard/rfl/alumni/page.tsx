import { prisma } from "@/lib/prisma"
import AlumniClient from "./AlumniClient"

export default async function AlumniPage() {
  const currentYear = new Date().getFullYear()

  const [totalAlumni, activitiesThisYear, mostRecentAlumni] = await Promise.all([
    prisma.rFLAlumni.count(),
    prisma.rFLAlumniActivity.count({
      where: {
        date: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31)
        }
      }
    }),
    prisma.rFLAlumni.findFirst({
      orderBy: { graduationYear: 'desc' },
      select: { graduationYear: true }
    })
  ])

  const stats = {
    totalAlumni,
    activitiesThisYear,
    mostRecentGraduationYear: mostRecentAlumni?.graduationYear || "N/A"
  }

  return <AlumniClient stats={stats} />
}
