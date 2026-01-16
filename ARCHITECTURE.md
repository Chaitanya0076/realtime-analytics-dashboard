# System Architecture

This document describes the architecture of the Realtime Analytics Dashboard, including system design, data flow, and deployment architecture.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Data Flow](#data-flow)
- [Component Details](#component-details)
- [Deployment Architecture](#deployment-architecture)
- [Local Development vs Production](#local-development-vs-production)

---

## Overview

The Realtime Analytics Dashboard is a modern web analytics platform that tracks page views in real-time. It uses an event-driven architecture with Kafka for high-throughput event processing and provides a beautiful dashboard for visualizing analytics data.

### Key Design Principles

1. **Event-Driven Architecture**: Decouples event ingestion from processing
2. **Real-time Processing**: Sub-second latency for analytics updates
3. **Scalability**: Kafka enables horizontal scaling of event processing
4. **Separation of Concerns**: Frontend, API, and processor are independent services

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM ARCHITECTURE                            |
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌────────────────────────┐
                         │     User's Website     │
                         │                        │
                         │  ┌─────────────────┐   │
                         │  │   tracker.js    │   │
                         │  │  (embedded)     │   │
                         │  └────────┬────────┘   │
                         └───────────┼────────────┘
                                     │
                                     │ HTTP POST (page view events)
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                              NEXT.JS APPLICATION                          │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                         API Routes                                 │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐   │   │
│  │  │  /api/events  │  │ /api/domains  │  │  /api/analytics/*     │   │   │
│  │  │  (ingestion)  │  │ (management)  │  │  (data retrieval)     │   │   │
│  │  └───────┬───────┘  └───────────────┘  └───────────────────────┘   │   │
│  └──────────┼─────────────────────────────────────────────────────────┘   │
│             │                                                             │
│  ┌──────────┼──────────────────────────────────────────────────────────┐  │
│  │          │              Frontend (React)                            │  │
│  │          │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │  │
│  │          │  │  Dashboard  │  │   Auth      │  │   Landing       │   │  │
│  │          │  │   Page      │  │   Pages     │  │   Page          │   │  │
│  │          │  └─────────────┘  └─────────────┘  └─────────────────┘   │  |
│  └──────────┼──────────────────────────────────────────────────────────┘  │
└─────────────┼─────────────────────────────────────────────────────────────┘
              │
              │ Produce message
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          KAFKA (REDPANDA)                                   │
│                                                                             │
│   Topic: page_views                                                         │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Partition 0  │  { domainId, path, timestamp, sessionId, ... }       │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
              │
              │ Consume messages
              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                          EVENT PROCESSOR                                   │
│                                                                            │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                    │
│   │   Kafka     │───▶│  Aggregator │───▶│  DB Writer  │                    │
│   │  Consumer   │    │  (in-memory)│    │             │                    │
│   └─────────────┘    └──────┬──────┘    └──────┬──────┘                    │
│                             │                   │                          │
│                             ▼                   ▼                          │
│                      ┌─────────────┐    ┌─────────────┐                    │
│                      │   Redis     │    │ PostgreSQL  │                    │
│                      │  Updater    │    │   Upsert    │                    │
│                      └─────────────┘    └─────────────┘                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
              │                   │
              ▼                   ▼
┌─────────────────────┐   ┌─────────────────────┐
│       REDIS         │   │    POSTGRESQL       │
│  (Real-time Cache)  │   │  (Persistent Store) │
│                     │   │                     │
│  - Last 30 min data │   │  - User accounts    │
│  - Minute buckets   │   │  - Domains          │
│  - Hour buckets     │   │  - Analytics data   │
│                     │   │  - Sessions         │
└─────────────────────┘   └─────────────────────┘
```

---

## Data Flow

### 1. Event Ingestion Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         EVENT INGESTION FLOW                               │
└────────────────────────────────────────────────────────────────────────────┘

  User visits page          tracker.js executes           API receives event
        │                          │                            │
        ▼                          ▼                            ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│   Page Load   │─────────▶│  Collect Data │─────────▶│  /api/events  │
│               │          │  - domain     │          │               │
│               │          │  - path       │          │  Validation:  │
│               │          │  - referrer   │          │  - Zod schema │
│               │          │  - sessionId  │          │  - Domain     │
│               │          │  - viewport   │          │    lookup     │
└───────────────┘          └───────────────┘          └───────┬───────┘
                                                              │
                                                              ▼
                                                      ┌───────────────┐
                                                      │ Kafka Produce │
                                                      │               │
                                                      │ Topic:        │
                                                      │ page_views    │
                                                      └───────────────┘
```

### 2. Event Processing Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        EVENT PROCESSING FLOW                               │
└────────────────────────────────────────────────────────────────────────────┘

  Kafka Consumer              Aggregator                   Storage
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│ Consume from  │─────────▶│  Aggregate    │─────────▶│    Write      │
│ page_views    │          │  in memory    │          │               │
│               │          │               │          │  ┌─────────┐  │
│ Parse JSON    │          │ Group by:     │          │  │  Redis  │  │
│ message       │          │ - domainId    │          │  │ (cache) │  │
│               │          │ - path        │          │  └─────────┘  │
│               │          │ - time bucket │          │               │
│               │          │   (min/hour)  │          │  ┌─────────┐  │
│               │          │               │          │  │Postgres │  │
│               │          │ Flush every   │          │  │(persist)│  │
│               │          │ 5 seconds     │          │  └─────────┘  │
└───────────────┘          └───────────────┘          └───────────────┘
```

### 3. Data Retrieval Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         DATA RETRIEVAL FLOW                                │
└────────────────────────────────────────────────────────────────────────────┘

  Dashboard Request            Data Source              Response
        │                          │                       │
        ▼                          ▼                       ▼
┌───────────────┐          ┌───────────────┐       ┌───────────────┐
│ /api/analytics│          │               │       │               │
│    /kpis      │─────────▶│ Last 30 mins: │──────▶│  Combined     │
│               │          │   Redis       │       │  Response     │
│ /api/analytics│          │               │       │               │
│  /timeseries  │─────────▶│ Older data:   │──────▶│  JSON with    │
│               │          │   PostgreSQL  │       │  aggregated   │
│ /api/analytics│          │               │       │  metrics      │
│  /top-pages   │─────────▶│               │       │               │
└───────────────┘          └───────────────┘       └───────────────┘
```

---

## Component Details

### Next.js Application

| Component | Description |
|-----------|-------------|
| **API Routes** | RESTful endpoints for events, domains, and analytics |
| **Authentication** | NextAuth.js with credentials, Google, and GitHub providers |
| **Dashboard** | React components with Recharts for data visualization |
| **Tracker Script** | Lightweight JavaScript for client-side event collection |

### Event Processor

| Component | Description |
|-----------|-------------|
| **Kafka Consumer** | Consumes events from `page_views` topic |
| **Aggregator** | Groups events by domain, path, and time bucket |
| **Redis Updater** | Updates real-time metrics in Redis |
| **DB Writer** | Upserts aggregated data to PostgreSQL |

### Data Storage

| Store | Purpose | Retention |
|-------|---------|-----------|
| **Redis** | Real-time metrics (last 30 mins) | 24 hours (minute), 30 days (hour) |
| **PostgreSQL** | Persistent analytics data | Indefinite |

---

## Deployment Architecture

### Production Setup (Vercel + EC2)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PRODUCTION DEPLOYMENT ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │              INTERNET               │
                    └──────────────────┬──────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            │                          │                          │
            ▼                          ▼                          ▼
┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
│   User's Browser  │      │  User's Website   │      │   Admin User      │
│                   │      │  (tracker.js)     │      │   (Dashboard)     │
└─────────┬─────────┘      └─────────┬─────────┘      └─────────┬─────────┘
          │                          │                          │
          │                          │                          │
          ▼                          ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL (Edge Network)                          │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        Next.js Application                          │   │
│   │                                                                     │   │
│   │   • Landing Page (SSR)          • Authentication (NextAuth)         │   │
│   │   • Dashboard (CSR)             • API Routes                        │   │
│   │   • Static Assets               • tracker.js (static)               │   │
│   │                                                                     │   │
│   └───────────────────────────────────┬─────────────────────────────────┘   │
│                                       │                                     │
│   Global CDN - Automatic SSL - Auto-scaling - Zero Config Deployments       │
│                                                                             │
└───────────────────────────────────────┼─────────────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │           HTTPS Connections           │
                    └───────────────────┬───────────────────┘
                                        │
          ┌─────────────────────────────┼─────────────────────────────┐
          │                             │                             │
          ▼                             ▼                             ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   AWS EC2       │         │   AWS EC2       │         │    Supabase     │
│   (Kafka)       │         │   (Services)    │         │  (PostgreSQL)   │
│                 │         │                 │         │                 │
│  ┌───────────┐  │         │  ┌───────────┐  │         │  ┌───────────┐  │
│  │ Redpanda  │  │         │  │  Redis    │  │         │  │  Postgres │  │
│  │           │  │         │  │           │  │         │  │           │  │
│  │ Port 9003 │◀─┼─────────┼─▶│ Port 6379 │  │         │  │  Managed  │  │
│  │ (external)│  │         │  │           │  │         │  │  Database │  │
│  └───────────┘  │         │  └───────────┘  │         │  │           │  │
│                 │         │                 │         │  └───────────┘  │
│  ┌───────────┐  │         │  ┌───────────┐  │         │                 │
│  │ Redpanda  │◀─┼─────────┼─▶│ Processor │  │         │  • Automatic    │
│  │ Port 9002 │  │         │  │  (Node)   │  │         │    backups      │
│  │ (internal)│  │         │  │           │  │         │  • Connection   │
│  └───────────┘  │         │  └───────────┘  │         │    pooling      │
│                 │         │                 │         │  • SSL enabled  │
└─────────────────┘         └─────────────────┘         └─────────────────┘

                    ┌───────────────────────────────────────┐
                    │           SECURITY GROUPS             │
                    │                                       │
                    │  Kafka (9003): Vercel IPs only        │
                    │  Redis (6379): Vercel IPs only        │
                    │  Kafka (9002): localhost only         │
                    │  SSH (22): Your IP only               │
                    └───────────────────────────────────────┘
```

### Service Communication

| From | To | Port | Protocol | Purpose |
|------|-----|------|----------|---------|
| Vercel (API) | EC2 Kafka | 9003 | TCP | Event publishing |
| Vercel (API) | EC2 Redis | 6379 | TCP | Real-time data read |
| Vercel (API) | Supabase | 5432 | TCP/SSL | Database queries |
| EC2 Processor | EC2 Kafka | 9002 | TCP | Event consumption |
| EC2 Processor | EC2 Redis | 6379 | TCP | Real-time data write |
| EC2 Processor | Supabase | 5432 | TCP/SSL | Database writes |

---

## Local Development vs Production

### Configuration Differences

| Setting | Local | Production |
|---------|-------|------------|
| **Docker Compose** | `docker-compose.local.yml` | `docker-compose.yml` |
| **Kafka Broker** | `localhost:9092` | `<EC2-IP>:9003` (external) |
| **Redis URL** | `redis://localhost:6379` | `redis://<EC2-IP>:6379` |
| **Database** | Local PostgreSQL or Supabase | Supabase |
| **Next.js** | `npm run dev` | Vercel deployment |
| **Processor** | `npm run dev` | PM2 on EC2 |

### Local Development Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LOCAL DEVELOPMENT SETUP                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           Your Machine                                  │
│                                                                         │
│   Terminal 1                    Terminal 2                              │
│   ┌─────────────────┐          ┌─────────────────┐                      │
│   │  npm run dev    │          │  cd apps/       │                      │
│   │  (Next.js)      │          │  processor      │                      │
│   │  Port 3000      │          │  npm run dev    │                      │
│   └────────┬────────┘          └────────┬────────┘                      │
│            │                            │                               │
│            └──────────┬─────────────────┘                               │
│                       │                                                 │
│                       ▼                                                 │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │                    Docker (docker-compose.local.yml)           │    │
│   │                                                                │    │
│   │   ┌─────────────────┐           ┌─────────────────┐            │    │
│   │   │    Redpanda     │           │      Redis      │            │    │
│   │   │    Port 9092    │           │    Port 6379    │            │    │
│   │   └─────────────────┘           └─────────────────┘            │    │
│   │                                                                │    │
│   └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │               PostgreSQL (Local or Supabase)                    │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Scaling Considerations

### Current Limitations

- Single Kafka partition (can be increased for throughput)
- Single processor instance (can run multiple with consumer groups)
- Redis single instance (can use Redis Cluster for HA)

### Future Scaling Options

1. **Kafka Partitioning**: Partition by domainId for parallel processing
2. **Multiple Processors**: Scale horizontally with Kafka consumer groups
3. **Redis Cluster**: For high availability and throughput
4. **Database Sharding**: Partition analytics data by time range

---

## Security Considerations

### Production Security Checklist

- [ ] Restrict EC2 security groups to Vercel IPs only
- [ ] Enable Redis password authentication
- [ ] Use SSL for all database connections
- [ ] Implement rate limiting on /api/events
- [ ] Set up monitoring and alerting
- [ ] Regular security updates for EC2 instances

---

*Last updated: January 2026*
