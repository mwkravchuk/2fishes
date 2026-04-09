/*
  Warnings:

  - Added the required column `selectedGrind` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selectedSize` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origin` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Made the column `imageUrl` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "GrindOption" AS ENUM ('whole_bean');

-- CreateEnum
CREATE TYPE "BagSize" AS ENUM ('oz12');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "selectedGrind" "GrindOption" NOT NULL,
ADD COLUMN     "selectedSize" "BagSize" NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "availableGrinds" "GrindOption"[] DEFAULT ARRAY['whole_bean']::"GrindOption"[],
ADD COLUMN     "availableSizes" "BagSize"[] DEFAULT ARRAY['oz12']::"BagSize"[],
ADD COLUMN     "flavorNotes" TEXT[],
ADD COLUMN     "origin" TEXT NOT NULL,
ALTER COLUMN "imageUrl" SET NOT NULL;
