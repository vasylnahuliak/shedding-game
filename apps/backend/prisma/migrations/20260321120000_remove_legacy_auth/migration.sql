-- Drop legacy guest auth storage and provider marker.
DROP TABLE IF EXISTS "public"."auth_tokens";

-- All runtime auth now comes from Supabase JWTs.
ALTER TABLE "public"."users" DROP COLUMN IF EXISTS "auth_provider";

DROP TYPE IF EXISTS "public"."AuthProvider";
