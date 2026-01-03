import {
  redis,
  domainMinuteKey,
  domainHourKey,
  pathMinuteKey,
  pathHourKey,
} from "./redisClient";
import { InternalEventV1 } from "./types";
import { toMinuteBucket, toHourBucket } from "./buckets";

export async function updateRedis(event: InternalEventV1) {
  const ts = new Date(event.createdAt);
  const minute = toMinuteBucket(ts);
  const hour = toHourBucket(ts);

  const ops = redis.pipeline();

  ops.incr(domainMinuteKey(event.domainId, minute));
  ops.expire(domainMinuteKey(event.domainId, minute), 60 * 60 * 24);

  ops.incr(domainHourKey(event.domainId, hour));
  ops.expire(domainHourKey(event.domainId, hour), 60 * 60 * 24 * 30);

  ops.incr(pathMinuteKey(event.domainId, event.path, minute));
  ops.expire(pathMinuteKey(event.domainId, event.path, minute), 60 * 60 * 24);

  ops.incr(pathHourKey(event.domainId, event.path, hour));
  ops.expire(pathHourKey(event.domainId, event.path, hour), 60 * 60 * 24 * 30);

  await ops.exec();
}
