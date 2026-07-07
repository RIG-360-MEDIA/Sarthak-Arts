-- AlterTable
ALTER TABLE "CheckoutIntent" ADD COLUMN     "giftNote" TEXT,
ADD COLUMN     "isGift" BOOLEAN NOT NULL DEFAULT false;
