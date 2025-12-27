import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load .env.local first to prioritize Vercel pulled envs
dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL!,
  },
});
