import { getServerAuthSession } from "@/lib/getServerAuth";
import prisma from "@/lib/prisma";

export async function requireDomainAccess(domainId: string) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
  });

  if (!domain) {
    throw new Response("Domain not found", { status: 404 });
  }

  if (domain.userId !== session.user.id) {
    throw new Response("Forbidden", { status: 403 });
  }

  return domain;
}
