import { getServerAuthSession } from "@/lib/getServerAuth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { domainIdSchema } from "@/lib/validations";

type RouteParams = {
    params: Promise<{ id: string }>;
};

async function getOwnedDomainById(domainId: string, userId: string) {
    const domain = await prisma.domain.findUnique({ where: { id: domainId } });

  if (!domain) {
    return { error: "Domain not found" as const, status: 404, domain: null };
  }

  if (domain.userId !== userId) {
    return { error: "Forbidden", status: 403, domain: null };
  }

  return { error: null, status: 200, domain };
}

export async function DELETE(_req: Request, {params}: RouteParams){
    const session = await getServerAuthSession();

    if(!session?.user){
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    const userId = session.user.id;
    const {id} = await params;

    // Validate domain ID
    const idValidation = domainIdSchema.safeParse(id);
    if (!idValidation.success) {
        return NextResponse.json(
            { error: "Invalid domain ID" },
            { status: 400 }
        );
    }

    try{
        const {error, status, domain} = await getOwnedDomainById(id,userId);

        if(error || !domain){
            return NextResponse.json({error}, {status});
        }

        await prisma.domain.delete({where: {id}});

        return NextResponse.json(
            { message: "Domain deleted successfully"},
            {status: 200}
        );
    }catch(error){
        console.error("Error deleting domain", error);
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        );
    }
}

export async function PATCH(_req: Request, {params}: RouteParams){
    const session = await getServerAuthSession();

    if(!session?.user){
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const {id} = await params;

    // Validate domain ID
    const idValidation = domainIdSchema.safeParse(id);
    if (!idValidation.success) {
        return NextResponse.json(
            { error: "Invalid domain ID" },
            { status: 400 }
        );
    }

    try{
        const {error, status, domain} = await getOwnedDomainById(id, userId);
        if(error || !domain){
            return NextResponse.json({error}, {status});
        }

        const updated = await prisma.domain.update({
            where:{id},
            data:{
                isActive: !domain.isActive, // toggle
            }
        });
        return NextResponse.json({ domain: updated}, {status: 200});
    }catch(error){
        console.error("Error toggling domain", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}