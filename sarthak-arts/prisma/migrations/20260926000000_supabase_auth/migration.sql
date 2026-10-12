-- Login moves to Supabase Auth: link each User to its auth account.
ALTER TABLE "User" ADD COLUMN "authId" TEXT;
CREATE UNIQUE INDEX "User_authId_key" ON "User"("authId");
