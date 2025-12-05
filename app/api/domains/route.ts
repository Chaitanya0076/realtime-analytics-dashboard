import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/getServerAuth";
import prisma from "@/lib/prisma";

const MAX_DOMAINS_PER_USER = 5;

function validateDomainName(name: string) {
    const trimmedName = name.trim().toLowerCase();
    const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/;
    return domainRegex.test(trimmedName);
}

export async function GET(){
    const session = await getServerAuthSession();
    if(!session || !session.user){
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    const userId = session.user.id;

    const domains = await prisma.domain.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({domains}, {status: 200});
}

export async function POST(req: Request) {
    const session = await getServerAuthSession();
    if(!session || !session.user){
        return new Response("Unauthorized", {status: 401});
    }
    const userId = session.user.id;

    try{
        const { name } = await req.json();

        if(!name || typeof name !== "string"){
            return NextResponse.json({error: "Domain name is required"}, {status: 400});
        }

        const normalizedDomainName = name.trim().toLowerCase();
        if(!validateDomainName(normalizedDomainName)){
            return NextResponse.json({error: "Invalid domain name"}, {status: 400});
        }

        const existingDomainsCount = await prisma.domain.count({
            where: { userId },
        });

        if(existingDomainsCount >= MAX_DOMAINS_PER_USER){
            return NextResponse.json({error: `Domain limit of ${MAX_DOMAINS_PER_USER} reached`}, {status: 403});
        }

        const existingDomain = await prisma.domain.findFirst({
            where: {
                userId,
                name: normalizedDomainName,
            },
        });

        if(existingDomain){
            return NextResponse.json({error: "Domain already exists"}, {status: 409});
        }

        const otherUserDomain = await prisma.domain.findUnique({
            where: { name: normalizedDomainName },
        });

        if(otherUserDomain){
            return NextResponse.json({error: "Domain already registered by another user"}, {status: 409});
        }

        const newDomain = await prisma.domain.create({
            data: {
                name: normalizedDomainName,
                userId,
            },
        });

        return NextResponse.json({domain: newDomain}, {status: 201});
    }catch(error){
        console.error("Error adding domain:", error);
        return NextResponse.json({error: "Internal Server Error"}, {status: 500});
    }
}