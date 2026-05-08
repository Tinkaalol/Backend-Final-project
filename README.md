# LeanStock Backend

Inventory management system for coffee equipment, beans, and accessories.
Built with **Express.js**, **Prisma ORM**, **PostgreSQL 15**, and **Redis**.

---

## Quick Start (Docker)

The easiest way to run the project. You only need Docker Desktop installed.

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd leanstock-backend

# 2. Start everything (app + postgres + redis)
docker compose up

# 3. API is now running at:
#    http://localhost:3000/api/v1
#    http://localhost:3000/api/docs  ← Swagger UI
```

That's it. Docker handles the database, Redis, migrations, and the app automatically.

---

## Local Development (without Docker)

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your values
cp .env.example .env

# 3. Run database migrations
npx prisma migrate dev

# 4. Start dev server (auto-restarts on file changes)
npm run dev
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `JWT_SECRET` | ✅ | Min 32 chars random string |
| `JWT_REFRESH_SECRET` | ✅ | Different min 32 chars string |
| `NODE_ENV` | ✅ | `development` / `production` / `test` |
| `DECAY_THRESHOLD_DAYS` | optional | Days before decay starts (default: 30) |
| `DECAY_PERCENT_PER_CYCLE` | optional | Discount per cycle (default: 10) |
| `DECAY_MAX_DISCOUNT` | optional | Max cumulative discount (default: 50) |

> ⚠️ The app **refuses to start** if required variables are missing or invalid.

---

## Running Tests

```bash
# Make sure a test database is running, then:
npm test

# With coverage report:
npm run test:coverage
```

---

## API Documentation

Swagger UI is available at **http://localhost:3000/api/docs** when the server is running.

---

## Key Endpoints

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/v1/auth/login` | No | — | Login, get tokens |
| POST | `/api/v1/auth/refresh` | No | — | Refresh access token |
| POST | `/api/v1/auth/logout` | No | — | Revoke refresh token |
| GET | `/api/v1/auth/me` | ✅ | Any | Current user profile |
| GET | `/api/v1/products` | ✅ | Any | List products (paginated) |
| POST | `/api/v1/products` | ✅ | MANAGER+ | Create product |
| POST | `/api/v1/inventory/income` | ✅ | Any | Receive goods |
| POST | `/api/v1/inventory/expense` | ✅ | Any | Ship/sell goods |
| POST | `/api/v1/inventory/transfer` | ✅ | MANAGER+ | Transfer between locations |
| GET | `/api/v1/inventory/history` | ✅ | Any | Movement history |
| POST | `/api/v1/decay/trigger` | ✅ | ADMIN | Manual decay trigger |

---

## Architecture Decisions

**Why cursor pagination instead of OFFSET?**
Movement history and audit logs grow unboundedly. `OFFSET 1000` scans and discards 1000 rows before returning results. Cursor pagination uses `WHERE id > $cursor LIMIT 20` which uses the index directly — consistent performance regardless of dataset size.

**Why SELECT FOR UPDATE in the expense endpoint?**
Two storekeepers could try to sell the last unit simultaneously. Without a row lock, both transactions would read `quantity = 1`, both would pass the check, and stock would go to -1. `SELECT FOR UPDATE` makes the second transaction wait until the first commits, then it sees `quantity = 0` and correctly rejects.

**Why Redis for rate limiting instead of express-rate-limit's default memory store?**
In-memory counters reset if the process restarts and don't work across multiple server instances. Redis persists the counters independently of the app.

**Why configurable decay rules via env vars?**
The assignment says "configurable decay rules, not hardcoded." `DECAY_THRESHOLD_DAYS`, `DECAY_PERCENT_PER_CYCLE`, and `DECAY_MAX_DISCOUNT` can all be changed without touching the code.
