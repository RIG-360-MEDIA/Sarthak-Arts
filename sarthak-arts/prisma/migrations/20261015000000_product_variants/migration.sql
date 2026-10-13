-- Product options (colour / pattern) the customer chooses on the product page.
CREATE TABLE "ProductVariant" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "priceMinor" INTEGER,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductImage" ADD COLUMN "variantId" INTEGER;
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- One cart line per product+option (enforced in code; a NULL option can't be unique-indexed simply).
DROP INDEX "CartItem_cartId_productId_key";
ALTER TABLE "CartItem" ADD COLUMN "variantId" INTEGER;
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD COLUMN "variantId" INTEGER;
ALTER TABLE "OrderItem" ADD COLUMN "variantLabel" TEXT;

ALTER TABLE "Product" ADD COLUMN "optionName" TEXT;
