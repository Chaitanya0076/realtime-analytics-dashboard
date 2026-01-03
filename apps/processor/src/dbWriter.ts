import { PrismaClient } from "../../../app/generated/prisma/client";
import { Granularity } from "../../../app/generated/prisma/enums";
import { AggregateUpdate } from "./aggregator";

// @ts-expect-error - PrismaClient constructor signature from generated client
const prisma = new PrismaClient({});

// Convert lowercase granularity strings to uppercase enum values
function toGranularityEnum(granularity: "minute" | "hour"): Granularity {
  return granularity.toUpperCase() as Granularity;
}

export async function flushToDb(updates: AggregateUpdate[]) {
  for (const u of updates) {
    await prisma.analytics.upsert({
      where: {
        domainId_bucket_granularity_path: {
          domainId: u.domainId,
          bucket: u.bucket,
          granularity: toGranularityEnum(u.granularity),
          path: u.path as string ,
        },
      },
      update: {
        count: { increment: u.count },
      },
      create: {
        domainId: u.domainId,
        bucket: u.bucket,
        granularity: toGranularityEnum(u.granularity),
        path: u.path,
        count: u.count,
      },
    });
  }
}
