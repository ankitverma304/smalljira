# Project & Ticket Management System

Monorepo scaffold for a project and ticket management platform with:

- React + Vite frontend
- Node.js + Express backend
- PostgreSQL data model via Prisma for Render-friendly deployment
- JWT auth and role-based authorization
- Modules for projects, tickets, comments, history, reports, and analytics

## Structure

```text
apps/
  api/    Express API + Prisma schema
  web/    React frontend
```

## Quick start

1. Install dependencies in both apps.
2. Copy environment files.
3. Point `DATABASE_URL` to PostgreSQL.
4. Seed demo data.
5. Start API and frontend.

## Backend

```bash
cd apps/api
cp .env.example .env
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

## Frontend

```bash
cd apps/web
cp .env.example .env
npm install
npm run dev
```

## Suggested next steps

- Add real file storage for attachments using S3 or local object storage
- Replace seeded auth with production identity flow and password reset
- Add Socket.IO for real-time ticket comments and notifications
- Extend reports with export endpoints and chart caching

## Demo account

- Email: `superadmin@example.com`
- Password: `admin123`

## Local origins

The API allows both `127.0.0.1` and `localhost` on Vite ports `5173` and `5174` by default.

## Render Deployment

This project is prepared for a free Render setup using:

- 1 Render Postgres database
- 1 Render web service for the API
- 1 Render static site for the frontend

Backend service settings:

- Root Directory: `apps/api`
- Build Command: `npm install && npm run deploy:render`
- Start Command: `npm run start`

Backend environment variables:

- `DATABASE_URL`: use the Render Postgres `External Database URL`
- `JWT_SECRET`: any long random string
- `CLIENT_URL`: your frontend URL, for example `https://projectmgt-web.onrender.com`
- `PORT`: leave unset on Render

Frontend static site settings:

- Root Directory: `apps/web`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Frontend environment variables:

- `VITE_API_URL`: your backend URL with `/api`, for example `https://projectmgt-api.onrender.com/api`

Static site rewrite:

- Add a rewrite rule from `/*` to `/index.html` in Render so React Router routes work on refresh.

After the backend's first successful deploy, the seed creates these users with password `admin123`:

- `superadmin@example.com`
- `admin@example.com`
- `manager@example.com`
- `lead@example.com`
- `dev@example.com`
- `qa@example.com`
- `user@example.com`
