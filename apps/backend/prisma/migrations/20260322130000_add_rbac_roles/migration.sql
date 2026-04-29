-- CreateEnum
CREATE TYPE "public"."AppRole" AS ENUM ('player', 'admin', 'super_admin');

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" SERIAL NOT NULL,
    "name" "public"."AppRole" NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" INTEGER NOT NULL,
    "assigned_at_ms" BIGINT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "public"."user_roles"("role_id");

-- Seed roles
INSERT INTO "public"."roles" ("name")
VALUES ('player'), ('admin'), ('super_admin')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "public"."user_roles" ("user_id", "role_id", "assigned_at_ms")
SELECT "u"."id", "r"."id", CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT)
FROM "public"."users" AS "u"
CROSS JOIN "public"."roles" AS "r"
WHERE "r"."name" = 'player'
ON CONFLICT ("user_id", "role_id") DO NOTHING;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
