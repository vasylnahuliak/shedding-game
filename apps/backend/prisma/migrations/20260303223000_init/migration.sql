-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('human', 'bot');

-- CreateEnum
CREATE TYPE "public"."GameStatus" AS ENUM ('waiting', 'playing', 'round_over', 'finished');

-- CreateEnum
CREATE TYPE "public"."Suit" AS ENUM ('hearts', 'diamonds', 'clubs', 'spades');

-- CreateEnum
CREATE TYPE "public"."RoomCardLocation" AS ENUM ('deck', 'discard', 'hand', 'bridge_last');

-- CreateEnum
CREATE TYPE "public"."RoundScoreEventType" AS ENUM ('reset_115', 'eliminated', 'jack_bonus', 'bridge');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "user_type" "public"."UserType" NOT NULL,
    "emoji_preferences" JSONB,
    "created_at_ms" BIGINT NOT NULL,
    "updated_at_ms" BIGINT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auth_tokens" (
    "token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at_ms" BIGINT NOT NULL,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "public"."rooms" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "host_id" UUID NOT NULL,
    "created_at_ms" BIGINT NOT NULL,
    "last_activity_at_ms" BIGINT NOT NULL,
    "game_status" "public"."GameStatus" NOT NULL,
    "current_player_index" INTEGER NOT NULL,
    "penalty_cards_count" INTEGER NOT NULL,
    "active_suit" "public"."Suit",
    "debug_mode" TEXT,
    "has_drawn_this_turn" BOOLEAN NOT NULL,
    "reshuffle_count" INTEGER NOT NULL,
    "bridge_available" BOOLEAN NOT NULL,
    "bridge_player_id" TEXT,
    "is_opening_turn" BOOLEAN NOT NULL,
    "game_started_at_ms" BIGINT,
    "game_finished_at_ms" BIGINT,
    "winner_id" TEXT,
    "winner_name" TEXT,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."room_players" (
    "room_id" UUID NOT NULL,
    "player_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "player_type" "public"."UserType" NOT NULL,
    "score" INTEGER NOT NULL,
    "is_leaver" BOOLEAN NOT NULL DEFAULT false,
    "turn_order" INTEGER NOT NULL,

    CONSTRAINT "room_players_pkey" PRIMARY KEY ("room_id","player_id")
);

-- CreateTable
CREATE TABLE "public"."room_cards" (
    "id" BIGSERIAL NOT NULL,
    "room_id" UUID NOT NULL,
    "location" "public"."RoomCardLocation" NOT NULL,
    "owner_player_id" TEXT,
    "position" INTEGER NOT NULL,
    "suit" "public"."Suit" NOT NULL,
    "rank" TEXT NOT NULL,

    CONSTRAINT "room_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."room_ready_players" (
    "room_id" UUID NOT NULL,
    "player_id" TEXT NOT NULL,

    CONSTRAINT "room_ready_players_pkey" PRIMARY KEY ("room_id","player_id")
);

-- CreateTable
CREATE TABLE "public"."room_rounds" (
    "id" BIGSERIAL NOT NULL,
    "room_id" UUID NOT NULL,
    "round_index" INTEGER NOT NULL,

    CONSTRAINT "room_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."room_round_entries" (
    "round_id" BIGINT NOT NULL,
    "entry_order" INTEGER NOT NULL,
    "player_id" TEXT NOT NULL,
    "score_change" INTEGER NOT NULL,
    "total_score" INTEGER NOT NULL,
    "event_type" "public"."RoundScoreEventType",

    CONSTRAINT "room_round_entries_pkey" PRIMARY KEY ("round_id","entry_order")
);

-- CreateTable
CREATE TABLE "public"."closed_games" (
    "archive_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "game_status" "public"."GameStatus" NOT NULL,
    "rounds_played" INTEGER NOT NULL,
    "created_at_ms" BIGINT,
    "game_started_at_ms" BIGINT,
    "game_finished_at_ms" BIGINT,
    "closed_at_ms" BIGINT NOT NULL,
    "closed_reason" TEXT,

    CONSTRAINT "closed_games_pkey" PRIMARY KEY ("archive_id")
);

-- CreateTable
CREATE TABLE "public"."closed_game_players" (
    "archive_id" UUID NOT NULL,
    "player_order" INTEGER NOT NULL,
    "player_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "player_type" "public"."UserType" NOT NULL,
    "is_leaver" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "closed_game_players_pkey" PRIMARY KEY ("archive_id","player_order")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_name_key" ON "public"."users"("name");

-- CreateIndex
CREATE INDEX "auth_tokens_expires_at_ms_idx" ON "public"."auth_tokens"("expires_at_ms");

-- CreateIndex
CREATE INDEX "room_players_player_id_idx" ON "public"."room_players"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_players_room_id_turn_order_key" ON "public"."room_players"("room_id", "turn_order");

-- CreateIndex
CREATE INDEX "room_cards_room_id_idx" ON "public"."room_cards"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_cards_room_location_owner_position_key" ON "public"."room_cards"("room_id", "location", "owner_player_id", "position");

-- CreateIndex
CREATE INDEX "room_rounds_room_id_idx" ON "public"."room_rounds"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_rounds_room_id_round_index_key" ON "public"."room_rounds"("room_id", "round_index");

-- CreateIndex
CREATE INDEX "room_round_entries_player_id_idx" ON "public"."room_round_entries"("player_id");

-- CreateIndex
CREATE INDEX "closed_games_room_id_idx" ON "public"."closed_games"("room_id");

-- CreateIndex
CREATE INDEX "closed_games_closed_at_ms_idx" ON "public"."closed_games"("closed_at_ms");

-- CreateIndex
CREATE INDEX "closed_game_players_player_id_idx" ON "public"."closed_game_players"("player_id");

-- AddForeignKey
ALTER TABLE "public"."auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rooms" ADD CONSTRAINT "rooms_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_players" ADD CONSTRAINT "room_players_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_cards" ADD CONSTRAINT "room_cards_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_ready_players" ADD CONSTRAINT "room_ready_players_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_rounds" ADD CONSTRAINT "room_rounds_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_round_entries" ADD CONSTRAINT "room_round_entries_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."room_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."closed_game_players" ADD CONSTRAINT "closed_game_players_archive_id_fkey" FOREIGN KEY ("archive_id") REFERENCES "public"."closed_games"("archive_id") ON DELETE CASCADE ON UPDATE CASCADE;

