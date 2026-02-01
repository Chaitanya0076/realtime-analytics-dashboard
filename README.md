# Realtime Analytics Dashboard

A modern, real-time web analytics platform that tracks page views, provides detailed insights, and offers a beautiful dashboard for monitoring website performance. Built with Next.js, TypeScript, and a scalable event-driven architecture.

🔗 **Live Demo**: [analyticspro.devwithease.com](https://analyticspro.devwithease.com)  
📦 **Repository**: [github.com/Chaitanya0076/realtime-analytics-dashboard](https://github.com/Chaitanya0076/realtime-analytics-dashboard)<br/>
▶️ **Video**: [Watch the Video](https://drive.google.com/file/d/17SUNo9_AaJzRj1aj6BPXDRMTarSdfvrb/view?usp=drive_link)

## ✨ Features

- **Real-time Analytics**: Track page views and user interactions in real-time
- **Multiple Authentication Methods**: Sign in with email/password, Google, or GitHub
- **Domain Management**: Add and manage multiple domains (up to 5 per account)
- **Interactive Dashboard**: 
  - Total page views with pie charts
  - Top pages analytics
  - Website-specific page views
  - Time-series data visualization
  - Customizable time intervals (30 mins, 24 hours, 7 days)
- **Tracking Script**: Easy-to-integrate JavaScript tracker for any website
- **Scalable Architecture**: Event-driven system using Kafka for high throughput
- **Input Validation**: Client-side and server-side validation with Zod
- **Responsive Design**: Modern UI built with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Data visualization library
- **Lucide React** - Icons

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **NextAuth.js** - Authentication solution
- **Prisma ORM** - Database toolkit
- **Zod** - Schema validation

### Infrastructure
- **PostgreSQL** - Primary database
- **Redis** - Caching layer for real-time data
- **Kafka (Redpanda)** - Message queue for event streaming
- **Docker** - Containerization for services

---

## 🚀 Local Development Setup

Follow these steps to run the project locally.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **Git**

### Step 1: Clone the Repository

```bash
git clone https://github.com/Chaitanya0076/realtime-analytics-dashboard.git
cd realtime-analytics-dashboard
```

### Step 2: Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database (use local PostgreSQL or a cloud service like Supabase)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/analytics_db"

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (Optional - for Google/GitHub sign-in)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Kafka (Redpanda) - Local development
KAFKA_BROKER="localhost:9092"

# Redis - Local development
REDIS_URL="redis://localhost:6379"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 3: Start Docker Services

Start Kafka (Redpanda) and Redis using the local Docker Compose file:

```bash
docker-compose -f docker-compose.local.yml up -d
```

Verify services are running:
```bash
docker ps
```

You should see `redpanda-local` and `redis-local` containers running.

### Step 4: Install Dependencies

Install dependencies for the main application:

```bash
npm install
```

Install dependencies for the event processor:

```bash
cd apps/processor
npm install
cd ../..
```

### Step 5: Set Up the Database

If you're using a local PostgreSQL database, make sure it's running. Then run Prisma migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

### Step 6: Start the Development Servers

You need to run **two terminals** - one for the Next.js app and one for the event processor.

**Terminal 1 - Start Next.js App:**
```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

**Terminal 2 - Start Event Processor:**
```bash
cd apps/processor
npm run dev
```

The processor will start consuming events from Kafka and writing to the database.

### Step 7: Create the Kafka Topic (First Time Only)

If this is your first time running the app, create the required Kafka topic:

```bash
docker exec -it redpanda-local rpk topic create page_views
```

### Verify Everything is Working

1. Open [http://localhost:3000](http://localhost:3000)
2. Sign up for a new account
3. Add a domain to track
4. Embed the tracking script on your test website
5. Visit your test website and check the dashboard for analytics

---

## 📁 Project Structure

```
realtime-analytics-dashboard/
├── app/                        # Next.js App Router
│   ├── api/                    # API endpoints
│   │   ├── analytics/          # Analytics data endpoints
│   │   ├── auth/               # Authentication endpoints
│   │   ├── domains/            # Domain management
│   │   └── events/             # Event ingestion (tracker.js endpoint)
│   ├── auth/                   # Auth pages (signin/signup)
│   └── dashboard/              # Dashboard page
│
├── apps/processor/             # Event processor service
│   └── src/
│       ├── index.ts            # Kafka consumer entry point
│       ├── aggregator.ts       # Event aggregation logic
│       ├── dbWriter.ts         # PostgreSQL writer
│       └── redisUpdater.ts     # Redis cache updater
│
├── components/dashboard/       # Dashboard UI components
│   ├── AnalyticsDashboard.tsx  # Main dashboard container
│   ├── TopPagesBarChart.tsx    # Top pages visualization
│   ├── TotalPageViewsSection.tsx # Overview with pie chart
│   └── ...
│
├── lib/                        # Shared utilities
│   ├── prisma.ts               # Prisma client
│   ├── kafka.ts                # Kafka producer
│   ├── redisAnalytics.ts       # Redis operations
│   └── auth.ts                 # Auth utilities
│
├── prisma/                     # Database schema & migrations
│   └── schema.prisma           # Prisma schema
│
├── public/
│   └── tracker.js              # Client-side tracking script
│
├── docker-compose.local.yml    # Local development services
├── docker-compose.yml          # Production services (EC2)
└── package.json
```

For a detailed structure, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new user account |
| POST | `/api/auth/[...nextauth]` | NextAuth handlers |

### Domains
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/domains` | Get user's domains |
| POST | `/api/domains` | Add new domain |
| DELETE | `/api/domains/[id]` | Delete domain |
| PATCH | `/api/domains/[id]` | Toggle domain status |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/events` | Receive page view events |
| GET | `/api/analytics/overview` | Get overview statistics |
| GET | `/api/analytics/top-pages` | Get top pages |
| GET | `/api/analytics/timeseries` | Get time-series data |
| GET | `/api/analytics/kpis` | Get KPIs (total views, etc.) |

---

## 📊 How It Works

### Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User's Website │     │   Next.js API   │     │     Kafka       │
│                 │────▶│   /api/events   │────▶│   (Redpanda)    │
│  (tracker.js)   │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Dashboard     │◀────│   PostgreSQL    │◀────│    Processor    │
│      UI         │     │   + Redis       │     │   (Consumer)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Tracking**: `tracker.js` sends page view events to `/api/events`
2. **Ingestion**: API validates and publishes events to Kafka
3. **Processing**: Event processor consumes from Kafka, aggregates data
4. **Storage**: Aggregated data is written to PostgreSQL and cached in Redis
5. **Display**: Dashboard fetches and displays analytics data

### Tracking Script Integration

1. Sign up and add your domain in the dashboard
2. Copy the tracking script from the dashboard
3. Add it to your website's `<head>` or before `</body>`:

```html
<script src="https://your-analytics-domain.com/tracker.js" async></script>
```

---

## 🧪 Available Scripts

### Main Application

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database

```bash
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma migrate dev   # Create and apply migrations
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes (skip migrations)
```

### Docker

```bash
# Local development
docker-compose -f docker-compose.local.yml up -d     # Start services
docker-compose -f docker-compose.local.yml down      # Stop services
docker-compose -f docker-compose.local.yml logs -f   # View logs

# Check Kafka topics
docker exec -it redpanda-local rpk topic list
docker exec -it redpanda-local rpk topic create page_views
```

### Processor

```bash
cd apps/processor
npm run dev          # Start in development mode
npm run build        # Build for production
npm run start        # Start production build
```

---

## 🚢 Deployment

For production deployment architecture and instructions, see [ARCHITECTURE.md](./ARCHITECTURE.md).

### Quick Overview

The production setup uses:
- **Vercel** - Next.js frontend hosting
- **AWS EC2** - Kafka (Redpanda), Redis, and Event Processor
- **Supabase** - PostgreSQL database

---

## 📝 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes | - |
| `NEXTAUTH_SECRET` | Secret for JWT encryption | ✅ Yes | - |
| `NEXTAUTH_URL` | Base URL of your application | ✅ Yes | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ Yes | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ✅ Yes | - |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | ⚠️ Optional* | - |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | ⚠️ Optional* | - |
| `KAFKA_BROKER` | Kafka broker address | ✅ Yes | `localhost:9092` |
| `REDIS_URL` | Redis connection URL | ✅ Yes | `redis://localhost:6379` |

---

## 🐛 Troubleshooting

### Common Issues

1. **Docker services not starting**
   ```bash
   docker-compose -f docker-compose.local.yml down
   docker-compose -f docker-compose.local.yml up -d
   ```

2. **Kafka connection error**
   - Ensure Redpanda container is running: `docker ps`
   - Check if port 9092 is available
   - Verify `KAFKA_BROKER` in `.env`

3. **Database connection error**
   - Verify `DATABASE_URL` is correct
   - Ensure PostgreSQL is running
   - Run `npx prisma migrate dev` to apply migrations

4. **Events not appearing in dashboard**
   - Verify the event processor is running (`cd apps/processor && npm run dev`)
   - Check processor logs for errors
   - Verify Kafka topic exists: `docker exec -it redpanda-local rpk topic list`

5. **Redis connection error**
   - Ensure Redis container is running
   - Verify `REDIS_URL` in `.env`

### Useful Debug Commands

```bash
# Check Kafka topics and messages
docker exec -it redpanda-local rpk topic list
docker exec -it redpanda-local rpk topic consume page_views

# Check Redis
docker exec -it redis-local redis-cli ping
docker exec -it redis-local redis-cli keys "*"

# Check database
npx prisma studio
```

---

## 📚 Additional Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and deployment

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

---

**Need Help?** Open an issue on GitHub or check the troubleshooting section above.
