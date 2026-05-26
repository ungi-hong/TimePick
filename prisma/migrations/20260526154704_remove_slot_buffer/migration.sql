/*
  Warnings:

  - You are about to drop the column `bufferMinutes` on the `Availability` table. All the data in the column will be lost.
  - You are about to drop the column `defaultSlotMin` on the `Availability` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Availability" DROP COLUMN "bufferMinutes",
DROP COLUMN "defaultSlotMin";
