-- DropForeignKey
ALTER TABLE "RFLMentorship" DROP CONSTRAINT "RFLMentorship_participantId_fkey";

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "participantId" TEXT;

-- AlterTable
ALTER TABLE "RFLMentorship" ADD COLUMN     "images" TEXT[],
ALTER COLUMN "participantId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Activity_participantId_idx" ON "Activity"("participantId");

-- AddForeignKey
ALTER TABLE "RFLMentorship" ADD CONSTRAINT "RFLMentorship_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "RFLParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
