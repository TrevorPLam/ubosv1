/**
 * @file        lib/db/src/schema/outbox.ts
 * @module      Database / Schema / Outbox
 * @purpose     Transactional outbox table schema for reliable event delivery
 *
 * @ai_instructions
 *   - Include tenant_id column for multi-tenant isolation
 *   - Add proper indexes for efficient querying of unprocessed messages
 *   - Use JSONB for flexible content storage
 *   - Apply RLS policies using helpers from schema/helpers.ts
 *
 * @exports     outboxMessagesTable, processedEventsTable, insert schemas, and types
 * @imports     drizzle-orm/pg-core, drizzle-zod, zod/v4, ./helpers
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { 
  pgTable, 
  text, 
  uuid, 
  timestamp, 
  integer, 
  jsonb,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenantColumn } from "./helpers";

// Outbox message status enum
export const outboxMessageStatusEnum = pgEnum("outbox_message_status", [
  "pending",
  "processing", 
  "processed",
  "failed"
]);

// Outbox messages table for transactional event publishing
export const outboxMessagesTable = pgTable("outbox_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").notNull(),
  content: jsonb("content").notNull(),
  tenantId: tenantColumn.notNull(),
  status: outboxMessageStatusEnum("status").default("pending"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  error: text("error"),
  occurredOnUtc: timestamp("occurred_on_utc", { mode: "string" }).notNull().defaultNow(),
  processedOnUtc: timestamp("processed_on_utc", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow()
});

// Processed events table for idempotency tracking
export const processedEventsTable = pgTable("processed_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  tenantId: tenantColumn.notNull(),
  processedAt: timestamp("processed_at", { mode: "string" }).notNull().defaultNow(),
  processorId: text("processor_id").notNull(), // Which processor handled this
  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow()
});

// Insert schemas with validation
export const insertOutboxMessageSchema = createInsertSchema(outboxMessagesTable).omit({
  id: true,
  processedOnUtc: true,
  createdAt: true,
  updatedAt: true
});

export const insertProcessedEventSchema = createInsertSchema(processedEventsTable).omit({
  id: true,
  processedAt: true,
  createdAt: true,
  updatedAt: true
});

// Type inference
export type OutboxMessage = typeof outboxMessagesTable.$inferSelect;
export type InsertOutboxMessage = typeof outboxMessagesTable.$inferInsert;
export type ProcessedEvent = typeof processedEventsTable.$inferSelect;
export type InsertProcessedEvent = typeof processedEventsTable.$inferInsert;
