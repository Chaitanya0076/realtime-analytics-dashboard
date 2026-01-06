import { InternalEventV1 } from "./types";
import { toMinuteBucket, toHourBucket } from "./buckets";

type AggregateKey = string;

export type AggregateUpdate = {
  domainId: string;
  granularity: "minute" | "hour";
  bucket: Date;
  path: string; // empty string "" for domain-level aggregates
  count: number;
};

const pending = new Map<AggregateKey, AggregateUpdate>();

function key(
  domainId: string,
  granularity: "minute" | "hour",
  bucket: string,
  path: string
) {
  return `${domainId}|${granularity}|${bucket}|${path}`;
}

export function handleEvent(event: InternalEventV1) {
  const ts = new Date(event.createdAt);

  const minute = toMinuteBucket(ts);
  const hour = toHourBucket(ts);

  // Domain-level aggregates (empty string represents domain-level)
  increment(event.domainId, "minute", minute, "");
  increment(event.domainId, "hour", hour, "");

  // Path-specific aggregates
  increment(event.domainId, "minute", minute, event.path);
  increment(event.domainId, "hour", hour, event.path);
}

function increment(
  domainId: string,
  granularity: "minute" | "hour",
  bucketISO: string,
  path: string
) {
  const k = key(domainId, granularity, bucketISO, path);

  const existing = pending.get(k);
  if (existing) {
    existing.count += 1;
  } else {
    pending.set(k, {
      domainId,
      granularity,
      bucket: new Date(bucketISO),
      path,
      count: 1,
    });
  }
}

export function drainAggregates(): AggregateUpdate[] {
  const values = Array.from(pending.values());
  pending.clear();
  return values;
}
