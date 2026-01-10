# Realtime Analytics Dashboard

A modern, real-time web analytics platform that tracks page views, provides detailed insights, and offers a beautiful dashboard for monitoring website performance. Built with Next.js, TypeScript, and a scalable event-driven architecture.

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
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Data visualization library
- **React Icons** - Icon library
- **Lucide React** - Additional icons

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **NextAuth.js** - Authentication solution
- **Prisma ORM** - Database toolkit
- **Zod** - Schema validation

### Infrastructure
- **PostgreSQL** - Primary database
- **Redis** - Caching layer
- **Kafka (Redpanda)** - Message queue for event streaming
- **Docker** - Containerization for services

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm
- **Docker** and Docker Compose (for Kafka and Redis)
- **PostgreSQL** database (local or remote)
- **Git**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd realtime-analytics-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/analytics_db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (Optional - for Google/GitHub sign-in)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Kafka
KAFKA_BROKER="localhost:9002"

# Redis
REDIS_URL="redis://localhost:6379"

# Analytics URL (for tracking script)
NEXT_PUBLIC_ANALYTICS_URL="http://localhost:3000"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Start Docker Services

Start Kafka (Redpanda) and Redis using Docker Compose:

```bash
docker-compose up -d
```

Verify services are running:
```bash
docker ps
```

### 5. Set Up Database

Run Prisma migrations to create database tables:

```bash
npx prisma migrate dev
```

Generate Prisma client:
```bash
npx prisma generate
```

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Start the Event Processor

In a separate terminal, start the event processor service:

```bash
cd apps/processor
npm install
npm run dev
```

The processor consumes events from Kafka and writes aggregated data to PostgreSQL.

## 📁 Project Structure

For a detailed project structure, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md).

```
realtime-analytics-dashboard/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Dashboard page
├── apps/processor/        # Event processor service
├── components/            # React components
├── lib/                   # Utility functions
├── prisma/                # Database schema & migrations
└── public/                # Static assets (tracker.js)
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Domains
- `GET /api/domains` - Get user's domains
- `POST /api/domains` - Add new domain
- `DELETE /api/domains/[id]` - Delete domain
- `PATCH /api/domains/[id]` - Toggle domain status

### Analytics
- `POST /api/events` - Receive page view events (used by tracker.js)
- `GET /api/analytics/overview` - Get overview statistics
- `GET /api/analytics/top-pages` - Get top pages
- `GET /api/analytics/timeseries` - Get time-series data
- `GET /api/analytics/kpis` - Get key performance indicators

## 📊 How It Works

### Data Flow

```
User's Website
    ↓ (tracker.js embedded)
/api/events (Next.js API)
    ↓ (Kafka/Redpanda)
Event Processor
    ↓ (Aggregation)
PostgreSQL + Redis
    ↓
Dashboard UI
```

### Tracking Script Integration

1. Sign up and add your domain in the dashboard
2. Copy the tracking script from the dashboard
3. Paste it in your website's `<head>` or before `</body>`
4. The script automatically tracks page views and sends them to the analytics server

Example:
```html
<script src="https://your-analytics-domain.com/tracker.js" async></script>
```

## 🔐 Authentication

The application supports three authentication methods:

1. **Email/Password**: Traditional credentials-based signup and signin
2. **Google OAuth**: Sign in with Google account
3. **GitHub OAuth**: Sign in with GitHub account

**Account Linking**: If you sign up with email/password and later sign in with Google/GitHub using the same email, your accounts will be automatically linked.

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma migrate dev # Create and apply migrations
npx prisma generate  # Generate Prisma client
```

### Running the Event Processor

The event processor must run separately:

```bash
cd apps/processor
npm run dev
```

### Debugging

See [DEBUGGING.md](./DEBUGGING.md) for detailed debugging instructions.

## 🚢 Deployment

### Environment Variables for Production

Update your production `.env` with:
- Production database URL
- Production NextAuth URL
- OAuth provider credentials
- Production Kafka broker URL
- Production Redis URL

### Build for Production

```bash
npm run build
npm run start
```

### Docker Services

Ensure Kafka and Redis are running in production. You can use managed services like:
- **Kafka**: AWS MSK, Confluent Cloud, or self-hosted
- **Redis**: AWS ElastiCache, Redis Cloud, or self-hosted
- **PostgreSQL**: AWS RDS, Supabase, or self-hosted

## 📝 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes | - |
| `NEXTAUTH_SECRET` | Secret for JWT encryption | ✅ Yes | - |
| `NEXTAUTH_URL` | Base URL of your application | ✅ Yes | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ❌ No | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ❌ No | - |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | ❌ No | - |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | ❌ No | - |
| `KAFKA_BROKER` | Kafka broker address | ❌ No | `localhost:9002` |
| `REDIS_URL` | Redis connection URL | ❌ No | `redis://localhost:6379` |
| `NEXT_PUBLIC_ANALYTICS_URL` | Public URL for tracking script | ❌ No | - |

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify `DATABASE_URL` is correct
   - Ensure PostgreSQL is running
   - Check database credentials

2. **Kafka Connection Error**
   - Ensure Docker services are running: `docker-compose up -d`
   - Check `KAFKA_BROKER` environment variable

3. **Events Not Appearing**
   - Verify event processor is running
   - Check Kafka topics: `docker exec -it redpanda rpk topic list`
   - Review processor logs

4. **OAuth Not Working**
   - Verify OAuth credentials in `.env`
   - Check callback URLs in OAuth provider settings
   - Ensure `NEXTAUTH_URL` matches your domain

## 📚 Additional Documentation

- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Detailed project structure
- [DEBUGGING.md](./DEBUGGING.md) - Debugging guide

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Authentication by [NextAuth.js](https://next-auth.js.org)
- Database management with [Prisma](https://www.prisma.io)
- Icons from [React Icons](https://react-icons.github.io/react-icons/)

---

**Need Help?** Check the [DEBUGGING.md](./DEBUGGING.md) guide or open an issue.
