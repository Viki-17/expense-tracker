# Expense Tracker — Project Memory

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18.3 |
| Build | Vite | 5.4 |
| Language | TypeScript | 5.6 (strict mode) |
| Styling | Tailwind CSS | 3.4 |
| Native wrapper | Capacitor | 8.4.1 (Android) |
| PWA | vite-plugin-pwa | 0.20.5 |
| Charts | Recharts | 2.12 |
| Local DB | Dexie.js (IndexedDB) | 4.0 + dexie-react-hooks 1.1 |
| Routing | React Router DOM | 6.26 |
| Package manager | npm | — |

## Project Identity

- **Name**: `expense-tracker-pwa` (private)
- **App ID**: `com.expensetracker.app`
- **Description**: Local-first expense tracker with SMS auto-parsing for Indian bank/UPI transactions
- **All data stays on-device** — IndexedDB via Dexie, zero server calls

## Directory Structure

```
/
├── index.html                # Entry HTML, Inter font from Google Fonts
├── vite.config.ts            # Vite + React + PWA plugin
├── capacitor.config.ts       # Capacitor 8 config (appId: com.expensetracker.app)
├── tsconfig.json             # ES2020, bundler mode, strict, isolatedModules
├── tailwind.config.js        # Custom primary/expense/income color scales, Inter font
├── postcss.config.js
├── scripts/
│   ├── generate-icons.mjs    # sharp-based PNG icon generator from SVG
│   └── setup-android.sh      # One-time Android project setup script
├── public/
│   ├── icon.svg / icon-192.png / icon-512.png / favicon.svg
├── android/
│   └── app/src/main/java/com/expensetracker/
│       ├── app/MainActivity.java              # Registers SmsReaderPlugin
│       └── plugins/SmsReaderPlugin.java       # Capacitor plugin: reads SMS inbox
└── src/
    ├── main.tsx              # React entry, BrowserRouter with optional VITE_ROUTER_BASE
    ├── App.tsx               # 6 routes, all wrapped in <Layout>
    ├── index.css             # Tailwind directives, safe-area CSS, slideUp animation
    ├── vite-env.d.ts
    ├── types/index.ts        # Transaction, Category, SMSResult, BudgetSummary, DateRange, SortField
    ├── db/index.ts           # Dexie schema: transactions (++id,type,category,date,amount), categories (++id,name)
    ├── hooks/
    │   ├── useTransactions.ts   # useLiveQuery for range-based + CRUD operations
    │   └── useCategories.ts     # useLiveQuery, CRUD, protects default categories from deletion
    ├── utils/
    │   ├── smsParser.ts         # parseSMS(), parseMultipleSMS() — 295 lines, 12 rule categories, 13 merchants
    │   ├── formatters.ts        # INR currency formatting, date helpers (today, startOfMonth, etc.)
    │   └── platform.ts          # isNativePlatform(), getPlatform() — Capacitor API
    ├── plugins/sms-reader/
    │   ├── definitions.ts       # TypeScript interface: SmsReaderPlugin
    │   ├── index.ts             # registerPlugin('SmsReader') with web fallback
    │   └── web.ts               # WebPlugin fallback (returns empty / denied for web)
    ├── components/
    │   ├── Layout.tsx           # Desktop sidebar (lg:block) + mobile bottom nav + header
    │   ├── Sidebar.tsx          # 6 nav items, fixed 256px left sidebar
    │   ├── BottomNav.tsx        # 5-item mobile bottom tab bar
    │   ├── Dashboard.tsx        # Summary cards, Recharts pie + bar charts, date range picker
    │   ├── TransactionForm.tsx  # Amount/category/description/date, full + compact modes
    │   ├── TransactionList.tsx  # Filterable (all/expense/income), sortable, deletable list
    │   ├── SMSReader.tsx        # Native scan (SmsReader plugin) + manual SMS paste/parse UI
    │   └── Icons.tsx            # SVG icon components (Heroicons-style)
    └── pages/
        ├── Home.tsx             # → <Dashboard />
        ├── Transactions.tsx     # → <TransactionList />
        ├── AddTransaction.tsx   # → <TransactionForm />, navigates to /transactions on submit
        ├── SMSImport.tsx        # → <SmartSMSReader />
        ├── Budgets.tsx          # Per-category monthly budget tracking with progress bars
        └── Settings.tsx         # Export/import JSON, reset data, add custom categories, app info
```

## Routes

| Path | Page Component | Label |
|------|---------------|-------|
| `/` | Home → Dashboard | Dashboard |
| `/transactions` | Transactions → TransactionList | Transactions |
| `/add` | AddTransaction → TransactionForm | Add Transaction |
| `/sms` | SMSImport → SmartSMSReader | SMS Import |
| `/budgets` | Budgets | Budgets |
| `/settings` | Settings | Settings |

BrowserRouter with optional basename via `VITE_ROUTER_BASE` env var (for deployment sub-paths).

## Database (Dexie / IndexedDB)

**DB name**: `ExpenseTrackerDB`, v1

**Tables**:
- `transactions`: `++id, type, category, date, amount` — Stores `Transaction` objects
- `categories`: `++id, name` — Stores `Category` objects, pre-populated with 14 defaults

**Default categories** (14):
Food & Dining, Shopping, Transport, Bills & Utilities, Entertainment, Groceries, Healthcare, Education, Travel, Rent, Investment, Salary, Freelance, Other

**Key DB methods**:
- `getTransactionsInRange(start, end)` — date-range query, reverse sorted
- `getCategoryBreakdown(start, end)` — aggregates by category
- `getDailyTotals(start, end)` — date-bucketed aggregation
- `getTotalByType(type, start?, end?)` — sum by expense/income

## SMS Parser (`smsParser.ts`)

12 bank rule patterns covering:
- Generic debit/credit, UPI payment/credit, card payment, ATM withdrawal
- Merchant-categorized: Food/Restaurant, Grocery, Transport, Entertainment, Shopping, Bills, Salary, EMI/Loan

13 known merchants: Amazon, Flipkart, Zomato, Swiggy, Uber, Ola, Netflix, BigBasket, Blinkit, Zepto, Myntra, JioMart, DMart

Returns `SMSResult` with `confidence` (0–95), amount, type, category, merchant, description, date.

Main export: `parseSMS(message: string) => SMSResult | null`, `parseMultipleSMS(messages: string[]) => SMSResult[]`

## SMSReader Capacitor Plugin (Custom)

**TypeScript side** (`src/plugins/sms-reader/`):
- `SmsReaderPlugin` interface: `checkPermission()`, `requestPermission()`, `getMessages({maxCount?, daysBack?})`
- Registered as `'SmsReader'` with web fallback (`SmsReaderWeb`)
- Web fallback always returns `{granted: false}` / empty messages

**Java/Android side** (`android/.../plugins/SmsReaderPlugin.java`):
- Annotated with `@CapacitorPlugin(name = "SmsReader")`
- Reads SMS inbox via `content://sms/inbox` ContentResolver
- Pre-filters with keyword matching (debited, credited, UPI, NEFT, etc.) before sending to JS
- Requires `READ_SMS` permission
- Will auto-resolve `granted: true` on pre-Marshmallow (API <23)

**MainActivity** manually registers `SmsReaderPlugin.class` before `super.onCreate()`.

### Known Android Issue

The `android/` directory only contains `app/src/main/java/...` source files. It **lacks**:
- Gradle wrapper, `build.gradle`, `settings.gradle`
- `AndroidManifest.xml` (needs `<uses-permission android:name="android.permission.READ_SMS" />`)
- Other standard Capacitor Android project scaffolding

Running `npx cap add android` (via `npm run cap:add:android`) should regenerate the full project. Then `npm run cap:sync` copies web assets. See `scripts/setup-android.sh`.

## Platform Detection

`Capacitor.isNativePlatform()` determines native vs browser/PWA mode. The SMSReader component adapts: native scan button (with permission flow) vs. manual paste UI with "PWA Mode" badge.

## PWA Configuration

- `vite-plugin-pwa` with `autoUpdate` register type
- Workbox runtime caching for Google Fonts
- `display: standalone`, theme `#6366f1`
- Service worker precaches JS/CSS/HTML/images

## Scripts

| Script | Purpose |
|--------|---------|
| `dev` | Vite dev server (host: true, port 5173) |
| `build` | Generate icons → tsc → vite build |
| `build:web` | Same + `VITE_ROUTER_BASE=/expense-tracker` |
| `preview` | Vite preview |
| `cap:add:android` | `npx cap add android` |
| `cap:sync` | Build + cap sync |
| `cap:open:android` | Open in Android Studio |
| `cap:run:android` | Run on connected device |

## Key Conventions

- TypeScript strict mode, `noUnusedLocals: false`, `noUnusedParameters: false`
- Tailwind arbitrary values widely used (brackets not avoided)
- `base: './'` in Vite (relative asset paths — required for Capacitor)
- UI: rounded-2xl cards, gray-50 bg, primary-500 indigo accent
- Import aliases: none configured (no `@/` or `~` paths — all relative)
- No linter/formatter configured in project (no eslint/prettier)
- All data is local-first; no API integration exists
