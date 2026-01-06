import { AggregateUpdate } from "./aggregator";
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import type { Granularity } from "../../../generated/prisma/client.js";

// Get directory for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (three levels up from apps/processor/src/dbWriter.ts)
config({ path: resolve(__dirname, '../../../.env') });

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
}

// Clean and validate DATABASE_URL format
// Remove any surrounding quotes and trim whitespace
let dbUrl = process.env.DATABASE_URL.trim();
if ((dbUrl.startsWith('"') && dbUrl.endsWith('"')) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
    dbUrl = dbUrl.slice(1, -1);
}

if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    console.error('[dbWriter] Invalid DATABASE_URL format. Expected postgresql:// or postgres://');
    console.error('[dbWriter] Got:', dbUrl.substring(0, 20) + '...');
    throw new Error('Invalid DATABASE_URL format');
}

// Log connection info (without password)
const dbUrlSafe = dbUrl.replace(/:([^:@]+)@/, ':****@');
console.log('[dbWriter] Database URL loaded:', dbUrlSafe);

const adapter = new PrismaPg({
  connectionString: dbUrl,
})

// Use dynamic import to ensure module loads correctly (needed for ESM compatibility)
const PrismaModule = await import("../../../generated/prisma/client.js");
const PrismaClient = PrismaModule.PrismaClient;

const prisma = new PrismaClient({
  adapter,
});

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
          path: u.path,
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
