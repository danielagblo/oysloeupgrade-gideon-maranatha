# Oysloe Backend

Backend for Oysloe marketplace (TypeScript, PostgreSQL, Redis, Socket.IO).

## Prerequisites

- Bun
- Docker + Docker Compose

## Quick start (local dev)

1. Install deps

```bash
bun install
```

2. Configure env

```bash
cp .env.example .env
# Edit .env (DB_HOST/PORT/NAME/USER/PASSWORD, JWT_SECRET, etc.)
```

3. Start Postgres + Redis

```bash
docker-compose up -d postgres redis
```

4. Create database (once) and enable uuid-ossp

```bash
# Use values from your .env (defaults: host=localhost port=5433 user=postgres)
psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE <DB_NAME_FROM_ENV>;"
psql -h localhost -p 5433 -U postgres -d <DB_NAME_FROM_ENV> -f scripts/init-db.sql
```

5. Run migrations

```bash
bun run migration:run
```

6. Start server

```bash
bun run dev
```

7. Verify health

```bash
curl http://localhost:3000/health
# {"status":"ok", ...}
```

Notes

- OpenAPI spec is generated on dev start; docs available at `/docs`.
- If you see “database does not exist”, ensure step 4 used the same `DB_NAME` as in `.env`.
