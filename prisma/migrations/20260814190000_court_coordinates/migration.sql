-- Courts picked from the map carry their position, which is also what the
-- server uses to derive the match's time zone. Nullable, because a court can
-- still be typed in by hand.
ALTER TABLE "Match" ADD COLUMN "lat" REAL;
ALTER TABLE "Match" ADD COLUMN "lon" REAL;
