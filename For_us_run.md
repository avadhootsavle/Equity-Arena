# 🚀 How to Run Equity Arena Locally

A step-by-step guide for running the **Equity Arena** live stock trading simulation platform on your local computer.

---

## 📋 Prerequisites

Before starting, make sure you have the following installed:
1. **Node.js** (v18.x or higher) — [Download Node.js](https://nodejs.org/)
2. **PostgreSQL** — [Download PostgreSQL](https://www.postgresql.org/download/)

---

## ⚡ Quick 5-Step Startup Guide

### Step 1: Clone the Repository
Open your terminal and run:
```bash
git clone https://github.com/avadhootsavle/Equity-Arena.git
cd Equity-Arena
```

---

### Step 2: Set Up Backend Environment & Database

1. Navigate to the `backend` folder and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file inside the `backend` directory:
   ```env
   PORT=5001
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stockgame?schema=public"
   JWT_SECRET="equity_arena_secret_jwt_key_2026"
   SESSION_SECRET="equity_arena_session_secret_2026"
   ```
   *(Adjust PostgreSQL username/password `postgres:postgres` if your local Postgres setup uses different credentials).*

3. Run database migrations and seed default stock data:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

---

### Step 3: Start the Backend Server

In the `backend` terminal, run:
```bash
npm run dev
```
You should see:
```text
📈 Dual-Layer Quant Market Ticker started (Continuous GBM + 3-Min Staggered 10-30% Macro Swings)
Server running on port 5001
```

---

### Step 4: Start the Frontend Application

1. Open a **new terminal window/tab** and navigate to the `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```

3. Open your web browser and go to:
   ```text
   http://localhost:5173
   ```

---

## 🔑 User Credentials & Access

### 1. Trader Access
- You can **Sign Up** a new account directly on the login screen.
- Every new trader gets **20,000 IC** (Ignite Coins) starting wallet balance.

### 2. Admin Panel Access
- **Admin Email**: `admin@test.com`
- **Admin Password**: `admin123`
- **How to Trigger Admin Login**:
  - Go to `http://localhost:5173/login`.
  - Click the **"EQUITY ARENA"** title header badge **5 times rapidly**.
  - The secret Admin Login modal will pop up on your screen!

---

## 🎮 Features to Try Out
- **Live Stock Exchange Grid**: Real-time prices updating every 1.5 seconds with live green/red price flashes and sparkline charts.
- **Limit Orders**: Set target buy/sell prices; orders execute automatically when market price matches your target.
- **3-Hour Game Session Countdown**: Synced countdown timer in header; auto-liquidates holdings to cash 5 minutes before session end.
- **Analyst Wire News Takeover**: Breaking market news toasts with real-time UI notification chimes.
- **Dark / Light Theme Toggle**: Click the Sun/Moon icon in the header bar to switch themes.
- **Audio Sound Mute Toggle**: Click the Speaker icon in the header to toggle news notification sounds.

---

Happy Trading! 📈✨
