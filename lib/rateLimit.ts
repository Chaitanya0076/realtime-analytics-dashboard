import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

function rateLimitKey(domainId: string, bucket: string) {
  return `ratelimit:domain:${domainId}:minute:${bucket}`;
}

export async function checkRateLimit(
  domainId: string,
  limit: number
): Promise<boolean> {
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
}
