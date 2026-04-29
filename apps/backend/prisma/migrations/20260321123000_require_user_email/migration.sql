-- Normalize legacy dev rows before enforcing NOT NULL on users.email.
UPDATE "public"."users"
SET "email" = "id"::text || '@legacy.local'
WHERE "email" IS NULL;

ALTER TABLE "public"."users"
ALTER COLUMN "email" SET NOT NULL;
