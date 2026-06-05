-- AlterTable
ALTER TABLE "RFLParticipant" ADD COLUMN     "courseType" TEXT,
ADD COLUMN     "currentYear" INTEGER,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "fieldRemarks" TEXT,
ALTER COLUMN "currentSemester" DROP NOT NULL;
