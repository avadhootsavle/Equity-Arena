# Equity Arena

Equity Arena is a real-time multiplayer stock market simulation trading game built for the Ignite 8.0 event. Designed to mirror a high-stakes institutional trading floor, Equity Arena enables participants to compete in live trading sessions with real-time order matching, market news catalysts, custom limit orders, and automatic portfolio mark-to-market calculations.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Socket.io Client, Context API
- **Backend**: Node.js, Express.js, Socket.io (WebSocket Real-Time Engine), JSON Web Tokens (JWT), BcryptJS
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Utilities**: XLSX Parser, Embedded Postgres (Local Development Fallback)

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- **Node.js**: `v18+` or `v20+`
- **npm**: `v9+` or `v10+`
- **PostgreSQL**: (Optional if using embedded database fallback)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/avadhootsavle/Equity-Arena.git
cd Equity-Arena
```

---

### Step 2: Install Backend Dependencies & Database Setup
```bash
cd backend
npm install
```

Set up your `.env` file inside the `backend/` folder:
```env
PORT=5001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/equity_arena?schema=public"
JWT_SECRET="your_secure_jwt_secret_key_here"
NODE_ENV="development"
```

Initialize the database schema and run seed data:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Start the backend development server:
```bash
npm run dev
```
The server will run at `http://localhost:5001`.

---

### Step 3: Install Frontend Dependencies & Run Interface
Open a new terminal window:
```bash
cd frontend
npm install
```

Set up your `.env` file inside the `frontend/` folder:
```env
VITE_API_URL="http://localhost:5001"
VITE_SOCKET_URL="http://localhost:5001"
```

Start the frontend development server:
```bash
npm run dev
```
The application will run at `http://localhost:5173`.

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)
- `PORT`: Port on which the Express and Socket.io server listens (Default: `5001`).
- `DATABASE_URL`: Connection string for PostgreSQL database.
- `JWT_SECRET`: Secret key used for signing JWT authentication tokens.
- `NODE_ENV`: Environment mode (`development` or `production`).

### Frontend (`frontend/.env`)
- `VITE_API_URL`: Backend REST API base endpoint URL (e.g. `http://localhost:5001`).
- `VITE_SOCKET_URL`: WebSocket Socket.io server URL (e.g. `http://localhost:5001`).

---

## 📈 How the Game Works

1. **Roster Authentication**:
   - Participants log in using their registered Email and Phone Number (Password).
   - Only registered roster participants can access trading dashboards.

2. **Session Engine**:
   - The Admin configures and starts a tournament trading session with customizable duration, auto-liquidation buffer, macro cycle interval, and volatility preset.
   - All client screens receive live WebSocket clock synchronizations.

3. **Trading Floor Mechanics**:
   - **Market Trading**: Execute instant Quick Buy / Quick Sell orders at live market prices.
   - **Limit Orders**: Place buy/sell limit orders below/above market price with balance locking.
   - **News Catalysts**: Admin broadcasts market news breaking alerts that impact specific stock prices in real time.

4. **Auto-Liquidation & Tournament Leaderboard**:
   - At the auto-liquidation buffer time before session end, all open positions automatically convert back to cash.
   - The live leaderboard ranks traders by total portfolio net worth.

---

## 📜 License

This project is licensed under the ISC License.
