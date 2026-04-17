/*
  Warnings:

  - You are about to drop the column `changedAt` on the `CheckpointHistory` table. All the data in the column will be lost.
  - You are about to drop the column `newStatus` on the `CheckpointHistory` table. All the data in the column will be lost.
  - You are about to drop the column `oldStatus` on the `CheckpointHistory` table. All the data in the column will be lost.
  - Added the required column `status` to the `CheckpointHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CheckpointHistory" DROP COLUMN "changedAt",
DROP COLUMN "newStatus",
DROP COLUMN "oldStatus",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "CheckpointStatus" NOT NULL;
