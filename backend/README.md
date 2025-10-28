# Oysloe Backend

Node.js backend for Oysloe marketplace with TypeScript, PostgreSQL, Redis, and Socket.IO.

## Prerequisites

- [Bun](https://bun.sh/) runtime
- [Docker](https://www.docker.com/) and Docker Compose
- Firebase project (for push notifications)
- Arkesel account (for SMS/OTP)

## Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd oysloeupgrade-backend
bun install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` with your configuration:



### 3. Start Database Services

```bash
docker-compose up -d postgres redis
```

### 4. Run Database Migrations

```bash
bun run migration:run
```

### 5. Start Development Server

```bash
bun run dev
```

Server runs on `http://localhost:3000`

## Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run test` - Run test suite
- `bun run migration:generate` - Generate new migration
- `bun run migration:run` - Run pending migrations

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Configure production database and Redis URLs
3. Run `bun run build && bun run start`
