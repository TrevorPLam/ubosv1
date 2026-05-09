/**
 * @file        lib/db/src/schema/approvals.ts
 * @module      Database / Schema / Approvals
 * @purpose     Human-in-the-loop approval workflow schema for agent governance
 *
 * @ai_instructions
 *   - Follow multi-tenant patterns using tenantColumn from helpers.ts
 *   - Apply RLS policies for tenant isolation
 *   - Use pgEnum for status fields with documented state transitions
 *   - Include proper indexes for performance with RLS
 *   - Follow existing schema patterns from agents.ts and outbox.ts
 *
 * @exports     approval_requests, approval_decisions tables and types
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
  jsonb,
  pgEnum,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenantColumn } from "./helpers";

// Approval request status enum
// Valid transitions: pending -> approved OR rejected
export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved", 
  "rejected",
  "expired"
]);

// Approval decision enum
export const approvalDecisionEnum = pgEnum("approval_decision", [
  "approved",
  "rejected"
]);

// Approval priority enum for urgency levels
export const approvalPriorityEnum = pgEnum("approval_priority", [
  "low",
  "medium",
  "high",
  "critical"
]);

/**
 * Approval requests table - Requests for human approval of agent actions
 */
export const approvalRequestsTable = pgTable("approval_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentRunId: uuid("agent_run_id").notNull(), // References agent_runs table
  tenantId: tenantColumn.notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: approvalStatusEnum("status").default("pending").notNull(),
  priority: approvalPriorityEnum("priority").default("medium").notNull(),
  requestContext: jsonb("request_context"), // Additional context for the approval
  requiredBy: timestamp("required_by", { mode: "string" }), // Deadline for approval
  expiresAt: timestamp("expires_at", { mode: "string" }), // When request expires
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { mode: "string" }) // When decision was made
}, (table) => ({
  // Performance indexes for RLS and common queries
  tenantIdx: index("idx_approval_requests_tenant").on(table.tenantId),
  statusTenantIdx: index("idx_approval_requests_status_tenant").on(table.status, table.tenantId),
  priorityTenantIdx: index("idx_approval_requests_priority_tenant").on(table.priority, table.tenantId),
  agentRunIdx: index("idx_approval_requests_agent_run").on(table.agentRunId),
  createdAtIdx: index("idx_approval_requests_created_at").on(table.createdAt),
  expiresAtIdx: index("idx_approval_requests_expires_at").on(table.expiresAt),
}));

/**
 * Approval decisions table - Records of human decisions on approval requests
 */
export const approvalDecisionsTable = pgTable("approval_decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  approvalRequestId: uuid("approval_request_id").notNull().references(() => approvalRequestsTable.id, { onDelete: "cascade" }),
  tenantId: tenantColumn.notNull(),
  decision: approvalDecisionEnum("decision").notNull(),
  decidedBy: text("decided_by").notNull(), // User ID who made the decision
  decidedByName: text("decided_by_name"), // Display name of decision maker
  comment: text("comment"), // Optional comment explaining the decision
  decisionContext: jsonb("decision_context"), // Additional context at decision time
  decidedAt: timestamp("decided_at", { mode: "string" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull()
}, (table) => ({
  // Performance indexes
  tenantIdx: index("idx_approval_decisions_tenant").on(table.tenantId),
  requestIdx: index("idx_approval_decisions_request").on(table.approvalRequestId),
  decidedByIdx: index("idx_approval_decisions_decided_by").on(table.decidedBy),
  decidedAtIdx: index("idx_approval_decisions_decided_at").on(table.decidedAt),
}));

// Insert schemas with validation
export const insertApprovalRequestSchema = createInsertSchema(approvalRequestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true
});

export const insertApprovalDecisionSchema = createInsertSchema(approvalDecisionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  decidedAt: true
});

// Type inference
export type ApprovalRequest = typeof approvalRequestsTable.$inferSelect;
export type InsertApprovalRequest = typeof approvalRequestsTable.$inferInsert;
export type ApprovalDecision = typeof approvalDecisionsTable.$inferSelect;
export type InsertApprovalDecision = typeof approvalDecisionsTable.$inferInsert;
