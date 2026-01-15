import Redis from "ioredis";

// Initialize Redis with better error handling
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false, // Don't queue commands when disconnected
  lazyConnect: false,
});

// Handle Redis connection errors gracefully
redis.on('error', (err) => {
  console.error('[rateLimit] Redis connection error:', err.message);
});

redis.on('connect', () => {
  console.log('[rateLimit] Redis connected');
});

function rateLimitKey(domainId: string, bucket: string) {
  return `ratelimit:domain:${domainId}:minute:${bucket}`;
}

export async function checkRateLimit(
  domainId: string,
  limit: number
): Promise<boolean> {
  try {
    const now = new Date();
    now.setSeconds(0, 0); // minute bucket

    const bucket = now.toISOString();
    const key = rateLimitKey(domainId, bucket);

    const count = await redis.incr(key);

    // set TTL only when first seen
    if (count === 1) {
      await redis.expire(key, 60);
    }

    return count <= limit;
  } catch (error) {
    // If Redis is unavailable, allow the request (fail open)
    // This prevents Redis outages from blocking all events
    console.error('[rateLimit] Redis error, allowing request:', error instanceof Error ? error.message : error);
    return true;
  }
}
