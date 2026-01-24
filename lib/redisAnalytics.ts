import { toHourBucket, toMinuteBucket } from "@/apps/processor/src/buckets";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

function encodePath(path: string) {
  return encodeURIComponent(path);
}

function decodePath(encoded: string) {
  return decodeURIComponent(encoded);
}

function domainMinuteKey(domainId: string, bucket: string) {
  return `analytics:domain:${domainId}:minute:${bucket}`;
}

function domainHourKey(domainId: string, bucket: string) {
  return `analytics:domain:${domainId}:hour:${bucket}`;
}

export function pathMinuteKey(domainId: string, path: string, bucket: string): string {
  return `analytics:domain:${domainId}:path:${encodePath(path)}:minute:${bucket}`;
}

export function pathHourKey(domainId: string, path: string, bucket: string): string {
  return `analytics:domain:${domainId}:path:${encodePath(path)}:hour:${bucket}`;
}

export async function getLastNMinutesViews(
  domainId: string,
  minutes: number
): Promise<number> {
  const now = new Date();
  let total = 0;

  for (let i = 0; i < minutes; i++) {
    const d = new Date(now.getTime() - i * 60 * 1000);
    const bucket = toMinuteBucket(d);

    const key = domainMinuteKey(domainId, bucket);
    const val = await redis.get(key);
    total += Number(val || 0);
  }

  return total;
}

export async function getTopPagesLastNMinutes(domainId: string, minutes: number) {
  const now = new Date();
  const pageCounts: Record<string, number> = {};

  for (let i = 0; i < minutes; i++) {
    const d = new Date(now.getTime() - i * 60 * 1000);
    const bucket = toMinuteBucket(d);

    const keys = await redis.keys(pathMinuteKey(domainId, "*", bucket));

    for (const key of keys) {
      const count = Number(await redis.get(key) || 0);
      const encoded = key.split(":")[4];
      const path = decodePath(encoded);
      pageCounts[path] = (pageCounts[path] || 0) + count;
    }
  }

  return Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1]);
}

export async function getLastNHoursViews(domainId: string, hours: number) {
  const now = new Date();
  let total = 0;

  for (let i = 0; i < hours; i++) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    const bucket = toHourBucket(d);
    const key = domainHourKey(domainId, bucket);
    const val = await redis.get(key);
    total += Number(val || 0);
  }

  return total;
}


export async function getTopPagesLastNHours(domainId: string, hours: number) {
  const now = new Date();
  const pageCounts: Record<string, number> = {};

  for (let i = 0; i < hours; i++) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    const bucket = toHourBucket(d);

    const keys = await redis.keys(pathHourKey(domainId, "*", bucket));

    for (const key of keys) {
      const count = Number(await redis.get(key) || 0);
      const encoded = key.split(":")[4];
      const path = decodePath(encoded);
      pageCounts[path] = (pageCounts[path] || 0) + count;
    }
  }

  return Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
}

export async function getMinuteSeries(
  domainId: string,
  minutes: number,
  path?: string
) {
  const now = new Date();
  const series: { bucket: Date; count: number }[] = [];

  for (let i = minutes - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 1000);
    const bucket = toMinuteBucket(d);

    const key = path
      ? pathMinuteKey(domainId, path, bucket)
      : domainMinuteKey(domainId, bucket);

    const val = await redis.get(key);

    series.push({
      bucket: new Date(bucket),
      count: Number(val || 0),
    });
  }

  return series;
}


export async function getHourSeries(
  domainId: string,
  hours: number,
  path?: string
) {
  const now = new Date();
  const series: { bucket: Date; count: number }[] = [];

  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    const bucket = toHourBucket(d);

    const key = path
      ? pathHourKey(domainId, path, bucket)
      : domainHourKey(domainId, bucket);

    const val = await redis.get(key);

    series.push({
      bucket: new Date(bucket),
      count: Number(val || 0),
    });
  }

  return series;
}

