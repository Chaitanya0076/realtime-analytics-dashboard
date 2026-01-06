import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/getServerAuth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const domains = await prisma.domain.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
    },
  });

  const analytics = await prisma.analytics.groupBy({
    by: ["domainId"],
    _sum: { count: true },
    where: {
      domainId: { in: domains.map(d => d.id) },
      path: "", // empty string represents domain-level aggregates
    },
  });

  const domainViews = analytics.map(a => {
    const domain = domains.find(d => d.id === a.domainId)!;
    return {
      domain: domain.name,
      views: a._sum.count ?? 0,
    };
  });

  const totalViews = domainViews.reduce(
    (sum, d) => sum + d.views,
    0
  );

  return NextResponse.json({
    totalViews,
    domains: domainViews,
  });
}
