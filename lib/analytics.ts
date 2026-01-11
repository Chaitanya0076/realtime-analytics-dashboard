import { Granularity } from "../generated/prisma/enums";
import prisma from "./prisma";

export type  TimeSeriesPoint = {
    bucket: Date;
    count: number;
};

export async function getTimeSeriesForDomain(options: {
    domainId: string;
    granularity: Granularity;
    from: Date;
    to: Date;
    path?: string; // when provided, filter by specific path
}): Promise<TimeSeriesPoint[]> {
    const { domainId, granularity, from, to, path } = options;
    
    const rows = await prisma.analytics.findMany({
        where:{
            domainId,
            granularity,
            bucket: {
                gte: from,
                lte: to,
            },
            ...(path ? { path } : {path: ""}), // path-specific or domain-level ("" = domain-level)
        },
        orderBy: {
            bucket: 'asc',
        }
    });

    return rows.map(row => ({
        bucket: row.bucket,
        count: row.count,
    }));
}

export type TopPage = {
    path: string;
    count: number;
};

// top pages over a time range, combining multiple buckets
export async function getTopPagesForDomain(options: {
  domainId: string;
  granularity: Granularity;
  from: Date;
  to: Date;
  limit?: number;
}): Promise<TopPage[]> {
  const { domainId, granularity, from, to, limit = 10 } = options;

  // Prisma doesn't support GROUP BY directly; we can:
  // 1) fetch relevant rows
  // 2) aggregate in JS
  const rows = await prisma.analytics.findMany({
    where: {
      domainId,
      granularity,
      bucket: {
        gte: from,
        lte: to,
      },
      path: {
        not: "", // exclude domain-level aggregates (empty string)
      },
    },
    select: {
      path: true,
      count: true,
    },
  });

  const aggregates = new Map<string, number>();

  for (const row of rows) {
    if (!row.path) continue;
    aggregates.set(row.path, (aggregates.get(row.path) ?? 0) + row.count);
  }

  return Array.from(aggregates.entries())
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// total views for a domain over a time range
export async function getTotalViewsForDomain(options: {
  domainId: string;
  granularity: Granularity;
  from: Date;
  to: Date;
}): Promise<number> {
  const { domainId, granularity, from, to } = options;

  const rows = await prisma.analytics.findMany({
    where: {
      domainId,
      granularity,
      bucket: {
        gte: from,
        lte: to,
      },
      path: "", // domain-level aggregates (empty string)
    },
    select: {
      count: true,
    },
  });

  return rows.reduce((acc, row) => acc + row.count, 0);
}