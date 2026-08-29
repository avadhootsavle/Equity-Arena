# Equity Arena 🏆 — Real-Time Stock Exchange & Trading Arena

**Equity Arena** is a high-performance, full-stack real-time stock trading application built for competitive trading tournaments, live market simulations, and classroom finance gaming.

Designed with a **war-room financial terminal visual concept**, Equity Arena features live streaming price ticks, instant limit order matching, real-time leaderboard broadcasts, analyst news wires, and seamless dual-theme (Dark & Light) UI styling.

---

## 🌟 Key Features & Latest Highlights

- **⚡ Real-Time Engine (Socket.io)**: Live market tick streaming, instant trade execution, automated real-time leaderboard broadcasts to traders, admins, and public projector views (`/leaderboard/public`).
- **🎨 Premium Visual Redesign (Dual-Theme)**:
  - **Login Page**: Exciting split-hero desktop layout with radiating CSS web-line patterns, ambient glows, and theme-adaptive typography.
  - **Trading Floor Cards**: 30px commanding price display, 36px ticker logo badges, direction-coded left borders (`#22C55E` Up / `#EF4444` Down), glowing Quick BUY/SELL buttons, and outlined Normal Trade controls.
  - **My Stocks Portfolio Dashboard**: Impactful stat cards (28px gold cash with glow, 24px stock value, 24px profit/loss), 52px direction-bordered holding rows, friendly empty-state guidance with *Go to Market* CTA, and refined trade logs.
  - **Tournament Scoreboard**: Prestige leaderboards with user ID deduplication and rank shift indicators.
- **📈 Quant Price & News Engine**: Dynamic macro drift, analyst news triggers, steered price moves, and emergency trading locks.
- **🛡️ Robust Security & Zero Errors**: Fully audited codebase with zero browser console errors/warnings, safe socket listener cleanups, explicit asset cache prevention, and unhandled exception safety nets.

---

## 📂 Repository Structure

```text
Equity-Arena/
├── backend/          # Express.js, Prisma ORM, Socket.io, Quant Price Engine (Deploy to Render)
│   ├── prisma/       # Database schema & seeders
│   ├── src/          # API routes, socket handlers, market services
│   └── scripts/      # Embedded local PostgreSQL & backup tools
├── frontend/         # React, Vite, Tailwind CSS, Lucide Icons (Deploy to Vercel)
│   ├── src/
│   │   ├── components/   # FloorCard, MyStocks, MyTrades, StatTile, StockSparkline, etc.
│   │   ├── context/      # AuthContext, ThemeContext, SocketContext
│   │   └── pages/        # TraderDashboard, AdminDashboard, Login, PublicLeaderboardPage
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma db push --force-reset
node prisma/seed.js
npm run dev           # Runs API & Socket server on http://localhost:5001
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev           # Runs Vite dev server on http://localhost:5173
```

---

## 🌐 Dual Deployment Guides

### Mode 1: Local Lab LAN WiFi Mode (In-Person Tournaments)
Run locally over event WiFi with embedded/system PostgreSQL:
```bash
# Start DB & Backend
node backend/scripts/start-db.js
npm --prefix backend start

# Serve Production Build on LAN
npm --prefix frontend run build
npm --prefix frontend run preview
```
*Access via LAN IP: `http://192.168.x.x:5173`*

### Mode 2: Cloud Production Deployment

#### Backend (Render)
- **Web Service Directory**: `backend`
- **Build Command**: `npm install && npx prisma db push && node prisma/seed.js`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `DATABASE_URL`: PostgreSQL connection URI
  - `JWT_SECRET`: Secret JWT key
  - `CLIENT_URL`: `https://equity-arena.vercel.app`

#### Frontend (Vercel)
- **Framework**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://equity-arena-backend.onrender.com`

