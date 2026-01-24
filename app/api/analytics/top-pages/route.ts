import { NextResponse } from "next/server";
import { requireDomainAccess } from "@/lib/requireDomainAccess";
import { 
  getTopPagesLastNHours,
  getTopPagesLastNMinutes
} from "@/lib/redisAnalytics";

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

  let pagesData: [string, number][];

  if (range === "30m") {
    pagesData = await getTopPagesLastNMinutes(domainId, 30);
  } else if (range === "24h") {
    pagesData = await getTopPagesLastNHours(domainId, 24);
  } else {
    pagesData = await getTopPagesLastNHours(domainId, 24 * 7);
  }

  // Transform tuple array to object array for frontend compatibility
  const pages = pagesData.slice(0, limit).map(([path, count]) => ({
    path,
    count,
  }));

  return NextResponse.json({ pages });
}
