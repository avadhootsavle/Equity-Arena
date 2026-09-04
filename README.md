# 🏆 Equity Arena — Complete College PC Setup & Deployment Guide

Welcome to **Equity Arena**! This guide contains all the instructions and commands needed to transfer, install, and run the entire trading platform directly on any college desktop (Windows, Mac, or Linux).

---

## ⚡ System Architecture (How it works)

- **Single Server Architecture**: The Node.js backend serves **both** the API, WebSocket engine, and the compiled frontend static application on port `5001`.
- **Embedded Database**: PostgreSQL is powered by `embedded-postgres`. You do **not** need to install or configure external PostgreSQL databases.
- **Universal Portability**: The frontend automatically connects to the server's current IP address, working seamlessly across LAN, Wi-Fi, and localhost.

---

## 📦 Step 1: Transfer the Project to the College PC

### Option A: Via USB Pen Drive (Fastest)
1. Copy the entire `ignite` folder to your USB drive.
2. *(Optional Pro-Tip)*: To make copying much faster, you can delete the `node_modules` folders before copying, or leave them intact if the college PC has slow internet.
3. Paste the `ignite` folder onto the College PC Desktop.

### Option B: Via Git
On the College PC, open Terminal or Command Prompt:
```bash
git clone <YOUR_REPOSITORY_URL>
cd ignite
```

---

## 🛠️ Step 2: Prerequisites on the College PC

Make sure **Node.js** is installed on the College PC:
1. Open Command Prompt (Windows) or Terminal (Mac/Linux).
2. Check if Node.js is installed:
   ```bash
   node -v
   npm -v
   ```
   *Required: Node.js v18, v20, or newer.*
3. If not installed, download and install Node.js LTS from: **[https://nodejs.org](https://nodejs.org)** (takes 1 minute).

---

## 💻 Step 3: Installation & First-Time Setup

Open Command Prompt / Terminal inside the `ignite` folder:

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 3. Initialize Embedded Database
Go to the backend folder and start the embedded database:
```bash
cd ../backend
node scripts/start-db.js
```
*(This automatically boots up the embedded Postgres database on port 5432 and pushes the Prisma schema).*

### 4. Seed Tournament Stocks & News
Run the seed command to load all 20 actual tournament stocks and 40 market news templates:
```bash
npm run prisma:seed:actual
```
*(If you want practice stocks instead, run `npm run prisma:seed:practice`).*

### 5. Build the Frontend
Compile the production frontend build:
```bash
cd ../frontend
npm run build
```
*(Takes ~2 seconds; compiles static assets into `frontend/dist`).*

---

## 🚀 Step 4: Run Equity Arena

From the `backend` folder, start the server:

```bash
cd ../backend
node src/index.js
```

You will see:
```text
📈 Dual-Layer Quant Market Ticker started (Continuous GBM + Macro Swings)
🚀 Equity Arena Server listening on http://0.0.0.0:5001 (Bound to all network interfaces)
✅ Verified 40 Analyst News Templates in database.
```

The system is now live and accepting connections!

---

## 🌐 Step 5: How Students & Big Screen Connect

### 1. Find the College Host PC's IP Address
- **On Windows**: Open Command Prompt, run `ipconfig`, look for **IPv4 Address** (e.g., `192.168.1.50`).
- **On Mac**: Open Terminal, run `ipconfig getifaddr en0` (e.g., `192.168.0.107`).

### 2. URL Access Guide

| User | Purpose | Access URL |
| :--- | :--- | :--- |
| **Traders (Students)** | Trading floor & stock research | `http://<HOST_IP>:5001` *(e.g. `http://192.168.1.50:5001`)* |
| **Admin Panel (Host PC)** | Session timer, roster & market controls | `http://localhost:5001/admin` |
| **Projector / Big Screen** | Live tournament standings | `http://<HOST_IP>:5001/leaderboard` |

---

## 🔑 Default Credentials

### 👑 Admin Account
- **Email**: `avadhoot@krishna.kavya`
- **Password**: `010428`

### 🧑‍💻 Trader Accounts
- **Email**: The student's registered email address (e.g., from your roster).
- **Password**: The student's registered phone number.
- **Starting Wallet**: `20,000 IC` (Ignite Coins).

---

## 🎮 Tournament Game Master Checklist

1. **Before Starting the Game**:
   - Ensure students can log in to `http://<HOST_IP>:5001`.
   - When students log in before the game starts, they will see their **Trader Dashboard** with their starting balance of 20,000 IC, list of stocks, and the banner:
     `MARKET SESSION LOCKED: Trading opens when admin starts the session`.
   - Students can research stocks, view charts, and read business descriptions.
2. **Starting the Session**:
   - Go to `http://localhost:5001/admin`.
   - In the top header bar, click **START SESSION**.
   - Configure duration (Default: `180` minutes / 3 hours) and auto-liquidation buffer (`5` minutes).
   - Click **Confirm**. The game clock will start and trading will automatically unlock for all participants simultaneously!
3. **Mid-Game Refreshment Break (Optional)**:
   - Click **⏸ PAUSE FOR BREAK** in the admin header.
   - Enter break duration (e.g. `10` minutes) and an announcement note.
   - The market will freeze and display the break countdown timer to all traders.
   - Click **RESUME GAME** anytime to restart trading early.
4. **News & Market Shocks**:
   - In the Admin Panel under **News Hub**, select any of the 40 pre-configured news templates or type custom news.
   - Click **Broadcast News** to trigger price steering across related stocks.
5. **Auto-Liquidation & Winner Ceremony**:
   - In the final 5 minutes, auto-liquidation automatically executes, converting all stocks to cash at spot price.
   - When the clock hits `00:00`, trading officially concludes and the **Official Tournament Scorecard** with confetti mounts for each trader!
   - Display the public leaderboard on the projector at `http://<HOST_IP>:5001/leaderboard` to announce the winners.

---

## 🛟 Troubleshooting & Emergency Tips

### Issue 1: Students cannot open the IP address on College Wi-Fi
- **Reason**: Some college Wi-Fi networks block peer-to-peer device communication (AP Isolation).
- **Fix A (Easiest)**: Turn on Mobile Hotspot on your smartphone. Connect the host PC and college PCs to your hotspot.
- **Fix B (Cloudflare Tunnel - Free & Instant)**:
  Run this one-line command in terminal to get a public HTTPS link:
  ```bash
  npx cloudflared tunnel --url http://localhost:5001
  ```
  It gives a public link like `https://tournament-xyz.trycloudflare.com`. Any student can open that link on any PC or phone!

### Issue 2: Port 5001 is already in use
- Kill any process occupying port 5001:
  - **Mac/Linux**: `lsof -ti :5001 | xargs kill -9`
  - **Windows**: `netstat -ano | findstr :5001` then `taskkill /PID <PID> /F`

### Issue 3: Re-reset all participants back to 20,000 IC
- In the Admin Dashboard under **Roster Management**, click **RESET ALL PARTICIPANTS**.
- Or run via terminal:
  ```bash
  curl -s -X POST http://localhost:5001/admin/participants/reset-all
  ```
