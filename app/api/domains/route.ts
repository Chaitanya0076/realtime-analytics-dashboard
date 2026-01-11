import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/getServerAuth";
import prisma from "@/lib/prisma";
import { domainSchema } from "@/lib/validations";

const MAX_DOMAINS_PER_USER = 5;

function normalizeDomain(domain: string): string {
    const trimmedDomain = domain.trim().toLowerCase();
    // Remove protocol (http://, https://)
    let normalized = trimmedDomain.replace(/^https?:\/\//, "");
    // Remove www. prefix
    normalized = normalized.replace(/^www\./, "");
    // Remove trailing slashes
    normalized = normalized.replace(/\/+$/, "");
    // Remove any path after domain
    normalized = normalized.split('/')[0];
    // Remove port numbers
    normalized = normalized.split(':')[0];
    // Final trim to ensure no leading/trailing spaces
    return normalized.trim();
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
        const body = await req.json();
        
        // Validate request body with Zod
        const validationResult = domainSchema.safeParse(body);
        
        if (!validationResult.success) {
            const errors = validationResult.error.issues.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));
            
            return NextResponse.json(
                { 
                    error: "Validation failed",
                    details: errors 
                },
                { status: 400 }
            );
        }

        const { name } = validationResult.data;

        // Normalize the domain first (remove https://, www., etc.)
        const normalizedDomainName = normalizeDomain(name);
        
        if(normalizedDomainName.length === 0){
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