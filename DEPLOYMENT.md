# Deployment & Environment Configuration Guide

This guide outlines the environment configuration and deployment steps for deploying the **Ignite Stock Exchange** application to production.

---

## Environment Variables

### Backend Configuration (`.env`)

| Variable Name | Description | Example / Recommended Value |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://user:pass@host:5432/stockgame?sslmode=require` |
| `JWT_SECRET` | Secret key for signing and verifying JWT tokens | `generate-a-long-random-string-in-production` |
| `PORT` | HTTP & WebSocket server port | `5000` (or injected by Render/Heroku) |

### Frontend Configuration (`frontend/.env`)

| Variable Name | Description | Example / Recommended Value |
|---|---|---|
| `VITE_API_URL` | Backend server URL | `https://your-backend-api.onrender.com` |

---

## Deployment Setup

### 1. Database Deployment (PostgreSQL)
- Deploy a managed PostgreSQL database on **Neon**, **Supabase**, **Render Postgres**, or **AWS RDS**.
- Update `DATABASE_URL` in your backend environment configuration.
- Run Prisma migrations and seed data:
  ```bash
  npx prisma db push
  npx prisma db seed
  ```

### 2. Backend Deployment (Render / Railway / Heroku)
- Service Type: **Web Service** (Node.js)
- Build Command: `npm install && npx prisma generate && npx prisma db push`
- Start Command: `node src/index.js`
- Set Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `PORT=5000`.

### 3. Frontend Deployment (Vercel / Netlify)
- Framework Preset: **Vite**
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Set Environment Variables: `VITE_API_URL=https://your-backend-api.onrender.com`
