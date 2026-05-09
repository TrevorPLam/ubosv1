/**
 * @file        lib/db/src/schema/helpers.ts
 * @module      Database / Schema / Helpers
 * @purpose     Common schema utilities for tenant isolation and RLS policies
 *
 * @ai_instructions
 *   - This file provides reusable utilities for tenant-aware schema creation.
 *   - All tenant-scoped tables should use the tenantColumn helper.
 *   - RLS policy helpers ensure consistent policy creation across all tables.
 *   - DO NOT modify these helpers without updating all dependent tables.
 *
 * @exports     tenant column helper, RLS policy generators, index helpers
 * @imports     drizzle-orm/pg-core, drizzle-orm/sql
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { uuid, index, pgTable } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Standard tenant_id column definition
 * Use this helper to ensure consistent tenant column across all tables
 */
export const tenantColumn = uuid("tenant_id").notNull();

/**
 * Helper to create tenant-aware tables with standard tenant column
 * Note: Each table should define its own indexes based on query patterns
 * @param columns - Table columns (tenant_id will be added automatically)
 * @returns Table columns object with tenant_id included
 */
export function withTenantColumn(columns: Record<string, any>) {
  return {
    ...columns,
    tenant_id: tenantColumn,
  };
}

/**
 * RLS policy helpers for consistent tenant isolation
 */
export const rlsPolicies = {
  /**
   * Enable FORCE ROW LEVEL SECURITY on a table
   * This prevents table owners from bypassing RLS policies
   */
  enableForceRls: (tableName: string) => sql`
    ALTER TABLE ${sql.raw(tableName)} ENABLE ROW LEVEL SECURITY;
    ALTER TABLE ${sql.raw(tableName)} FORCE ROW LEVEL SECURITY;
  `,

  /**
   * Create tenant isolation policy for all operations (SELECT, INSERT, UPDATE, DELETE)
   * @param tableName - Table name
   * @param policyName - Policy name (defaults to tenant_isolation)
   */
  tenantIsolationPolicy: (
    tableName: string,
    policyName: string = "tenant_isolation"
  ) => sql`
    CREATE POLICY ${sql.raw(policyName)} ON ${sql.raw(tableName)}
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());
  `,

  /**
   * Create separate policies for each operation type
   * Useful when you need different policies for different operations
   */
  tenantIsolationPolicies: (
    tableName: string,
    policyPrefix: string = "tenant_isolation"
  ) => ({
    select: sql`
      CREATE POLICY ${sql.raw(`${policyPrefix}_select`)} ON ${sql.raw(tableName)}
      FOR SELECT
      USING (tenant_id = current_tenant_id());
    `,
    insert: sql`
      CREATE POLICY ${sql.raw(`${policyPrefix}_insert`)} ON ${sql.raw(tableName)}
      FOR INSERT
      WITH CHECK (tenant_id = current_tenant_id());
    `,
    update: sql`
      CREATE POLICY ${sql.raw(`${policyPrefix}_update`)} ON ${sql.raw(tableName)}
      FOR UPDATE
      USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
    `,
    delete: sql`
      CREATE POLICY ${sql.raw(`${policyPrefix}_delete`)} ON ${sql.raw(tableName)}
      FOR DELETE
      USING (tenant_id = current_tenant_id());
    `,
  }),

  /**
   * Drop all tenant isolation policies for a table
   */
  dropTenantPolicies: (
    tableName: string,
    policyPrefix: string = "tenant_isolation"
  ) => sql`
    DROP POLICY IF EXISTS ${sql.raw(`${policyPrefix}_select`)} ON ${sql.raw(tableName)};
    DROP POLICY IF EXISTS ${sql.raw(`${policyPrefix}_insert`)} ON ${sql.raw(tableName)};
    DROP POLICY IF EXISTS ${sql.raw(`${policyPrefix}_update`)} ON ${sql.raw(tableName)};
    DROP POLICY IF EXISTS ${sql.raw(`${policyPrefix}_delete`)} ON ${sql.raw(tableName)};
    DROP POLICY IF EXISTS ${sql.raw(policyPrefix)} ON ${sql.raw(tableName)};
  `,
};

/**
 * Index helpers for optimal RLS performance
 */
export const indexHelpers = {
  /**
   * Create composite index with tenant_id as first column
   * This is crucial for RLS performance as tenant_id appears in all queries
   */
  tenantCompositeIndex: (
    tableName: string,
    columns: string[],
    indexName?: string
  ) => {
    const name = indexName || `idx_${tableName}_tenant_${columns.join("_")}`;
    const columnList = ["tenant_id", ...columns].join(", ");
    return sql`CREATE INDEX ${sql.raw(name)} ON ${sql.raw(tableName)} (${sql.raw(columnList)})`;
  },

  /**
   * Create primary key with tenant_id prefix for better partitioning
   * @param tableName - Table name
   * @param idColumn - Primary key column name (defaults to "id")
   */
  tenantPrimaryKey: (tableName: string, idColumn: string = "id") => sql`
    ALTER TABLE ${sql.raw(tableName)} 
    ADD PRIMARY KEY (tenant_id, ${sql.raw(idColumn)});
  `,
};

/**
 * Migration helper to apply RLS to existing tables
 */
export const migrationHelpers = {
  /**
   * Add tenant_id column to existing table
   */
  addTenantColumn: (tableName: string) => sql`
    ALTER TABLE ${sql.raw(tableName)} 
    ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
  `,

  /**
   * Create foreign key constraint to tenants table
   */
  addTenantForeignKey: (tableName: string) => sql`
    ALTER TABLE ${sql.raw(tableName)} 
    ADD CONSTRAINT ${sql.raw(`fk_${tableName}_tenant`)}
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE;
  `,

  /**
   * Full RLS setup for existing table
   */
  setupRlsForTable: (tableName: string) => [
    sql`
      ALTER TABLE ${sql.raw(tableName)} 
      ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    `,
    sql`
      ALTER TABLE ${sql.raw(tableName)} 
      ADD CONSTRAINT IF NOT EXISTS ${sql.raw(`fk_${tableName}_tenant`)}
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      ON DELETE CASCADE;
    `,
    rlsPolicies.enableForceRls(tableName),
    rlsPolicies.tenantIsolationPolicy(tableName),
    indexHelpers.tenantCompositeIndex(tableName, []),
  ],
};
