# Changelog

All architectural deviations from the original OpenAPI contract are documented here.

---

## [1.0.0] — 2026-05-08

### Added
- Full OpenAPI 3.0.3 specification (`openapi.yaml`) covering all 24 endpoints.
- `GET /api/v1/forecast` and `GET /api/v1/forecast/:productId` — demand forecasting via
  simple moving average (not in original blueprint; added to strengthen business logic).
- `GET /api/v1/queue/status` — BullMQ queue observability endpoint (ADMIN only).

### Changed

#### `POST /api/v1/auth/refresh` — now returns `refreshToken` in addition to `accessToken`
**Reason:** Refresh token rotation was added as a security hardening measure. Each call to
`/auth/refresh` now invalidates the previous refresh token and issues a new one. This means
a stolen refresh token becomes useless after one legitimate use. Clients must save the new
`refreshToken` value from every refresh response.

**Before:** `{ accessToken: "..." }`
**After:** `{ accessToken: "...", refreshToken: "..." }`

#### `POST /api/v1/auth/reset-password` — revokes all active sessions on password change
**Reason:** After a successful password reset, all existing refresh tokens for the user are
immediately invalidated via `revokeAllUserTokens()`. This ensures an attacker who had an
active session cannot continue using it after the legitimate user resets their password.

#### Inventory expense and transfer — replaced `$queryRaw` with `updateMany` guard
**Reason:** The original implementation used `SELECT ... FOR UPDATE` raw SQL inside Prisma
transactions to prevent concurrent overselling. This was replaced with an ORM-only approach:
`prisma.stock.updateMany({ where: { quantity: { gte: requested } }, data: { decrement } })`.
Under PostgreSQL's default READ COMMITTED isolation, the `WHERE` clause is evaluated against
the latest committed row value at the moment of the `UPDATE` statement, making this approach
atomically safe against concurrent stock depletion without any raw SQL.
