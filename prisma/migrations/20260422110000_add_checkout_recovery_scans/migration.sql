-- CreateTable
CREATE TABLE "CheckoutRecoveryScan" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "checkedSessions" INTEGER NOT NULL,
    "missingOrders" INTEGER NOT NULL,
    "resolvedIssues" INTEGER NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckoutRecoveryScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckoutRecoveryScan_source_createdAt_idx" ON "CheckoutRecoveryScan"("source", "createdAt");
