/*
  Warnings:

  - A unique constraint covering the columns `[stripeCheckoutSessionId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stripeCheckoutSessionId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "stripeCheckoutSessionId" TEXT NOT NULL,
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeCheckoutSessionId_key" ON "Order"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");
