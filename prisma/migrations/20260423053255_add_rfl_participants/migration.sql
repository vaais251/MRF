-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('GROUP', 'ONE_ON_ONE');

-- CreateTable
CREATE TABLE "RFLParticipant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "institute" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER NOT NULL,
    "currentSemester" INTEGER NOT NULL,
    "academicResults" JSONB NOT NULL,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "RFLParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFLMentorship" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "mentorName" TEXT NOT NULL,
    "sessionType" "SessionType" NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RFLMentorship_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RFLMentorship" ADD CONSTRAINT "RFLMentorship_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "RFLParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
