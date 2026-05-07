import { prisma } from "@/lib/prisma"

interface LogActionProps {
  userId: string
  userEmail: string
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "EXPORT"
  module: "RFL" | "USERS" | "SYSTEM" | "REPORTS"
  description: string
  req?: Request
}

export async function logAction({ userId, userEmail, action, module, description, req }: LogActionProps) {
  try {
    let ipAddress = null
    
    if (req) {
      // In Next.js App Router, req.headers.get("x-forwarded-for") is a common way to get IP
      const forwarded = req.headers.get("x-forwarded-for")
      const realIp = req.headers.get("x-real-ip")
      ipAddress = forwarded ? forwarded.split(",")[0] : realIp
    }

    await prisma.auditLog.create({
      data: {
        userId,
        userEmail,
        action,
        module,
        description,
        ipAddress: ipAddress || "Unknown"
      }
    })
  } catch (error) {
    console.error("Failed to log action:", error)
  }
}
