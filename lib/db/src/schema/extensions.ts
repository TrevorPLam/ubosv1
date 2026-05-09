/**
 * @file        lib/db/src/schema/extensions.ts
 * @module      Database / Schema / Extensions
 * @purpose     PostgreSQL extensions setup for AI-powered business management system
 *
 * @ai_instructions
 *   - This file defines SQL statements to enable required PostgreSQL extensions.
 *   - Extensions are enabled via CREATE EXTENSION commands.
 *   - Each extension serves a specific purpose in the AI system architecture.
 *   - DO NOT modify extension names unless absolutely necessary.
 *   - All extensions must be enabled before schema creation.
 *
 * @exports     Extension migration functions and SQL statements
 * @imports     drizzle-orm/pg-core
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Extension migration SQL statements
 * These statements enable the required PostgreSQL extensions for the system
 */

// Extension: pgvector - Vector embeddings for RAG and semantic search
// Enables storage and similarity search of high-dimensional vectors
export const enablePgVector = sql`
  CREATE EXTENSION IF NOT EXISTS pgvector;
`;

// Extension: pgvectorscale - Scalable vector indexing for high-performance vector search
// Provides advanced indexing algorithms for large-scale vector operations
export const enablePgVectorScale = sql`
  CREATE EXTENSION IF NOT EXISTS pgvectorscale;
`;

// Extension: pg_cron - Database-level job scheduling
// Enables scheduled SQL jobs for maintenance and background tasks
export const enablePgCron = sql`
  CREATE EXTENSION IF NOT EXISTS pg_cron;
`;

// Extension: pg_textsearch - Full-text search with BM25 ranking
// Provides advanced full-text search capabilities with BM25 algorithm
export const enablePgTextSearch = sql`
  CREATE EXTENSION IF NOT EXISTS pg_textsearch;
`;

// Extension: anon - PostgreSQL Anonymizer for GDPR compliance
// Enables data anonymization and privacy protection features
export const enableAnon = sql`
  CREATE EXTENSION IF NOT EXISTS anon;
`;

/**
 * Combined migration to enable all required extensions
 * This function returns all SQL statements needed for extension setup
 */
export const enableAllExtensions = sql`
  -- Enable vector extensions for AI/ML features
  CREATE EXTENSION IF NOT EXISTS pgvector;
  CREATE EXTENSION IF NOT EXISTS pgvectorscale;
  
  -- Enable job scheduling for background tasks
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  
  -- Enable advanced full-text search
  CREATE EXTENSION IF NOT EXISTS pg_textsearch;
  
  -- Enable data anonymization for GDPR compliance
  CREATE EXTENSION IF NOT EXISTS anon;
`;

/**
 * Extension verification table
 * Tracks which extensions have been successfully enabled
 */
export const extensionStatusTable = pgTable("extension_status", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  version: text("version"),
  enabled: boolean("enabled").default(false),
  enabledAt: timestamp("enabled_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
});

/**
 * Types for extension status
 */
export type ExtensionStatus = typeof extensionStatusTable.$inferSelect;
export type InsertExtensionStatus = typeof extensionStatusTable.$inferInsert;

/**
 * Required extensions list
 * Used for verification and health checks
 */
export const REQUIRED_EXTENSIONS = [
  "pgvector",
  "pgvectorscale", 
  "pg_cron",
  "pg_textsearch",
  "anon"
] as const;

/**
 * Extension health check query
 * Verifies that all required extensions are installed and available
 */
export const verifyExtensionsQuery = sql`
  SELECT 
    extname as name,
    extversion as version,
    extrelocatable as relocatable,
    extconfig as config
  FROM pg_extension 
  WHERE extname IN (${REQUIRED_EXTENSIONS.join(", ")})
  ORDER BY extname;
`;
