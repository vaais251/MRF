-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'TRUST_MGMT', 'PROGRAM_MANAGER', 'MEO_OFFICER', 'SCHOOL_AUTHORITY', 'HOSTEL_INCHARGE', 'RFL_COORDINATOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SUPER_ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
