-- Google sign-in. An account can now exist without a password, and carries
-- Google's subject id when it is linked — the email on its own is not an
-- identity, since a Google address can change hands.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '🎾',
    "ntrp" REAL NOT NULL DEFAULT 3.0,
    "homeCourt" TEXT,
    "playStyle" TEXT NOT NULL DEFAULT 'BOTH',
    "bio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_User" (
    "id", "email", "passwordHash", "name", "avatar", "ntrp",
    "homeCourt", "playStyle", "bio", "createdAt"
)
SELECT
    "id", "email", "passwordHash", "name", "avatar", "ntrp",
    "homeCourt", "playStyle", "bio", "createdAt"
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

PRAGMA foreign_keys=ON;
