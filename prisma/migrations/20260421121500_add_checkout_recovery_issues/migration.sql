-- CreateEnum
CREATE TYPE "CheckoutRecoveryIssueStatus" AS ENUM ('open', 'resolved');

-- CreateTable
CREATE TABLE "CheckoutRecoveryIssue" (
    "id" TEXT NOT NULL,
    "checkoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "cartId" TEXT,
    "eventType" TEXT NOT NULL,
    "lastError" TEXT NOT NULL,
    "status" "CheckoutRecoveryIssueStatus" NOT NULL DEFAULT 'open',
    "recoveredOrderId" TEXT,
    "resolutionSource" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutRecoveryIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutRecoveryIssue_checkoutSessionId_key" ON "CheckoutRecoveryIssue"("checkoutSessionId");

-- CreateIndex
CREATE INDEX "CheckoutRecoveryIssue_status_createdAt_idx" ON "CheckoutRecoveryIssue"("status", "createdAt");
