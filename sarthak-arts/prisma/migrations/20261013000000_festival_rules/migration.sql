-- Festivals carry their own rule so dates can roll forward automatically and the owner can add new ones.
ALTER TABLE "Festival" ADD COLUMN "basis" TEXT;
ALTER TABLE "Festival" ADD COLUMN "fixedDate" TEXT;
