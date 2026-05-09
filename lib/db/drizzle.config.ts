/**
 * @file        lib/db/drizzle.config.ts
 * @module      Database / Configuration
 * @purpose     Drizzle Kit configuration for database migrations and schema management
 *
 * @ai_instructions
 *   - DATABASE_URL environment variable must be set before running.
 *   - Schema path must point to the correct schema index file.
 *   - DO NOT change the dialect from postgresql.
 *   - All database operations must use this configuration.
 *
 * @exports     Default drizzle-kit configuration object
 * @imports     drizzle-kit, path
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
