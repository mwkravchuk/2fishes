-- AlterTable
ALTER TABLE "CheckoutRecoveryIssue"
ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastAttemptedAt" TIMESTAMP(3),
ADD COLUMN     "escalatedAt" TIMESTAMP(3);
