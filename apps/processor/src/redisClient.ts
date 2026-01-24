import Redis from 'ioredis';
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

// Load .env from project root
const envPath = resolve(projectRoot, '.env');
console.log('[redisClient] Loading .env from:', envPath);
config({ path: envPath });

// Initialize Redis client with connection options
// Support both REDIS_URL (connection string) and REDIS_HOST/REDIS_PORT
const redis = process.env.REDIS_URL 
    ? new Redis(process.env.REDIS_URL, {
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
    })
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
    });

// Handle Redis connection events
redis.on('connect', () => {
    console.log('[redisClient] Connected to Redis');
});

redis.on('ready', () => {
    console.log('[redisClient] Redis client ready');
});

redis.on('error', (err) => {
    console.error('[redisClient] Redis error:', err);
});

redis.on('close', () => {
    console.log('[redisClient] Redis connection closed');
});

redis.on('reconnecting', () => {
    console.log('[redisClient] Reconnecting to Redis...');
});

// Graceful shutdown
process.on('SIGINT', () => {
    redis.disconnect();
});

process.on('SIGTERM', () => {
    redis.disconnect();
});

export { redis };

function encodePath(path: string): string {
  return encodeURIComponent(path);
}

export function domainMinuteKey(domainId: string, bucket: string): string {
    return `analytics:domain:${domainId}:minute:${bucket}`;
}

export function domainHourKey(domainId: string, bucket: string): string {
    return `analytics:domain:${domainId}:hour:${bucket}`;
}

export function pathMinuteKey(domainId: string, path: string, bucket: string): string {
    return `analytics:domain:${domainId}:path:${encodePath(path)}:minute:${bucket}`;
}

export function pathHourKey(domainId: string, path: string, bucket: string): string {
    return `analytics:domain:${domainId}:path:${encodePath(path)}:hour:${bucket}`;
}
