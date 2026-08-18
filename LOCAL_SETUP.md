# 📦 Equity Arena — Offline Local PostgreSQL & Setup Guide

This guide details how to run **Equity Arena** 100% offline using a local PostgreSQL database with zero internet dependency on the day of your event.

---

## 🚀 Quick Offline Start (Zero Config — Recommended)

Equity Arena includes an **Embedded PostgreSQL Engine** (`backend/scripts/start-db.js`). You do not need to install or configure external database software manually.

Simply run:

```bash
# 1. Start & Initialize Local Embedded PostgreSQL Database
node backend/scripts/start-db.js

# 2. Start Backend Server
npm --prefix backend start

# 3. Serve Production Frontend on LAN
npm --prefix frontend run preview
```

---

## ⚡ Cache Control Strategy & Rebuild Workflow

To prevent stale cached `index.html` files from requesting old missing JavaScript bundle hashes after a rebuild:

1. **`index.html` Cache Prevention**: `index.html` is configured with `Cache-Control: no-cache, no-store, must-revalidate`. Browsers always fetch the newest `index.html` pointing to current build bundle filenames.
2. **Immutable Asset Caching**: Hashed static assets under `/assets/` are cached aggressively with `Cache-Control: public, max-age=31536000, immutable`.
3. **Explicit 404 for Missing Assets**: Missing asset requests return an explicit HTTP 404 text response rather than falling back to `index.html`.
4. **Development Workflow Tip**: If you rebuild the app (`npm run build`) while testing in an open browser tab, perform a **Hard Refresh** (`Cmd+Shift+R` on Mac or `Ctrl+F5` on Windows) on the tab to clear transient in-memory browser tab caches.

---

## 🛠️ Alternative: Manual Local PostgreSQL Installation

If you prefer using a system-installed PostgreSQL instance (e.g. Homebrew or Postgres.app):

### 1. Installation

#### macOS (Homebrew):
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### macOS (Postgres.app):
- Download and install [Postgres.app](https://postgresapp.com/).
- Open the app and click **Initialize**.

#### Windows:
- Download the official installer from [PostgreSQL EDB Downloads](https://www.postgresql.org/download/windows/).
- Follow the wizard setup and choose a password (e.g. `postgres`).

---

### 2. Database Creation & Schema Push

Create your local database:

```bash
# Create local database
createdb -U postgres equity_arena_local
```

Update your `backend/.env` file:
```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/equity_arena_local?schema=public"
```

Sync schema and seed initial market data:
```bash
cd backend
npx prisma db push
node prisma/seed.js
```

---

## 💾 Tournament Database Backup Safety Net

Since the event runs locally without cloud redundancy, Equity Arena includes automated and manual backup tools to guarantee no tournament data is lost.

### 1. Manual Backup Command
Run this anytime to save an instant snapshot of all user balances, holdings, transaction logs, orders, and session results:

```bash
npm --prefix backend run backup
```

Backups are saved to:
`backend/backups/equity_arena_backup_<timestamp>.json`

### 2. Automatic Background Backups
- During an active trading session, Equity Arena automatically creates a fresh backup snapshot every **15 minutes**.
- When an admin locks or ends a session, an immediate final backup snapshot is generated automatically.

---

## 🔄 Switching Between Local & Cloud Database Modes

Switching between local offline PostgreSQL and cloud Neon PostgreSQL is **100% environment-driven** and requires **zero code changes**:

| Mode | `DATABASE_URL` in `backend/.env` |
| :--- | :--- |
| **Local Offline Mode** | `postgresql://postgres:postgres@localhost:5432/stockgame?schema=public` |
| **Cloud Neon Mode** | `postgresql://user:password@ep-xxx.neon.tech/equity_arena?sslmode=require` |
| **Cloud Render Mode** | `postgresql://user:password@dpg-xxx-a/equity_arena_db` |
