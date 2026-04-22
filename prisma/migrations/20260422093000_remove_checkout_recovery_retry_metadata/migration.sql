-- AlterTable
ALTER TABLE "CheckoutRecoveryIssue"
DROP COLUMN "attemptCount",
DROP COLUMN "lastAttemptedAt",
DROP COLUMN "escalatedAt";
