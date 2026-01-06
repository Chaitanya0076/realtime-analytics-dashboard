import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { producer } from "@/lib/kafka";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const RATE_LIMIT_PER_MINUTE = 1000;

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

// Handle CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
}

export async function POST(req: Request) {
    console.log("[events] Received POST request");
    console.log("[events] Headers:", Object.fromEntries(req.headers.entries()));
    
    let payload: ClientEventPayloadV1;
    try{
        const body = await req.text();
        console.log("[events] Request body:", body);
        payload = JSON.parse(body);
        console.log("[events] Parsed payload:", payload);
    }catch(err){
        console.error("[events] JSON parse error:", err);
        return NextResponse.json({ error: 'Invalid JSON payload' }, { 
            status: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        });
    }

    const { domain, path, url } = payload;

    if(!domain || typeof domain !== "string" || !path || typeof path !== "string" || !url || typeof url !== "string") {
        return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }

    const normalizedDomain = normalizeDomain(domain);
    console.log("[events] Normalized domain:", normalizedDomain, "from:", domain);

    if(normalizedDomain.length === 0) {
        console.error("[events] Invalid domain after normalization");
        return NextResponse.json({ error: 'Invalid domain' }, { 
            status: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        });
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
    console.log("[events] Looking up domain:", normalizedDomain);
    const domainRecord = await prisma.domain.findUnique({
        where: { name: normalizedDomain },
    });

    if(!domainRecord) {
        console.error("[events] Domain not found:", normalizedDomain);
        return NextResponse.json({ error: 'Domain not found or inactive' }, { 
            status: 404,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        });
    }

    if(!domainRecord.isActive) {
        console.error("[events] Domain is inactive:", normalizedDomain);
        return NextResponse.json({ error: 'Domain not found or inactive' }, { 
            status: 404,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        });
    }

    console.log("[events] Domain found:", domainRecord.id, domainRecord.name);

    // domainRecord already fetched and validated
    const allowed = await checkRateLimit(domainRecord.id, RATE_LIMIT_PER_MINUTE);

    if (!allowed) {
    return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
    );
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
        console.log("[events] Ensuring Kafka producer connection...");
        await ensureProducer();
        console.log("[events] Producer connected, sending message to Kafka...");
    
        const result = await producer.send({
            topic:"page_views",
            messages:[
                {
                    key: domainRecord.id,
                    value: JSON.stringify(internalEvent),
                }
            ]
        });
        console.log("[events] Message sent to Kafka successfully:", result);
    }catch(err){
        console.error("[events] Kafka publish error:", err);
        return NextResponse.json({ error: 'Event ingestion failed' }, { 
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        });
    }

    // respond with 204 No Content
    console.log("[events] Event processed successfully, returning 204");
    return new NextResponse(null, { 
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    });
}