# PVP One

MVP SaaS for Plant Variety Protection management.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Auth**: NextAuth.js (v5)
- **UI**: Tailwind CSS + Shadcn UI

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   Ensure you have a PostgreSQL database running.
   Update `.env` with your database credentials:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/pvp_one"
   AUTH_SECRET="your-secret"
   ```

3. **Push Schema**
   ```bash
   npm run db:push
   ```

4. **Seed Data (Egypt v1 Ruleset)**
   ```bash
   npx tsx scripts/seed.ts
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## Features
- **Jurisdiction Rules Engine**: Configurable deadlines, terms, and requirements.
- **Dashboard**: Overview of cases and upcoming deadlines.
- **Multi-tenancy**: Organisation-based data isolation.
- **Audit Logging**: Tracks rule executions and user actions.

## Project Structure
- `app/`: Next.js App Router pages and API routes.
- `db/`: Drizzle schema and database connection.
- `lib/`: Shared utilities (Auth, Rules Engine).
- `scripts/`: Database seed scripts.
