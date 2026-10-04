-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totpSecret" TEXT;

-- CreateTable
CREATE TABLE "PendingTwoFactor" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PendingTwoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BackupCode_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PendingTwoFactor" ADD CONSTRAINT "PendingTwoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupCode" ADD CONSTRAINT "BackupCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
