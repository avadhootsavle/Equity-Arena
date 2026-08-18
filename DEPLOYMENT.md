# 🌐 Equity Arena — Dual-Mode Deployment & Environment Guide

Equity Arena supports two distinct deployment modes without requiring any code edits:
1. **Local Lab LAN WiFi Mode**: Runs locally on your laptop over college/event lab WiFi for 30+ simultaneous in-person players.
2. **Cloud Production Mode**: Runs deployed on **Render** (backend & database) and **Vercel** (frontend).

---

## 🏬 Mode 1: Local Lab LAN WiFi Setup (In-Person Event)

Use this setup on the day of the event when 30+ players are connected to the same WiFi router in a lab.

### Step 1: Find your Laptop's LAN IP Address
Open terminal and run:
- **macOS / Linux**: `ifconfig | grep "inet "` (look for `192.168.x.x` or `10.x.x.x`)
- **Windows**: `ipconfig` (look for IPv4 address)
- *Example LAN IP*: `192.168.1.42`

### Step 2: Configure Environment Files
Copy example LAN environment files:

```bash
# Backend .env
cp backend/.env.lan.example backend/.env

# Frontend .env
cp frontend/.env.lan.example frontend/.env
```

Edit `backend/.env` and `frontend/.env` to insert your LAN IP:
- `backend/.env`: `CLIENT_URL="http://192.168.1.42:5173,http://localhost:5173"`
- `frontend/.env`: `VITE_API_URL="http://192.168.1.42:5001"`

### Step 3: Launch Local Stack (Production Preview Mode)

```bash
# 1. Start Database & Backend
node backend/scripts/start-db.js
npm --prefix backend start

# 2. Build & Serve Production Frontend on LAN
npm --prefix frontend run build
npm --prefix frontend run preview
```

### Step 4: Share URL with Players
Players connect on their phones or lab PCs via browser:
👉 **`http://192.168.1.42:5173`**

---

## ☁️ Mode 2: Cloud Production Mode (Render + Vercel)

Use this setup for web hosting.

### 1. Render Web Service (Backend & PostgreSQL)
- **Root Directory**: `backend`
- **Build Command**: `npm install && npx prisma db push && node prisma/seed.js`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `DATABASE_URL` = `postgresql://equity_arena_db_user:password@dpg-xxxx-a/equity_arena_db` (Internal DB URL)
  - `JWT_SECRET` = `equity_arena_super_secret_jwt_key_2026_production`
  - `NODE_ENV` = `production`
  - `CLIENT_URL` = `https://equity-arena.vercel.app`

### 2. Vercel Project (Frontend)
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL` = `https://equity-arena-backend-qis1.onrender.com`

---

## 📊 Summary of `.env` Example Files

| Environment File | Purpose | Key Variable |
| :--- | :--- | :--- |
| `backend/.env.lan.example` | Local WiFi Lab Mode | `CLIENT_URL="http://192.168.x.x:5173"` |
| `frontend/.env.lan.example` | Local WiFi Lab Mode | `VITE_API_URL="http://192.168.x.x:5001"` |
| `backend/.env.production.example` | Render Cloud Mode | `CLIENT_URL="https://equity-arena.vercel.app"` |
| `frontend/.env.production.example` | Vercel Cloud Mode | `VITE_API_URL="https://equity-arena-backend-qis1.onrender.com"` |
