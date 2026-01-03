-- CreateEnum
CREATE TYPE "Granularity" AS ENUM ('MINUTE', 'HOUR', 'DAY', 'WEEK', 'MONTH');

-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "bucket" TIMESTAMP(3) NOT NULL,
    "granularity" "Granularity" NOT NULL,
    "path" TEXT,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Analytics_domainId_granularity_bucket_idx" ON "Analytics"("domainId", "granularity", "bucket");

-- CreateIndex
CREATE INDEX "Analytics_domainId_path_idx" ON "Analytics"("domainId", "path");

-- AddForeignKey
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
