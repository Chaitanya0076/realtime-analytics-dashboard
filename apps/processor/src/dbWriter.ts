import { AggregateUpdate } from "./aggregator.js";
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get directory for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine project root - both src and dist are at the same depth:
// apps/processor/src -> apps/processor -> apps -> root (3 levels up)
// apps/processor/dist -> apps/processor -> apps -> root (3 levels up)
const projectRoot = resolve(__dirname, '../../..');

// Debug: log paths to help diagnose issues
console.log('[dbWriter] __dirname:', __dirname);
console.log('[dbWriter] Project root:', projectRoot);

// Load .env from project root
const envPath = resolve(projectRoot, '.env');
console.log('[dbWriter] Loading .env from:', envPath);
const envResult = config({ path: envPath });
if (envResult.error) {
  console.warn('[dbWriter] Warning loading .env:', envResult.error.message);
}

// Import Prisma types and client using a simple relative path
// We'll use the generated Prisma client from the project root
type Granularity = 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set. Please check your .env file.');
}

// Clean and validate DATABASE_URL format
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

// Dynamically import Prisma client to avoid ES module issues
// Use file:// URL with absolute path for reliable resolution
interface PrismaClientType {
  analytics: {
    upsert: (args: {
      where: { domainId_bucket_granularity_path: { domainId: string; bucket: Date; granularity: Granularity; path: string } };
      update: { count: { increment: number } };
      create: { domainId: string; bucket: Date; granularity: Granularity; path: string; count: number };
    }) => Promise<unknown>;
  };
  $disconnect: () => Promise<void>;
}

let prisma: PrismaClientType | null = null;

async function initializePrisma(): Promise<PrismaClientType> {
  if (prisma) return prisma;
  
  try {
    // Try importing from generated Prisma client
    const prismaPath = resolve(projectRoot, 'generated/prisma/client.js');
    const prismaUrl = `file://${prismaPath}`;
    const PrismaModule = await import(prismaUrl) as { PrismaClient: new (args: { adapter: PrismaPg }) => PrismaClientType };
    const PrismaClient = PrismaModule.PrismaClient;
    prisma = new PrismaClient({ adapter });
    return prisma;
  } catch (error) {
    // Fallback: try using @prisma/client package
    try {
      const PrismaModule = await import('@prisma/client') as unknown as { PrismaClient: new (args: { adapter: PrismaPg }) => PrismaClientType };
      const PrismaClient = PrismaModule.PrismaClient;
      prisma = new PrismaClient({ adapter });
      return prisma;
    } catch (fallbackError) {
      console.error('[dbWriter] Failed to import Prisma client:', error);
      console.error('[dbWriter] Fallback also failed:', fallbackError);
      throw new Error('Could not initialize Prisma client. Make sure to run: npx prisma generate');
    }
  }
}

// Initialize Prisma on module load
const prismaPromise = initializePrisma();

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('[dbWriter] Disconnecting Prisma client...');
  const client = await prismaPromise;
  await client.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[dbWriter] Disconnecting Prisma client...');
  const client = await prismaPromise;
  await client.$disconnect();
  process.exit(0);
});

// Convert lowercase granularity strings to uppercase enum values
function toGranularityEnum(granularity: "minute" | "hour"): Granularity {
  return granularity.toUpperCase() as Granularity;
}

// Batch size for parallel upserts to avoid overwhelming the DB connection pool
const BATCH_SIZE = 20;

export async function flushToDb(updates: AggregateUpdate[]): Promise<void> {
  if (updates.length === 0) {
    return;
  }

  try {
    const client = await prismaPromise;
    
    // Process updates in parallel batches for better performance
    // This reduces N sequential round-trips to ceil(N/BATCH_SIZE) parallel batches
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map((u) =>
          client.analytics.upsert({
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
          })
        )
      );
    }
  } catch (error) {
    console.error('[dbWriter] Error flushing to database:', error);
    throw error;
  }
}
