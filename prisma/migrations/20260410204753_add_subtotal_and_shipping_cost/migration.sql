/*
  Warnings:

  - Added the required column `shippingCents` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotalCents` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingCents" INTEGER NOT NULL,
ADD COLUMN     "subtotalCents" INTEGER NOT NULL;
