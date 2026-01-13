import Redis from 'ioredis';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get directory for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine if we're in development or production (compiled)
const isCompiled = __dirname.includes('dist');
const projectRoot = isCompiled 
  ? resolve(__dirname, '../../..')  // dist -> processor -> apps -> root
  : resolve(__dirname, '../../../..'); // src -> processor -> apps -> root

// Load .env from project root
config({ path: resolve(projectRoot, '.env') });

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

export function domainMinuteKey(domainId: string, bucket: string): string {
    return `analytics:domain:${domainId}:minute:${bucket}`;
}

export function domainHourKey(domainId: string, bucket: string): string {
    return `analytics:domain:${domainId}:hour:${bucket}`;
}

export function pathMinuteKey(domainId: string, path: string, bucket: string): string {
    return `analytics:domain:${domainId}:path:${path}:minute:${bucket}`;
}

export function pathHourKey(domainId: string, path: string, bucket: string): string {
    return `analytics:domain:${domainId}:path:${path}:hour:${bucket}`;
}
