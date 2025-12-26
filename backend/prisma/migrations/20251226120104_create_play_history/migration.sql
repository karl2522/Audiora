-- CreateTable
CREATE TABLE "play_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "track_id" VARCHAR(255) NOT NULL,
    "track_title" VARCHAR(500) NOT NULL,
    "track_artist" VARCHAR(255) NOT NULL,
    "track_genre" VARCHAR(100),
    "track_mood" VARCHAR(100),
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "skipped_at" TIMESTAMP(3),
    "duration_played" INTEGER NOT NULL DEFAULT 0,
    "track_duration" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "play_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" SERIAL NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "play_history_user_id_idx" ON "play_history"("user_id");

-- CreateIndex
CREATE INDEX "play_history_started_at_idx" ON "play_history"("started_at");

-- CreateIndex
CREATE INDEX "play_history_user_id_started_at_idx" ON "play_history"("user_id", "started_at");

-- AddForeignKey
ALTER TABLE "play_history" ADD CONSTRAINT "play_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
