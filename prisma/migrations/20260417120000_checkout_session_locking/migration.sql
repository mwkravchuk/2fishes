-- AlterTable
ALTER TABLE "Cart"
ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripeCheckoutSessionUrl" TEXT,
ADD COLUMN     "stripeCheckoutSessionExpire" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN     "sourceCartId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Cart_stripeCheckoutSessionId_key" ON "Cart"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_sourceCartId_key" ON "Order"("sourceCartId");
