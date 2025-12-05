// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/getServerAuth";
import prisma from "@/lib/prisma";
import DomainsSection from "@/app/dashboard/DomainsSection";


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
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">Your domains</h2>
        <p className="text-sm text-gray-500 mb-4">
          Add the domains where you&apos;ll embed the tracking script.
        </p>

        <DomainsSection initialDomains={domains} />
      </section>
    </main>
  );
}
