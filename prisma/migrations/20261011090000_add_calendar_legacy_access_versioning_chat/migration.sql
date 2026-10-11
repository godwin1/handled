-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "extractedText" TEXT,
ADD COLUMN     "supersedesId" TEXT;

-- AlterTable
ALTER TABLE "Household" ADD COLUMN     "calendarToken" TEXT,
ADD COLUMN     "legacyAccessMinWaitDays" INTEGER NOT NULL DEFAULT 14;

-- CreateTable
CREATE TABLE "LegacyAccessLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "householdId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "LegacyAccessLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyAccessRequest" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantAt" TIMESTAMP(3) NOT NULL,
    "cancelToken" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "linkId" TEXT NOT NULL,

    CONSTRAINT "LegacyAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiChatQuery" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AiChatQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegacyAccessLink_token_key" ON "LegacyAccessLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyAccessRequest_cancelToken_key" ON "LegacyAccessRequest"("cancelToken");

-- CreateIndex
CREATE INDEX "AiChatQuery_householdId_createdAt_idx" ON "AiChatQuery"("householdId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Document_supersedesId_key" ON "Document"("supersedesId");

-- CreateIndex
CREATE UNIQUE INDEX "Household_calendarToken_key" ON "Household"("calendarToken");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegacyAccessLink" ADD CONSTRAINT "LegacyAccessLink_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegacyAccessLink" ADD CONSTRAINT "LegacyAccessLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegacyAccessRequest" ADD CONSTRAINT "LegacyAccessRequest_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "LegacyAccessLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiChatQuery" ADD CONSTRAINT "AiChatQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

