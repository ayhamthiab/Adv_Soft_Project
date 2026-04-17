-- CreateEnum
CREATE TYPE "CheckpointStatus" AS ENUM ('open', 'closed', 'restricted');

-- CreateTable
CREATE TABLE "Checkpoint" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "CheckpointStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckpointHistory" (
    "id" SERIAL NOT NULL,
    "checkpointId" INTEGER NOT NULL,
    "oldStatus" "CheckpointStatus",
    "newStatus" "CheckpointStatus" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckpointHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckpointHistory_checkpointId_idx" ON "CheckpointHistory"("checkpointId");

-- AddForeignKey
ALTER TABLE "CheckpointHistory" ADD CONSTRAINT "CheckpointHistory_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "Checkpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
