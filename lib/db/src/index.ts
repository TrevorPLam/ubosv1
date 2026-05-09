/**
 * @file        lib/db/src/index.ts
 * @module      Database / Core
 * @purpose     Database connection and ORM setup using Drizzle with PostgreSQL
 *
 * @ai_instructions
 *   - DATABASE_URL environment variable must be set before importing.
 *   - All database queries must use the exported db instance.
 *   - DO NOT create additional database connections; use the exported pool.
 *   - Schema must be imported from the schema index file.
 *
 * @exports     db, pool, all schema exports
 * @imports     drizzle-orm/node-postgres, pg, ./schema
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
