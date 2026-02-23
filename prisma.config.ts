import { config } from "dotenv";

const fakeDbUrl: string = "postgresql://postgres_user:pg_password@postgres:5432/pg_db?schema=public";

// only load .env if DATABASE_URL is not already set in environment
if (!process.env.DATABASE_URL) {
  config();
}

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx src/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? fakeDbUrl,
  },
});