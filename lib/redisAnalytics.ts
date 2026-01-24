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

// Optimized: Use MGET to batch fetch all keys at once
export async function getLastNMinutesViews(
  domainId: string,
  minutes: number
): Promise<number> {
  const now = new Date();
  const keys: string[] = [];

  for (let i = 0; i < minutes; i++) {
    const d = new Date(now.getTime() - i * 60 * 1000);
    const bucket = toMinuteBucket(d);
    keys.push(domainMinuteKey(domainId, bucket));
  }

  // Batch fetch all values at once
  const values = await redis.mget(...keys);
  return values.reduce((total, val) => total + Number(val || 0), 0);
}

// Optimized: Use pipeline to batch SCAN + MGET operations
export async function getTopPagesLastNMinutes(domainId: string, minutes: number) {
  const now = new Date();
  const pageCounts: Record<string, number> = {};
  
  // Generate all bucket patterns we need to search
  const bucketPatterns: string[] = [];
  for (let i = 0; i < minutes; i++) {
    const d = new Date(now.getTime() - i * 60 * 1000);
    const bucket = toMinuteBucket(d);
    bucketPatterns.push(`analytics:domain:${domainId}:path:*:minute:${bucket}`);
  }

  // Use pipeline to batch all KEYS operations
  const pipeline = redis.pipeline();
  for (const pattern of bucketPatterns) {
    pipeline.keys(pattern);
  }
  const keysResults = await pipeline.exec();
  
  // Collect all keys found
  const allKeys: string[] = [];
  if (keysResults) {
    for (const [err, keys] of keysResults) {
      if (!err && Array.isArray(keys)) {
        allKeys.push(...keys);
      }
    }
  }

  if (allKeys.length === 0) {
    return [];
  }

  // Batch fetch all values at once with MGET
  const values = await redis.mget(...allKeys);
  
  // Aggregate counts by path
  for (let i = 0; i < allKeys.length; i++) {
    const key = allKeys[i];
    const count = Number(values[i] || 0);
    const encoded = key.split(":")[4];
    const path = decodePath(encoded);
    pageCounts[path] = (pageCounts[path] || 0) + count;
  }

  return Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1]);
}

// Optimized: Use MGET to batch fetch all keys at once
export async function getLastNHoursViews(domainId: string, hours: number) {
  const now = new Date();
  const keys: string[] = [];

  for (let i = 0; i < hours; i++) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    const bucket = toHourBucket(d);
    keys.push(domainHourKey(domainId, bucket));
  }

  // Batch fetch all values at once
  const values = await redis.mget(...keys);
  return values.reduce((total, val) => total + Number(val || 0), 0);
}

// Optimized: Use pipeline to batch SCAN + MGET operations
export async function getTopPagesLastNHours(domainId: string, hours: number) {
  const now = new Date();
  const pageCounts: Record<string, number> = {};

  // Generate all bucket patterns we need to search
  const bucketPatterns: string[] = [];
  for (let i = 0; i < hours; i++) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    const bucket = toHourBucket(d);
    bucketPatterns.push(`analytics:domain:${domainId}:path:*:hour:${bucket}`);
  }

  // Use pipeline to batch all KEYS operations
  const pipeline = redis.pipeline();
  for (const pattern of bucketPatterns) {
    pipeline.keys(pattern);
  }
  const keysResults = await pipeline.exec();
  
  // Collect all keys found
  const allKeys: string[] = [];
  if (keysResults) {
    for (const [err, keys] of keysResults) {
      if (!err && Array.isArray(keys)) {
        allKeys.push(...keys);
      }
    }
  }

  if (allKeys.length === 0) {
    return [];
  }

  // Batch fetch all values at once with MGET
  const values = await redis.mget(...allKeys);
  
  // Aggregate counts by path
  for (let i = 0; i < allKeys.length; i++) {
    const key = allKeys[i];
    const count = Number(values[i] || 0);
    const encoded = key.split(":")[4];
    const path = decodePath(encoded);
    pageCounts[path] = (pageCounts[path] || 0) + count;
  }

  return Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1]);
}

// Optimized: Use MGET to batch fetch all keys at once
export async function getMinuteSeries(
  domainId: string,
  minutes: number,
  path?: string
) {
  const now = new Date();
  const keys: string[] = [];
  const buckets: string[] = [];

  // Pre-generate all keys
  for (let i = minutes - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 1000);
    const bucket = toMinuteBucket(d);
    buckets.push(bucket);
    keys.push(path ? pathMinuteKey(domainId, path, bucket) : domainMinuteKey(domainId, bucket));
  }

  // Batch fetch all values at once
  const values = await redis.mget(...keys);

  // Build series from results
  return buckets.map((bucket, i) => ({
    bucket: new Date(bucket),
    count: Number(values[i] || 0),
  }));
}

// Optimized: Use MGET to batch fetch all keys at once
export async function getHourSeries(
  domainId: string,
  hours: number,
  path?: string
) {
  const now = new Date();
  const keys: string[] = [];
  const buckets: string[] = [];

  // Pre-generate all keys
  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    const bucket = toHourBucket(d);
    buckets.push(bucket);
    keys.push(path ? pathHourKey(domainId, path, bucket) : domainHourKey(domainId, bucket));
  }

  // Batch fetch all values at once
  const values = await redis.mget(...keys);

  // Build series from results
  return buckets.map((bucket, i) => ({
    bucket: new Date(bucket),
    count: Number(values[i] || 0),
  }));
}

