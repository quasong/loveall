-- Courts can be anywhere in the world, so a match now carries its city, country
-- and IANA time zone, plus the currency its fee is quoted in.
--
-- Existing rows were all Beijing district courts: the district moves into the
-- court name so nothing is lost, and the rest is backfilled accordingly.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "courtName" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 120,
    "capacity" INTEGER NOT NULL,
    "minNtrp" REAL NOT NULL DEFAULT 1.0,
    "maxNtrp" REAL NOT NULL DEFAULT 7.0,
    "format" TEXT NOT NULL DEFAULT 'DOUBLES',
    "feeCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "note" TEXT,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Match" (
    "id", "hostId", "title", "courtName", "city", "country", "timezone",
    "startsAt", "durationMin", "capacity", "minNtrp", "maxNtrp", "format",
    "feeCents", "currency", "note", "cancelled", "createdAt"
)
SELECT
    "id",
    "hostId",
    "title",
    "courtName" || ' (' || "courtArea" || ')',
    'Beijing',
    'China',
    'Asia/Shanghai',
    "startsAt",
    "durationMin",
    "capacity",
    "minNtrp",
    "maxNtrp",
    "format",
    "feeCents",
    'CNY',
    "note",
    "cancelled",
    "createdAt"
FROM "Match";

DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";

CREATE INDEX "Match_startsAt_idx" ON "Match"("startsAt");
CREATE INDEX "Match_city_idx" ON "Match"("city");

PRAGMA foreign_keys=ON;
