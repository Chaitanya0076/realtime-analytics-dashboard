import { NextResponse } from "next/server";
import { requireDomainAccess } from "@/lib/requireDomainAccess";
import prisma from "@/lib/prisma";
import { getLastNMinutesViews } from "@/lib/redisAnalytics";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");

  if (!domainId) {
    return NextResponse.json(
      { error: "domainId is required" },
      { status: 400 }
    );
  }

  await requireDomainAccess(domainId);

  // Redis (last 30 minutes)
  const last30Min = await getLastNMinutesViews(domainId, 30);

  // DB queries
  const now = new Date();

  const [last24Hours, last7Days, totalViews] = await Promise.all([
    prisma.analytics.aggregate({
      _sum: { count: true },
      where: {
        domainId,
        granularity: "HOUR",
        bucket: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        path: null,
      },
    }),
    prisma.analytics.aggregate({
      _sum: { count: true },
      where: {
        domainId,
        granularity: "HOUR",
        bucket: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        path: null,
      },
    }),
    prisma.analytics.aggregate({
      _sum: { count: true },
      where: {
        domainId,
        path: null,
      },
    }),
  ]);

  return NextResponse.json({
    totalViews: totalViews._sum.count ?? 0,
    last30Min,
    last24Hours: last24Hours._sum.count ?? 0,
    last7Days: last7Days._sum.count ?? 0,
  });
}
