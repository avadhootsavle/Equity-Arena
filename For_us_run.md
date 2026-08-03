# Run Equity Arena Locally for UI/UX

---

## Requirement's

Pls Install this :-
1. **Node.js** (v18.x or higher) — [Download Node.js](https://nodejs.org/)
2. **PostgreSQL** — [Download PostgreSQL](https://www.postgresql.org/download/)

---

## Now to start Running project

### Step 1: Clone the Repository
Open your terminal and run:
```bash
git clone https://github.com/avadhootsavle/Equity-Arena.git
cd Equity-Arena
```

---

### Step 2: Run Backend 

1. Navigate to the `backend` folder and install the node modules:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file inside the `backend` directory **Very Important**:
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
