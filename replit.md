# ShopMaster — Inventory & Billing

A full-featured mobile POS (Point of Sale) app for local shops built with Expo React Native. Manages products, inventory, billing, customers, sales history, and reports.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo app (mobile workflow)
- Default login: **admin** / **admin123**
- Scan the QR code in the Expo server output to open in Expo Go on a physical device

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54 + Expo Router (file-based routing)
- State: React Context + AsyncStorage (all data persisted locally)
- UI: React Native + @expo/vector-icons (Feather)
- Fonts: Inter (400/500/600/700) via @expo-google-fonts/inter
- PDF: expo-print + expo-sharing
- File: expo-file-system (CSV export)

## Where things live

- `artifacts/mobile/app/` — Expo Router screens
  - `(auth)/login.tsx` — Login screen
  - `(tabs)/index.tsx` — Dashboard
  - `(tabs)/products.tsx` — Product management (CRUD)
  - `(tabs)/billing.tsx` — POS / billing screen
  - `(tabs)/customers.tsx` — Customer management
  - `(tabs)/more.tsx` — Navigation hub (Inventory, Sales, Reports, Settings)
  - `inventory/index.tsx` — Inventory management + logs
  - `sales/index.tsx` — Sales history
  - `sales/[id].tsx` — Invoice detail + PDF generation
  - `reports/index.tsx` — Analytics & reports
  - `settings/index.tsx` — Shop settings + password change
- `artifacts/mobile/context/` — AuthContext, AppContext (all data)
- `artifacts/mobile/constants/` — colors.ts, types.ts, storage.ts
- `artifacts/mobile/components/` — StatCard, SearchBar, EmptyState, Badge, BarChart

## Architecture decisions

- All data stored in AsyncStorage (no backend needed for first build)
- AuthContext checks login state and redirects via Expo Router's Slot/useSegments
- AppContext loads all data on mount, seeds sample data on first run
- Invoice PDF generated client-side using expo-print HTML template
- CSV export via expo-file-system + expo-sharing

## Product

- Login/logout with credential storage
- Dashboard: 6 stat cards + recent sales + low-stock alerts
- Products: full CRUD with category filter, search, barcode, pricing
- Billing/POS: product search, cart, discount (% or ₹), GST, payment method
- Inventory: stock levels with visual bar, low-stock highlighting (red), movement log
- Customers: CRUD with purchase history inline
- Sales History: searchable, filterable by date, links to invoices
- Invoice: professional PDF with shop branding, line items, totals, share/print
- Reports: daily/weekly/monthly/yearly charts, top products, payment breakdown, CSV export
- Settings: shop info, GST toggle, low-stock threshold, password change

## User preferences

- Blue and white POS theme (primary: #2563EB)
- Currency: ₹ (Indian Rupee) by default
- Low stock threshold: 10 units

## Gotchas

- expo-print@15.0.8 creates a temp directory during post-install that Metro watches; if the workflow fails with ENOENT, create the missing directory: `mkdir -p node_modules/.pnpm/expo-print@15.0.8_.../node_modules/expo-print_tmp_XXX/android/src/main/java/expo/modules`
- Packages must match Expo 54 compatibility versions (see `pnpm run dev` warnings)
