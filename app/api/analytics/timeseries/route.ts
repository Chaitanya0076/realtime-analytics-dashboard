import { NextResponse } from "next/server";
import { requireDomainAccess } from "@/lib/requireDomainAccess";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domainId = searchParams.get("domainId");
  const range = searchParams.get("range") || "30m";

  if (!domainId) {
    return NextResponse.json(
      { error: "domainId is required" },
      { status: 400 }
    );
  }

  await requireDomainAccess(domainId);

  const now = new Date();
  let from: Date;
  let granularity: "MINUTE" | "HOUR";

  if (range === "30m") {
    from = new Date(now.getTime() - 30 * 60 * 1000);
    granularity = "MINUTE";
  } else if (range === "24h") {
    from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    granularity = "HOUR";
  } else {
    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    granularity = "HOUR";
  }

  const rows = await prisma.analytics.findMany({
    where: {
      domainId,
      granularity,
      bucket: { gte: from },
      path: "", // empty string represents domain-level aggregates
    },
    orderBy: { bucket: "asc" },
    select: {
      bucket: true,
      count: true,
    },
  });

  return NextResponse.json({
    granularity,
    points: rows,
  });
}
