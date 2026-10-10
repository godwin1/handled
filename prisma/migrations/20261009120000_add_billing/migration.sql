-- AlterTable
ALTER TABLE "Household" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "legacyFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT,
ADD COLUMN     "currentPeriodEnd" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Household_stripeCustomerId_key" ON "Household"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Household_stripeSubscriptionId_key" ON "Household"("stripeSubscriptionId");

-- Grandfather every household that existed before billing launched into
-- full (Family-tier) access forever, regardless of `plan`. Anything
-- created after this migration runs starts as a normal free-tier
-- household (legacyFree defaults to false).
UPDATE "Household" SET "legacyFree" = true;
