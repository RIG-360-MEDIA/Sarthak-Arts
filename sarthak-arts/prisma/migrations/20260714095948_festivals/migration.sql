-- CreateTable
CREATE TABLE "Festival" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameDeva" TEXT NOT NULL,
    "nameIast" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "observedOn" TIMESTAMP(3) NOT NULL,
    "masaIast" TEXT,
    "tithiIast" TEXT,
    "paksha" TEXT,
    "regions" TEXT[],
    "productSlugs" TEXT[],
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Festival_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Festival_code_key" ON "Festival"("code");

-- CreateIndex
CREATE INDEX "Festival_observedOn_idx" ON "Festival"("observedOn");
