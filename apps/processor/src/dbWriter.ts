import { AggregateUpdate } from "./aggregator.js";
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import type { Granularity } from "../../../generated/prisma/client.js";
import { PrismaClient } from "../../../generated/prisma/client.js";

// Get directory for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine if we're in development or production (compiled)
// In development: __dirname = apps/processor/src
// In production (compiled): __dirname = apps/processor/dist
const isCompiled = __dirname.includes('dist');
const projectRoot = isCompiled 
  ? resolve(__dirname, '../../..')  // dist -> processor -> apps -> root
  : resolve(__dirname, '../../../..'); // src -> processor -> apps -> root

// Load .env from project root
config({ path: resolve(projectRoot, '.env') });

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

// Initialize Prisma adapter
const adapter = new PrismaPg({
  connectionString: dbUrl,
});

// Initialize Prisma client
const prisma = new PrismaClient({
  adapter,
});

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('[dbWriter] Disconnecting Prisma client...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[dbWriter] Disconnecting Prisma client...');
  await prisma.$disconnect();
  process.exit(0);
});

// Convert lowercase granularity strings to uppercase enum values
function toGranularityEnum(granularity: "minute" | "hour"): Granularity {
  return granularity.toUpperCase() as Granularity;
}

export async function flushToDb(updates: AggregateUpdate[]): Promise<void> {
  if (updates.length === 0) {
    return;
  }

  try {
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
  } catch (error) {
    console.error('[dbWriter] Error flushing to database:', error);
    throw error;
  }
}
