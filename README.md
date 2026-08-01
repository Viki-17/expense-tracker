# Expense Tracker

> Local-first expense tracker with SMS auto-parsing for Indian bank/UPI transactions.
> All data stays on your device — nothing is ever sent to a server.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## Features

- **Completely offline** — all data in IndexedDB (via Dexie.js), zero server calls
- **SMS auto-parsing** — detects 12 bank/UPI patterns and 13+ merchants (Swiggy, Amazon, Uber, etc.)
- **Live SMS listener** — auto-imports transactions on Android when a bank SMS arrives
- **PWA** — installable on desktop and mobile, works offline with service worker caching
- **Android native** — Capacitor wrapper with custom SMS reader plugin
- **Dashboard** — spending ring, monthly bar chart, category breakdown, merchant breakdown
- **Budgets** — per-category monthly budget tracking with progress bars
- **Virtualized lists** — smooth scrolling even with thousands of transactions
- **Dark mode** — system-aware with manual toggle
- **Export/Import** — JSON backup and restore
- **Custom categories** — add, edit, delete custom spending categories

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 (TypeScript strict mode) |
| Build | Vite 5 |
| Styling | Tailwind CSS 3.4 (dark mode) |
| Local DB | Dexie.js 4 (IndexedDB) |
| Charts | Recharts 2.12 |
| Routing | React Router DOM 6 |
| Animation | Framer Motion 12 |
| Virtualization | react-window 1.8 |
| Native | Capacitor 8 (Android) |
| PWA | vite-plugin-pwa |

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9

### For Android builds:
- **Android Studio** with Android SDK (API 34+)
- **JDK 21** (recommended via Homebrew on macOS: `brew install openjdk@21`)
- Android SDK environment variables set (`ANDROID_HOME` or `ANDROID_SDK_ROOT`)

## Installation

```bash
git clone https://github.com/Viki-17/expense-tracker.git
cd expense-tracker
npm install
```

## Development

### Web (PWA)

```bash
npm run dev
```

Opens at `http://localhost:5173`. Hot module replacement is enabled.

### Type-check

```bash
npx tsc -b
```

### Build

```bash
# Build for web (PWA enabled)
npm run build

# Build for Capacitor (PWA disabled, relative asset paths)
npm run build:cap

# Build for GitHub Pages deployment (sub-path)
npm run build:web
```

Output goes to `dist/`.

### Preview production build

```bash
npm run preview
```

## Android

### Setup (first time)

```bash
npm run cap:add:android
```

This creates the `android/` directory via Capacitor. If it already exists:

```bash
npm run cap:sync
```

The custom SMS reader plugin (`SmsReaderPlugin.java`) is already registered in `MainActivity.java`. Ensure `AndroidManifest.xml` includes:

```xml
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.RECEIVE_SMS" />
```

### Build APK

```bash
npm run build:android
```

Finds the debug APK at `android/app/build/outputs/apk/debug/app-debug.apk`.

### Open in Android Studio

```bash
npm run cap:open:android
```

### Run on connected device

```bash
npm run cap:run:android
```

### Seed test SMS (emulator only)

```bash
npm run seed-sms
```

Sends 30+ dummy bank/UPI SMS messages to the emulator for testing the parser.

### One-command emulator preview

```bash
npm run android:preview
```

Starts emulator, builds APK, installs, and launches in one step.

## Project Structure

```
src/
├── main.tsx                  # React entry
├── App.tsx                   # Routes
├── index.css                 # Tailwind + tokens + safe-area
├── types/index.ts            # TypeScript types
├── db/index.ts               # Dexie schema + query helpers
├── contexts/
│   └── ThemeProvider.tsx      # Dark/light theme context
├── hooks/
│   ├── useTransactions.ts     # CRUD + live queries
│   ├── useCategories.ts       # Category management
│   └── ...                    # usePullToRefresh, useSafeArea, useSmsListener, useSwipe
├── utils/
│   ├── smsParser.ts           # SMS parsing (295 lines, 12 rules)
│   ├── formatters.ts          # INR currency, date helpers
│   ├── categories.ts          # Category metadata + colors
│   └── platform.ts            # Capacitor platform detection
├── plugins/sms-reader/        # Custom Capacitor SMS plugin (JS side)
├── components/
│   ├── Layout.tsx             # Shell: sidebar + bottom nav + transitions
│   ├── Dashboard.tsx          # Main dashboard with spend ring + charts
│   ├── TransactionForm.tsx    # Add/edit transaction form
│   ├── TransactionList.tsx    # Virtualized all-time transaction list
│   ├── SMSReader.tsx          # Native scan + manual paste SMS UI
│   ├── GroupDetail.tsx        # Category/merchant drill-down view
│   ├── Icons.tsx              # SVG icon components
│   └── ui/                    # Reusable primitives (Button, Card, Tabs, etc.)
└── pages/
    ├── Home.tsx               # Dashboard page
    ├── Transactions.tsx       # All transactions page
    ├── AddTransaction.tsx     # Add transaction page
    ├── SMSImport.tsx          # SMS import page
    ├── Budgets.tsx            # Budget tracking page
    ├── CategoryDetail.tsx     # Category detail page
    ├── MerchantDetail.tsx     # Merchant detail page
    └── Settings.tsx           # Settings, export/import, categories
```

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Home | Dashboard with spending overview |
| `/transactions` | Transactions | All transactions (virtualized, sortable, filterable) |
| `/add` | Add Transaction | Standalone add transaction form |
| `/sms` | SMS Import | Native SMS scan or manual paste |
| `/budgets` | Budgets | Per-category monthly budget tracking |
| `/category/:name` | Category Detail | Category drill-down with monthly chart |
| `/merchant/:name` | Merchant Detail | Merchant drill-down with monthly chart |
| `/settings` | Settings | Theme, export/import, reset, custom categories |

## Database

Dexie.js (IndexedDB) with two tables:

- **transactions** — `++id, type, category, date, amount, source, merchant, [type+date], [category+date]`
- **categories** — `++id, name`

14 default categories pre-populated. Data is never sent anywhere — stays in the browser's IndexedDB.

## SMS Parser

The parser (`src/utils/smsParser.ts`) supports:

- **12 bank patterns**: generic debit/credit, UPI payment/credit, card payment, ATM withdrawal
- **6 merchant categories**: Food/Dining, Grocery, Transport, Entertainment, Shopping, Bills
- **13 known merchants**: Amazon, Flipkart, Zomato, Swiggy, Uber, Ola, Netflix, BigBasket, Blinkit, Zepto, Myntra, JioMart, DMart

Returns confidence score (0–95), amount, type, category, merchant, description, and date.

## All Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Vite dev server on port 5173 |
| `build` | `npm run build` | Type-check + build for web (PWA enabled) |
| `build:web` | `npm run build:web` | Build with `VITE_ROUTER_BASE=/expense-tracker` for sub-path deployment |
| `build:cap` | `npm run build:cap` | Build for Capacitor (PWA disabled, relative paths) |
| `preview` | `npm run preview` | Preview production build locally |
| `preview:web` | `npm run preview:web` | Preview with sub-path base |
| `cap:init` | `npm run cap:init` | Initialize Capacitor config |
| `cap:add:android` | `npm run cap:add:android` | Add Android platform via Capacitor |
| `cap:sync` | `npm run cap:sync` | Build for Capacitor + sync web assets to Android |
| `cap:sync:web` | `npm run cap:sync:web` | Build for web + sync to Android |
| `cap:open:android` | `npm run cap:open:android` | Open Android project in Android Studio |
| `cap:run:android` | `npm run cap:run:android` | Build + run on connected Android device/emulator |
| `build:android` | `npm run build:android` | Build debug APK via Gradle |
| `seed-sms` | `npm run seed-sms` | Seed emulator with test SMS messages |
| `android:preview` | `npm run android:preview` | One-command emulator launch (start, build, install) |

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
