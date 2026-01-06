// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/getServerAuth";
import prisma from "@/lib/prisma";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";

export default async function DashboardPage() {
  const session = await getServerAuthSession();

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  const domains = await prisma.domain.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AnalyticsDashboard
      initialDomains={domains}
      userEmail={session.user.email}
      userName={session.user.name}
      userImage={session.user.image}
    />
  );
}
