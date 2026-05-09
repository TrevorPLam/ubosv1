/**
 * @file        lib/db/src/schema/index.ts
 * @module      Database / Schema
 * @purpose     Central export point for all database schema definitions
 *
 * @ai_instructions
 *   - Export each model/table from separate files using export * from "./filename".
 *   - Each model file must define a Drizzle table, insert schema, and types.
 *   - DO NOT define tables directly in this file.
 *   - Follow the naming convention: tableName, insertTableSchema, InsertTable, Table.
 *
 * @exports     All schema exports from individual model files
 * @see         Follow the commented examples for proper table definition structure
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

// Export PostgreSQL extensions setup
export * from "./extensions";

// Export tenant infrastructure and RLS helpers
export * from "./tenants";
export * from "./helpers";

// Export outbox schema for transactional events
export * from "./outbox";

// Export agent and approval schemas
export * from "./agents";
export * from "./approvals";

// Export chat schema
export * from "./chat";
export * from "./chat-rls";