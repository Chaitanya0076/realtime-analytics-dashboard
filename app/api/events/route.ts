import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { producer } from "@/lib/kafka";

export const runtime = "nodejs";

type ClientEventPayloadV1 = {
    domain: string;
    path: string;
    url: string;
    referrer?: string;
    title?: string;
    sessionId?: string;
    userId?: string;
    viewportWidth?: number;
    viewportHeight?: number;
}

let producerConnected = false;

async function ensureProducer(){
    if(!producerConnected){
        await producer.connect();
        producerConnected = true;
    }
}

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
    // Final trim to ensure no leading/trailing spaces
    return normalized.trim();
}

function isValidUrl(url: string): boolean {
    try{
        const u = new URL(url);
        return u.protocol === "http:" || u.protocol === "https:";
    }catch {
        return false;
    }
}

export async function POST(req: Request) {
    let payload: ClientEventPayloadV1;
    try{
        payload = await req.json();
    }catch{
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { domain, path, url } = payload;

    if(!domain || typeof domain !== "string" || !path || typeof path !== "string" || !url || typeof url !== "string") {
        return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }

    const normalizedDomain = normalizeDomain(domain);

    if(normalizedDomain.length === 0) {
        return NextResponse.json({ error: 'Invalid domain' }, { status: 400 });
    }

    if(!isValidUrl(url) || url.length > 2048) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // optional field sanity limits
    if(payload.referrer && (typeof payload.referrer !== "string" || payload.referrer.length > 2048)) {
        return NextResponse.json({ error: 'Invalid referrer' }, { status: 400 });
    }

    if(payload.title && (typeof payload.title !== "string" || payload.title.length > 512)) {
        return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
    }

    if(payload.sessionId && (typeof payload.sessionId !== "string" || payload.sessionId.length > 255)) {
        return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
    }

    if(payload.userId && (typeof payload.userId !== "string" || payload.userId.length > 255)) {
        return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    // domain lookup
    const domainRecord = await prisma.domain.findUnique({
        where: { name: normalizedDomain },
    });

    if(!domainRecord || !domainRecord.isActive) {
        // v1: explicit 404; later you can switch to 204 if you don't want to leak domain existence
        return NextResponse.json({ error: 'Domain not found or inactive' }, { status: 404 });
    }

    // server-enriched internal event
    const userAgent = req.headers.get("user-agent") || undefined;
    const now = new Date();

    const internalEvent = {
        id: crypto.randomUUID(),
        domainId: domainRecord.id,
        type:"path_view" as const,
        path,
        url,
        referrer: payload.referrer,
        title: payload.title,
        sessionId: payload.sessionId,
        userId: payload.userId,
        userAgent,
        viewportWidth: payload.viewportWidth,
        viewportHeight: payload.viewportHeight,
        createdAt: now.toISOString(),
        country: undefined as string | undefined, // future use
    };

    try{
        await ensureProducer();
    
        await producer.send({
            topic:"page_views",
            messages:[
                {
                    key: domainRecord.id,
                    value: JSON.stringify(internalEvent),
                }
            ]
        })
    }catch(err){
        console.error("[events] kafka publish error:", err);
        return NextResponse.json({ error: 'Event ingestion failed' }, { status: 500 });
    }

    // respond with 204 No Content
    return new NextResponse(null, { status: 204 });
}