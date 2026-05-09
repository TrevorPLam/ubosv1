/**
 * @file        lib/db/src/schema/integrations.ts
 * @module      Database / Schema / Integrations
 * @purpose     MCP server and tool integration schema for AI agent tool orchestration
 *
 * @ai_instructions
 *   - Follow multi-tenant patterns using tenantColumn from helpers.ts
 *   - Apply RLS policies for tenant isolation
 *   - Use pgEnum for status and trust tier fields
 *   - Include proper indexes for performance with RLS
 *   - Follow existing schema patterns from agents.ts and tenants.ts
 *
 * @exports     mcp_servers, mcp_tools tables and types
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
  index,
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenantColumn } from "./helpers";

// MCP Server transport type enum
export const mcpTransportTypeEnum = pgEnum("mcp_transport_type", [
  "stdio",
  "http",
  "sse"
]);

// MCP Server trust tier enum - using different values to avoid conflict with agents.ts
export const mcpServerTrustTierEnum = pgEnum("mcp_server_trust_tier", [
  "trusted",
  "restricted"
]);

// MCP Server status enum
export const mcpServerStatusEnum = pgEnum("mcp_server_status", [
  "active",
  "inactive",
  "error"
]);

// MCP Tool status enum
export const mcpToolStatusEnum = pgEnum("mcp_tool_status", [
  "available",
  "disabled",
  "error"
]);

// MCP Servers table - stores registered MCP server configurations
export const mcpServers = pgTable("mcp_servers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Server identification
  name: text("name").notNull(),
  description: text("description").default(""),
  
  // Connection configuration
  transportType: mcpTransportTypeEnum("transport_type").notNull(),
  endpointUrl: text("endpoint_url"), // URL for HTTP/SSE transport
  command: text("command"), // Command for stdio transport
  args: jsonb("args").$type<string[]>(), // Arguments for stdio transport
  env: jsonb("env").$type<Record<string, string>>(), // Environment variables
  
  // Security and trust
  trustTier: mcpServerTrustTierEnum("trust_tier").notNull().default("restricted"),
  enableDnsRebindingProtection: boolean("enable_dns_rebinding_protection").notNull().default(true),
  hostHeaderValidation: boolean("host_header_validation").notNull().default(true),
  
  // Status and health
  status: mcpServerStatusEnum("status").notNull().default("inactive"),
  lastHealthCheckAt: timestamp("last_health_check_at"),
  errorMessage: text("error_message"),
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  // Composite indexes for RLS performance
  tenantIdIdx: index("mcp_servers_tenant_id_idx").on(table.tenant_id),
  tenantStatusIdx: index("mcp_servers_tenant_status_idx").on(table.tenant_id, table.status),
  tenantTrustIdx: index("mcp_servers_tenant_trust_idx").on(table.tenant_id, table.trustTier),
}));

// MCP Tools table - stores discovered tools from MCP servers
export const mcpTools = pgTable("mcp_tools", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Server relationship
  serverId: uuid("server_id").notNull().references(() => mcpServers.id, { onDelete: "cascade" }),
  
  // Tool identification
  name: text("name").notNull(),
  description: text("description").default(""),
  
  // Tool schema and configuration
  inputSchema: jsonb("input_schema").$type<Record<string, unknown>>().notNull(),
  
  // Security and access
  trustTier: mcpServerTrustTierEnum("trust_tier").notNull().default("restricted"),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  
  // Status
  status: mcpToolStatusEnum("status").notNull().default("available"),
  errorMessage: text("error_message"),
  
  // Usage tracking
  callCount: text("call_count").notNull().default("0"),
  lastCalledAt: timestamp("last_called_at"),
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  // Composite indexes for RLS performance
  tenantIdIdx: index("mcp_tools_tenant_id_idx").on(table.tenant_id),
  serverIdx: index("mcp_tools_server_id_idx").on(table.serverId),
  tenantServerIdx: index("mcp_tools_tenant_server_idx").on(table.tenant_id, table.serverId),
  tenantStatusIdx: index("mcp_tools_tenant_status_idx").on(table.tenant_id, table.status),
  nameIdx: index("mcp_tools_name_idx").on(table.name),
}));

// Note: RLS policies should be applied via migration scripts
// See helpers.ts for rlsPolicies helper functions

// Zod schemas for validation
export const insertMCPServerSchema = createInsertSchema(mcpServers).omit({
  id: true,
  tenantId: true,
  status: true,
  lastHealthCheckAt: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true
});

export const insertMCPToolSchema = createInsertSchema(mcpTools).omit({
  id: true,
  tenantId: true,
  status: true,
  errorMessage: true,
  callCount: true,
  lastCalledAt: true,
  createdAt: true,
  updatedAt: true
});

// Type exports
export type MCPServer = typeof mcpServers.$inferSelect;
export type NewMCPServer = typeof mcpServers.$inferInsert;
export type MCPTool = typeof mcpTools.$inferSelect;
export type NewMCPTool = typeof mcpTools.$inferInsert;
