/**
 * @file        lib/db/src/schema/agents.ts
 * @module      Database / Schema / Agents
 * @purpose     Agent orchestration schema for AI agent management and execution tracking
 *
 * @ai_instructions
 *   - Follow multi-tenant patterns using tenantColumn from helpers.ts
 *   - Apply RLS policies for tenant isolation
 *   - Use pgEnum for status fields with documented state transitions
 *   - Include proper indexes for performance with RLS
 *   - Follow existing schema patterns from outbox.ts and tenants.ts
 *
 * @exports     agents, agent_runs, tool_calls, mcp_server_bindings tables and types
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

// Agent status enum with documented state transitions
// Valid transitions: idle -> thinking -> running-tool OR awaiting-approval -> idle OR error
export const agentStatusEnum = pgEnum("agent_status", [
  "idle",
  "thinking", 
  "running-tool",
  "awaiting-approval",
  "error"
]);

// Agent run status enum
export const agentRunStatusEnum = pgEnum("agent_run_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled"
]);

// Tool call status enum
export const toolCallStatusEnum = pgEnum("tool_call_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "timeout"
]);

// MCP server trust tier enum for access control
export const mcpTrustTierEnum = pgEnum("mcp_trust_tier", [
  "untrusted",
  "basic", 
  "trusted",
  "privileged"
]);

/**
 * Agents table - Core agent definitions and configuration
 */
export const agentsTable = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantColumn.notNull(),
  name: text("name").notNull(),
  model: text("model").notNull(), // e.g., "gpt-4", "claude-3-sonnet"
  systemPrompt: text("system_prompt").notNull(),
  status: agentStatusEnum("status").default("idle").notNull(),
  memoryUsageMb: integer("memory_usage_mb").default(0),
  tokenCount: integer("token_count").default(0),
  lastHeartbeatAt: timestamp("last_heartbeat_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull()
}, (table) => ({
  // Composite indexes for RLS performance
  tenantIdx: index("idx_agents_tenant").on(table.tenantId),
  tenantStatusIdx: index("idx_agents_tenant_status").on(table.tenantId, table.status),
  tenantNameIdx: index("idx_agents_tenant_name").on(table.tenantId, table.name),
}));

/**
 * Agent runs table - Individual execution instances of agents
 */
export const agentRunsTable = pgTable("agent_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id").notNull().references(() => agentsTable.id, { onDelete: "cascade" }),
  tenantId: tenantColumn.notNull(),
  taskId: text("task_id"), // Optional reference to external task system
  status: agentRunStatusEnum("status").default("pending").notNull(),
  startedAt: timestamp("started_at", { mode: "string" }),
  completedAt: timestamp("completed_at", { mode: "string" }),
  tokenUsageInput: integer("token_usage_input").default(0),
  tokenUsageOutput: integer("token_usage_output").default(0),
  costEstimate: decimal("cost_estimate", { precision: 10, scale: 6 }).default("0.000000"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull()
}, (table) => ({
  // Performance indexes for RLS and common queries
  tenantIdx: index("idx_agent_runs_tenant").on(table.tenantId),
  agentTenantIdx: index("idx_agent_runs_agent_tenant").on(table.agentId, table.tenantId),
  statusTenantIdx: index("idx_agent_runs_status_tenant").on(table.status, table.tenantId),
  createdAtIdx: index("idx_agent_runs_created_at").on(table.createdAt),
}));

/**
 * Tool calls table - Individual tool execution attempts by agents
 */
export const toolCallsTable = pgTable("tool_calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentRunId: uuid("agent_run_id").notNull().references(() => agentRunsTable.id, { onDelete: "cascade" }),
  tenantId: tenantColumn.notNull(),
  mcpServerId: uuid("mcp_server_id"), // References MCP server configuration
  toolName: text("tool_name").notNull(),
  args: jsonb("args").notNull(), // Tool arguments
  result: jsonb("result"), // Tool execution result
  status: toolCallStatusEnum("status").default("pending").notNull(),
  startedAt: timestamp("started_at", { mode: "string" }),
  finishedAt: timestamp("finished_at", { mode: "string" }),
  errorMessage: text("error_message"),
  executionTimeMs: integer("execution_time_ms"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull()
}, (table) => ({
  // Performance indexes
  tenantIdx: index("idx_tool_calls_tenant").on(table.tenantId),
  runTenantIdx: index("idx_tool_calls_run_tenant").on(table.agentRunId, table.tenantId),
  statusTenantIdx: index("idx_tool_calls_status_tenant").on(table.status, table.tenantId),
  toolNameIdx: index("idx_tool_calls_tool_name").on(table.toolName),
}));

/**
 * MCP server bindings table - Links agents to specific MCP servers with trust levels
 */
export const mcpServerBindingsTable = pgTable("mcp_server_bindings", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id").notNull().references(() => agentsTable.id, { onDelete: "cascade" }),
  tenantId: tenantColumn.notNull(),
  mcpServerId: uuid("mcp_server_id").notNull(),
  trustTier: mcpTrustTierEnum("trust_tier").default("basic").notNull(),
  allowedTools: text("allowed_tools").array(), // Empty array means all tools allowed
  deniedTools: text("denied_tools").array(), // Explicit deny list
  maxCallsPerMinute: integer("max_calls_per_minute").default(10),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull()
}, (table) => ({
  // Unique constraint: one agent can only have one binding per MCP server
  agentServerUniqueIdx: unique("idx_mcp_bindings_agent_server_unique").on(table.agentId, table.mcpServerId),
  tenantIdx: index("idx_mcp_bindings_tenant").on(table.tenantId),
  enabledIdx: index("idx_mcp_bindings_enabled").on(table.enabled),
}));

// Insert schemas with validation
export const insertAgentSchema = createInsertSchema(agentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastHeartbeatAt: true
});

export const insertAgentRunSchema = createInsertSchema(agentRunsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  startedAt: true,
  completedAt: true
});

export const insertToolCallSchema = createInsertSchema(toolCallsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  startedAt: true,
  finishedAt: true
});

export const insertMcpServerBindingSchema = createInsertSchema(mcpServerBindingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Type inference
export type Agent = typeof agentsTable.$inferSelect;
export type InsertAgent = typeof agentsTable.$inferInsert;
export type AgentRun = typeof agentRunsTable.$inferSelect;
export type InsertAgentRun = typeof agentRunsTable.$inferInsert;
export type ToolCall = typeof toolCallsTable.$inferSelect;
export type InsertToolCall = typeof toolCallsTable.$inferInsert;
export type McpServerBinding = typeof mcpServerBindingsTable.$inferSelect;
export type InsertMcpServerBinding = typeof mcpServerBindingsTable.$inferInsert;
