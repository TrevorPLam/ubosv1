/**
 * @file        lib/db/src/schema/billing.ts
 * @module      Database / Schema / Billing
 * @purpose     Billing and token budget enforcement schema for cost governance
 *
 * @ai_instructions
 *   - Follow multi-tenant patterns using tenantColumn from helpers.ts
 *   - Apply RLS policies for tenant isolation
 *   - Use pgEnum for status fields with documented state transitions
 *   - Include proper indexes for performance with RLS
 *   - Follow existing schema patterns from agents.ts and tenants.ts
 *   - Implement atomic increment patterns for budget tracking
 *
 * @exports     tenant_token_budgets, token_usage_events tables and types
 * @imports     drizzle-orm/pg-core, drizzle-zod, zod, ./helpers
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
  pgEnum,
  index,
  decimal,
  boolean,
  unique
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenantColumn } from "./helpers";

// Budget status enum for tenant token budgets
export const budgetStatusEnum = pgEnum("budget_status", [
  "active",
  "suspended",
  "grace_period",
  "exceeded"
]);

// Usage event type enum for detailed token attribution
export const usageEventTypeEnum = pgEnum("usage_event_type", [
  "prompt",
  "tool",
  "memory",
  "response",
  "embedding"
]);

/**
 * Tenant token budgets table - Per-tenant budget configuration and tracking
 */
export const tenantTokenBudgetsTable = pgTable("tenant_token_budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantColumn.notNull().unique(),
  monthlyTokenLimit: integer("monthly_token_limit").notNull().default(100000), // Default 100k tokens
  currentUsage: integer("current_usage").notNull().default(0),
  resetDate: timestamp("reset_date", { mode: "string" }).notNull(), // Next reset date (monthly)
  status: budgetStatusEnum("status").default("active").notNull(),
  gracePeriodEndsAt: timestamp("grace_period_ends_at", { mode: "string" }), // When grace period ends
  alertThresholdPercent: integer("alert_threshold_percent").default(80), // Alert at 80% usage
  hardLimitEnabled: boolean("hard_limit_enabled").default(true).notNull(), // Enforce hard limits
  metadata: jsonb("metadata"), // Additional budget configuration
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull()
}, (table) => ({
  // Performance indexes for RLS and common queries
  tenantIdx: index("idx_tenant_token_budgets_tenant").on(table.tenantId),
  statusIdx: index("idx_tenant_token_budgets_status").on(table.status),
  resetDateIdx: index("idx_tenant_token_budgets_reset_date").on(table.resetDate),
}));

/**
 * Token usage events table - Detailed logging of all token consumption for analytics
 */
export const tokenUsageEventsTable = pgTable("token_usage_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantColumn.notNull(),
  eventId: text("event_id").notNull().unique(), // Unique event identifier for idempotency
  timestamp: timestamp("timestamp", { mode: "string" }).defaultNow().notNull(),
  model: text("model").notNull(), // e.g., "gpt-4", "claude-3-sonnet"
  eventType: usageEventTypeEnum("event_type").notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  totalTokens: integer("total_tokens").notNull(),
  costEstimate: decimal("cost_estimate", { precision: 10, scale: 6 }).default("0.000000"),
  agentRunId: uuid("agent_run_id"), // Reference to agent run if applicable
  messageId: uuid("message_id"), // Reference to chat message if applicable
  userId: text("user_id"), // User who initiated the request
  metadata: jsonb("metadata"), // Additional event metadata (prompt length, etc.)
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull()
}, (table) => ({
  // Performance indexes for RLS and analytics queries
  tenantIdx: index("idx_token_usage_events_tenant").on(table.tenantId),
  tenantTimestampIdx: index("idx_token_usage_events_tenant_timestamp").on(table.tenantId, table.timestamp),
  eventIdIdx: index("idx_token_usage_events_event_id").on(table.eventId),
  modelIdx: index("idx_token_usage_events_model").on(table.model),
  eventTypeIdx: index("idx_token_usage_events_event_type").on(table.eventType),
  agentRunIdx: index("idx_token_usage_events_agent_run").on(table.agentRunId),
  messageIdx: index("idx_token_usage_events_message").on(table.messageId),
  userIdIdx: index("idx_token_usage_events_user").on(table.userId),
}));

// Insert schemas with validation
export const insertTenantTokenBudgetSchema = createInsertSchema(tenantTokenBudgetsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentUsage: true
});

export const insertTokenUsageEventSchema = createInsertSchema(tokenUsageEventsTable).omit({
  id: true,
  timestamp: true,
  totalTokens: true,
  createdAt: true
});

// Type inference
export type TenantTokenBudget = typeof tenantTokenBudgetsTable.$inferSelect;
export type InsertTenantTokenBudget = typeof tenantTokenBudgetsTable.$inferInsert;
export type TokenUsageEvent = typeof tokenUsageEventsTable.$inferSelect;
export type InsertTokenUsageEvent = typeof tokenUsageEventsTable.$inferInsert;

// Zod schemas for validation
export const budgetUpdateSchema = z.object({
  monthlyTokenLimit: z.number().int().positive().optional(),
  alertThresholdPercent: z.number().int().min(0).max(100).optional(),
  hardLimitEnabled: z.boolean().optional(),
  status: z.enum(budgetStatusEnum.enumValues).optional(),
  gracePeriodEndsAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const tokenUsageRecordSchema = z.object({
  tenantId: z.string().uuid(),
  eventId: z.string(),
  model: z.string(),
  eventType: z.enum(usageEventTypeEnum.enumValues),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  costEstimate: z.number().optional(),
  agentRunId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});
