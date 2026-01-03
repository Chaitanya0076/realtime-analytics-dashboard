import Redis from 'ioredis';

export const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
});

export function domainMinuteKey(domainId: string, bucket: string){
    return `analytics:domain:${domainId}:minute:${bucket}`;
}

export function domainHourKey(domainId: string, bucket: string){
    return `analytics:domain:${domainId}:hour:${bucket}`;
}

export function pathMinuteKey(domainId: string, path: string, bucket: string){
    return `analytics:domain:${domainId}:path:${path}:minute:${bucket}`;
}

export function pathHourKey(domainId: string, path: string, bucket: string){
    return `analytics:domain:${domainId}:path:${path}:hour:${bucket}`;
}