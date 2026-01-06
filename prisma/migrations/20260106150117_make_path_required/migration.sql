/*
  Warnings:

  - Made the column `path` on table `Analytics` required. This step will fail if there are existing NULL values in that column.

*/
-- First, convert all NULL values to empty string (domain-level aggregates)
UPDATE "Analytics" SET "path" = '' WHERE "path" IS NULL;

-- Then make the column required
ALTER TABLE "Analytics" ALTER COLUMN "path" SET NOT NULL;
