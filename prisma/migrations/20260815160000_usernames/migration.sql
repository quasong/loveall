-- Public handles, in the Instagram mould: unique, lowercase, and separate from
-- the display name. Nullable because picking one is optional — SQLite treats
-- NULLs as distinct in a unique index, so any number of accounts can go without.
ALTER TABLE "User" ADD COLUMN "username" TEXT;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
