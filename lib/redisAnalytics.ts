import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

function domainMinuteKey(domainId: string, bucket: string) {
  return `analytics:domain:${domainId}:minute:${bucket}`;
}

export async function getLastNMinutesViews(
  domainId: string,
  minutes: number
): Promise<number> {
  const now = new Date();
  let total = 0;

  for (let i = 0; i < minutes; i++) {
    const d = new Date(now);
    d.setMinutes(d.getMinutes() - i);
    d.setSeconds(0, 0);

    const key = domainMinuteKey(domainId, d.toISOString());
    const val = await redis.get(key);
    total += Number(val || 0);
  }

  return total;
}
