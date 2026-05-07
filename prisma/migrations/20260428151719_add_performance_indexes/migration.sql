-- CreateEnum
CREATE TYPE "SponsorshipType" AS ENUM ('FULL', 'PARTIAL', 'MERIT_BASED', 'NEED_BASED');

-- CreateEnum
CREATE TYPE "SponsorshipStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'PENDING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotifType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ERROR');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "RFLAlumni" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "institute" TEXT NOT NULL,
    "graduationYear" INTEGER NOT NULL,
    "currentStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFLAlumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFLAlumniActivity" (
    "id" TEXT NOT NULL,
    "alumniId" TEXT NOT NULL,
    "activityName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFLAlumniActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFLSponsorship" (
    "id" TEXT NOT NULL,
    "sponsorName" TEXT NOT NULL,
    "type" "SponsorshipType" NOT NULL,
    "amount" DECIMAL(65,30),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "SponsorshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "participantId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFLSponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotifType" NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RFLAlumniActivity_alumniId_idx" ON "RFLAlumniActivity"("alumniId");

-- CreateIndex
CREATE INDEX "RFLSponsorship_status_idx" ON "RFLSponsorship"("status");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "RFLMentorship_participantId_idx" ON "RFLMentorship"("participantId");

-- CreateIndex
CREATE INDEX "RFLParticipant_status_idx" ON "RFLParticipant"("status");

-- AddForeignKey
ALTER TABLE "RFLAlumniActivity" ADD CONSTRAINT "RFLAlumniActivity_alumniId_fkey" FOREIGN KEY ("alumniId") REFERENCES "RFLAlumni"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
