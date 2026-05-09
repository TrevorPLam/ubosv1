/**
 * @file        lib/db/src/schema/tenants.ts
 * @module      Database / Schema / Tenants
 * @purpose     Multi-tenant infrastructure with tenant tracking table
 *
 * @ai_instructions
 *   - This file defines the core tenant infrastructure for multi-tenant isolation.
 *   - All tables must reference this tenants table for tenant_id foreign keys.
 *   - RLS policies will be applied to enforce tenant isolation at database level.
 *   - DO NOT modify this schema without updating all dependent tables.
 *
 * @exports     tenants table, types, and helper functions
 * @imports     drizzle-orm/pg-core, drizzle-zod, zod
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Tenants table - Core multi-tenant infrastructure
 * Stores tenant information and serves as the foreign key reference
 * for all tenant-scoped tables in the system
 */
export const tenantsTable = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  subdomain: text("subdomain").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Index for subdomain lookups during authentication
  subdomainIdx: index("idx_tenants_subdomain").on(table.subdomain),
}));

/**
 * Types for tenant operations
 */
export type Tenant = typeof tenantsTable.$inferSelect;
export type InsertTenant = typeof tenantsTable.$inferInsert;

/**
 * Zod schemas for validation
 */
export const insertTenantSchema = createInsertSchema(tenantsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Session variable functions for tenant context
 * These functions will be used by RLS policies to determine current tenant
 */
export const tenantContextFunctions = {
  // Function to get current tenant from PostgreSQL session variable
  getCurrentTenant: `
    CREATE OR REPLACE FUNCTION current_tenant_id() 
    RETURNS UUID 
    LANGUAGE plpgsql 
    STABLE
    AS $$
    BEGIN
      -- Get tenant_id from session variable
      -- Returns NULL if not set (will deny all access)
      RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
    EXCEPTION 
      WHEN OTHERS THEN 
        RETURN NULL;
    END;
    $$;
  `,
  
  // Function to set current tenant (call at connection start)
  setTenant: `
    CREATE OR REPLACE FUNCTION set_tenant(p_tenant_id UUID) 
    RETURNS VOID 
    LANGUAGE plpgsql
    AS $$
    BEGIN
      PERFORM set_config('app.current_tenant', p_tenant_id::TEXT, false);
    END;
    $$;
  `,
  
  // Function to clear tenant context
  clearTenant: `
    CREATE OR REPLACE FUNCTION clear_tenant() 
    RETURNS VOID 
    LANGUAGE plpgsql
    AS $$
    BEGIN
      PERFORM set_config('app.current_tenant', '', false);
    END;
    $$;
  `,
};
