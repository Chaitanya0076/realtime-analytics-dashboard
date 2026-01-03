export type InternalEventV1 = {
    id : string;
    domainId : string;
    type : "path_view";
    path : string;
    url : string;
    referrer?: string;
    title?: string;
    sessionId?: string;
    userId?: string;
    userAgent?: string;
    viewportWidth?: number;
    viewportHeight?: number;
    createdAt: string;
};