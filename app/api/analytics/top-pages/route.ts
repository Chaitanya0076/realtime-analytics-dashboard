import { NextResponse } from "next/server";
import { requireDomainAccess } from "@/lib/requireDomainAccess";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");
  const range = searchParams.get("range") || "24h";
  const limit = Number(searchParams.get("limit") || 10);

  if (!domainId) {
    return NextResponse.json(
      { error: "domainId is required" },
      { status: 400 }
    );
  }

  await requireDomainAccess(domainId);

  const now = new Date();
  let from: Date;

  if (range === "30m") {
    from = new Date(now.getTime() - 30 * 60 * 1000);
  } else if (range === "24h") {
    from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else {
    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const rows = await prisma.analytics.findMany({
    where: {
      domainId,
      bucket: { gte: from },
      path: { not: null },
    },
    select: {
      path: true,
      count: true,
    },
  });

  const aggregated = new Map<string, number>();

  for (const row of rows) {
    aggregated.set(
      row.path!,
      (aggregated.get(row.path!) ?? 0) + row.count
    );
  }

  const pages = Array.from(aggregated.entries())
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return NextResponse.json({ pages });
}
