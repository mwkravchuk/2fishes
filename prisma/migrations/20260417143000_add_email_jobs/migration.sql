-- CreateEnum
CREATE TYPE "EmailJobType" AS ENUM ('order_confirmation', 'internal_new_order');

-- CreateEnum
CREATE TYPE "EmailJobStatus" AS ENUM ('pending', 'processing', 'sent', 'failed');

-- CreateTable
CREATE TABLE "EmailJob" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "EmailJobType" NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "EmailJobStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailJob_orderId_type_key" ON "EmailJob"("orderId", "type");

-- CreateIndex
CREATE INDEX "EmailJob_status_createdAt_idx" ON "EmailJob"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "EmailJob" ADD CONSTRAINT "EmailJob_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
