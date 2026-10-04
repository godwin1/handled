-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "amount" DOUBLE PRECISION,
ADD COLUMN     "billingCycle" TEXT,
ADD COLUMN     "currency" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "recurrence" TEXT;

-- CreateTable
CREATE TABLE "DocumentShareLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "DocumentShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentShareLink_token_key" ON "DocumentShareLink"("token");

-- AddForeignKey
ALTER TABLE "DocumentShareLink" ADD CONSTRAINT "DocumentShareLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentShareLink" ADD CONSTRAINT "DocumentShareLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
