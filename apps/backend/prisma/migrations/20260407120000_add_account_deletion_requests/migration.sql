-- CreateTable
CREATE TABLE "public"."account_deletion_requests" (
    "request_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "user_id" TEXT,
    "display_name" TEXT,
    "notes" TEXT,
    "locale" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "created_at_ms" BIGINT NOT NULL,

    CONSTRAINT "account_deletion_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateIndex
CREATE INDEX "account_deletion_requests_email_idx" ON "public"."account_deletion_requests"("email");

-- CreateIndex
CREATE INDEX "account_deletion_requests_created_at_ms_idx" ON "public"."account_deletion_requests"("created_at_ms");