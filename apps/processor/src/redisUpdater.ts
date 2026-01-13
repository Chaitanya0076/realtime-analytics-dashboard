import {
  redis,
  domainMinuteKey,
  domainHourKey,
  pathMinuteKey,
  pathHourKey,
} from "./redisClient.js";
import { InternalEventV1 } from "./types.js";
import { toMinuteBucket, toHourBucket } from "./buckets.js";

export async function updateRedis(event: InternalEventV1): Promise<void> {
  try {
    const ts = new Date(event.createdAt);
    const minute = toMinuteBucket(ts);
    const hour = toHourBucket(ts);

    const ops = redis.pipeline();

    // Domain-level minute aggregate
    ops.incr(domainMinuteKey(event.domainId, minute));
    ops.expire(domainMinuteKey(event.domainId, minute), 60 * 60 * 24);

    // Domain-level hour aggregate
    ops.incr(domainHourKey(event.domainId, hour));
    ops.expire(domainHourKey(event.domainId, hour), 60 * 60 * 24 * 30);

    // Path-specific minute aggregate
    ops.incr(pathMinuteKey(event.domainId, event.path, minute));
    ops.expire(pathMinuteKey(event.domainId, event.path, minute), 60 * 60 * 24);

    // Path-specific hour aggregate
    ops.incr(pathHourKey(event.domainId, event.path, hour));
    ops.expire(pathHourKey(event.domainId, event.path, hour), 60 * 60 * 24 * 30);

    await ops.exec();
  } catch (error) {
    console.error('[redisUpdater] Error updating Redis:', error);
    throw error;
  }
}
