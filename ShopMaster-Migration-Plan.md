# ShopMaster — Migration Plan
### From local-only Expo app → client-server app (MySQL + Express + JWT)

## 0. Correcting the starting assumption

The brief describes converting a Replit **web app** into React Native + Expo. That's not what's in the zip. `artifacts/mobile/` is **already** a real Expo Router + TypeScript mobile app — polished screens, real business logic, no WebView. What's actually missing is a **backend**: today all data lives in `AsyncStorage` on the device, and login is a hardcoded `admin`/`admin123` string comparison. So this plan is scoped as: *keep the mobile app, replace its storage layer with a real MySQL-backed API*, not a platform port.

Styling is currently plain `StyleSheet` + a `colors.ts` token file, not NativeWind — noted below as an optional swap, not a requirement for functionality.

## 1. Existing inventory (what's real today)

| Area | Status |
|---|---|
| Mobile app (`artifacts/mobile`) | Real. Expo SDK 54, Expo Router, RN 0.81, React 19, React Query already a dependency (unused so far) |
| Screens | Login, Dashboard, Products (CRUD), Billing/POS, Customers, Inventory + stock log, Sales history, Invoice detail (PDF via `expo-print`), Reports (charts, CSV export), Settings |
| Data model | Defined in `constants/types.ts`: `Product`, `Category`, `Customer`, `Sale`/`SaleItem`, `InventoryLog`, `ShopSettings` — all client-side only |
| Business logic | Real, in `context/AppContext.tsx` (447 lines): invoice numbering, discount (%/₹) + GST calc, stock deduction on sale, low-stock detection, movement logging. This logic needs to move server-side. |
| Auth | `context/AuthContext.tsx` — hardcoded default credentials, plaintext comparison, stored in AsyncStorage. No JWT, no hashing, no server. |
| Backend (`artifacts/api-server`) | Empty Express+TS scaffold — only a `/health` route exists. No auth, no product/sales endpoints. |
| Database (`lib/db`) | Drizzle configured for **PostgreSQL** (`pg`, `dialect: "postgresql"`), schema file is empty (template comments only). Needs to be re-pointed to MySQL and actually modeled. |
| API contract tooling (`lib/api-spec`, `lib/api-zod`, `lib/api-client-react`) | OpenAPI + orval codegen scaffold, currently empty — can generate a typed client once real endpoints exist, or can be skipped in favor of hand-written fetch hooks. |
| `artifacts/mockup-sandbox` | Unrelated Vite/Radix web sandbox for design mockups — not part of the shipped app, ignore. |

## 2. What gets reused vs. rewritten

**Reused as-is:** screen components, navigation structure, PDF invoice generation, CSV export, chart components, design tokens, form validation UX. This is the majority of the ~3,750 lines of screen code.

**Rewritten:**
- `AppContext.tsx` — replace direct AsyncStorage reads/writes with React Query hooks calling the new API. Business logic (invoice numbering, stock math, totals) moves to the Express backend so it can't be bypassed or duplicated inconsistently across devices.
- `AuthContext.tsx` — replace with JWT-based flow: login hits `POST /api/auth/login`, token stored via `expo-secure-store` (not AsyncStorage, since it needs to be more protected), attached to all requests, refresh/expiry handling added.
- `lib/db/src/schema` — model real tables from `constants/types.ts` (see §4).
- `artifacts/api-server` — build out real routes/controllers/services (see §5).

**Net new:** users/roles table + hashing (bcrypt), request validation (Zod), auth middleware, centralized API client with error/timeout handling on the mobile side.

## 3. Scope decisions to confirm before coding

- **Single shop, multi-device sync** is the implied use case (server becomes source of truth) — confirm that's the goal vs. just wanting local data backed up.
- **User roles**: current app has one implicit admin user. Do you want multi-user/role support (e.g. cashier vs. owner) or just replace the single hardcoded login with a real hashed one?
- **NativeWind**: purely cosmetic re-skin of existing `StyleSheet` components — worth doing, but independent of the backend work and can be sequenced later without blocking functionality.
- **Offline behavior**: since billing/POS may be used with spotty connectivity in a shop, decide now whether v1 requires network for every action or should queue sales offline and sync later (bigger scope — recommend deferring to a v2).

## 4. MySQL schema (Drizzle) — derived from actual data model

Tables, mapped directly from `constants/types.ts` plus what's needed for auth and referential integrity:

- `users` (id, username, password_hash, role, created_at)
- `categories` (id, name)
- `products` (id, name, category_id → categories, barcode, purchase_price, selling_price, stock, unit, created_at, updated_at)
- `customers` (id, name, phone, email, created_at)
- `sales` (id, invoice_number, customer_id → customers nullable, subtotal, discount, discount_type, gst, gst_percent, grand_total, payment_method, created_at)
- `sale_items` (id, sale_id → sales, product_id → products, product_name, unit, quantity, unit_price, total) — snapshot fields (`product_name`, `unit_price`) kept so historical invoices don't change if a product is later edited
- `inventory_logs` (id, product_id → products, product_name, type [in/out/adjustment], quantity, previous_stock, new_stock, note, created_at)
- `shop_settings` (single row: name, address, phone, email, gst_number, currency, gst_enabled, gst_percent, low_stock_threshold)

Sale creation and stock deduction happen inside one DB transaction (create sale + sale_items, decrement product stock, write inventory_log) so a failure can't leave stock and sales history inconsistent.

## 5. Backend structure (`artifacts/api-server`)

```
src/
  routes/       auth, products, categories, customers, sales, inventory, reports, settings
  controllers/  request handling per route
  services/     business logic (invoice numbering, totals/GST calc, stock transactions)
  middleware/   jwt auth, role check, error handler, zod validation
  db/           drizzle client, re-exports from lib/db
```

Key endpoints (REST, JWT-protected except `/auth/login`):
`POST /auth/login`, `GET/POST/PUT/DELETE /products`, `GET/POST /categories`, `GET/POST/PUT/DELETE /customers`, `GET/POST /sales`, `GET /sales/:id`, `GET/POST /inventory/logs`, `GET /reports/sales`, `GET /reports/inventory`, `GET/PUT /settings`.

## 6. Mobile-side changes

- New `lib/api-client.ts`: base URL from env config, attaches JWT, centralizes timeout/error handling.
- `AppContext.tsx` → React Query hooks (`useProducts`, `useSales`, etc.) replacing AsyncStorage reads; mutations invalidate relevant queries.
- `AuthContext.tsx` → real login/logout against `/auth/login`, token in `expo-secure-store`.
- Screens themselves need minimal changes — they consume context/hooks, not storage directly, so the rewrite is mostly contained to `context/`.

## 7. Sequencing

1. MySQL schema in `lib/db` + drizzle-kit push
2. Auth: users table, bcrypt, JWT issuance, middleware
3. Products + categories endpoints → wire Products screen
4. Sales/billing endpoint (transactional) → wire Billing screen
5. Customers, inventory logs, settings endpoints → wire remaining screens
6. Reports endpoints (aggregation queries) → wire Reports screen
7. Mobile API client hardening: offline/error/timeout states
8. (Optional, independent) NativeWind re-skin
9. EAS build config for Android APK / iOS testing build

## 8. What I can't do in this chat environment

This container has no network access — I can write/edit all the files above, but can't `pnpm install`, spin up MySQL, or run Expo/Metro to test. For the actual build-and-run loop, Claude Code (which has network + can run a local dev environment) is the better tool.

## 9. Implementation status — done in this pass

All of §4–6 above has been implemented as real files in this zip (not stubs):

**Database (`lib/db`)** — MySQL schema for `users`, `categories`, `products`, `customers`, `sales`, `sale_items`, `inventory_logs`, `shop_settings`, `invoice_counter`. `drizzle.config.ts` switched from Postgres to MySQL.

**Backend (`artifacts/api-server`)** — full Express app: JWT auth (`bcryptjs` + `jsonwebtoken`), Zod-validated routes/controllers/services for auth, products, categories, customers, sales, inventory, settings, and reports. Sale creation and stock deduction run in a single DB transaction (`sale.service.ts`), same as inventory adjustments. A `seed:admin` script creates/resets the login (there's no self-registration, matching the original single-admin app). Centralized error handler returns clean JSON, never a stack trace.

**Mobile (`artifacts/mobile`)** — new `lib/apiClient.ts` (JWT attach, timeout, typed errors, 401 → auto-logout hook), `expo-secure-store` for the token. `AuthContext.tsx` and `AppContext.tsx` were rewritten to call the API instead of `AsyncStorage`, but **keep the exact same exported function signatures** (`addProduct`, `completeSale`, `adjustStock`, etc.), so none of the screen components needed to change — they still call `useApp()`/`useAuth()` the same way.

### To run it yourself

1. `cd lib/db && cp ../../artifacts/api-server/.env.example .env` (or export `DATABASE_URL` directly) → `pnpm install` → `pnpm run push` to create the MySQL tables.
2. `cd artifacts/api-server && cp .env.example .env`, fill in `DATABASE_URL` and a real `JWT_SECRET` → `pnpm install` → `pnpm run seed:admin -- admin yourpassword` → `pnpm run dev`.
3. `cd artifacts/mobile && cp .env.example .env`, set `EXPO_PUBLIC_API_URL` to your machine's LAN IP (not `localhost` if testing on a physical device) → `pnpm install` → `npx expo start`.

### Not yet done (next steps, not attempted here)
- NativeWind re-skin (cosmetic, independent of the above)
- Offline/queued billing
- Multi-user role UI (backend supports `admin`/`cashier` roles; no screen to manage users yet)
- EAS build profiles for APK/AAB
