/*
  Warnings:

  - A unique constraint covering the columns `[domainId,bucket,granularity,path]` on the table `Analytics` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Analytics_domainId_bucket_granularity_path_key" ON "Analytics"("domainId", "bucket", "granularity", "path");
