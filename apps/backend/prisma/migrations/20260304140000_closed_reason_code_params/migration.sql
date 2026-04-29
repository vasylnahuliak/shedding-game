ALTER TABLE "closed_games"
ADD COLUMN "closed_reason_code" TEXT,
ADD COLUMN "closed_reason_params" JSONB;

ALTER TABLE "closed_games"
DROP COLUMN "closed_reason";
