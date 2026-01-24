import { NextResponse } from "next/server";
import { requireDomainAccess } from "@/lib/requireDomainAccess";
import prisma from "@/lib/prisma";
import { getLastNHoursViews, getLastNMinutesViews } from "@/lib/redisAnalytics";

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
  // Redis (last 24 hours)
  const last24Hours = await getLastNHoursViews(domainId, 24);
  // Redis (last 7 days)
  const last7Days = await getLastNHoursViews(domainId, 24 * 7);

  const totalViews = await prisma.analytics.aggregate({
      _sum: { count: true },
      where: {
        domainId,
        granularity: "HOUR", // Use HOUR granularity to avoid double counting with MINUTE
        path: "", // empty string represents domain-level aggregates
      },
    });

  return NextResponse.json({
    totalViews: totalViews._sum.count ?? 0,
    last30Min,
    last24Hours,
    last7Days,
  });
}
