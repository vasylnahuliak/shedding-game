-- CreateEnum
CREATE TYPE "public"."AuthProvider" AS ENUM ('legacy', 'supabase');

-- AlterTable
ALTER TABLE "public"."users"
ADD COLUMN "email" TEXT,
ADD COLUMN "auth_provider" "public"."AuthProvider" NOT NULL DEFAULT 'legacy';

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");
