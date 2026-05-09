/**
 * @file        lib/db/src/schema/tenant-migration.ts
 * @module      Database / Schema / Migration
 * @purpose     Migration script to set up tenant infrastructure and RLS
 *
 * @ai_instructions
 *   - This migration creates the tenant infrastructure for multi-tenant isolation.
 *   - Run this migration after enabling extensions but before creating domain tables.
 *   - All subsequent table migrations should use the tenant helpers.
 *   - DO NOT modify this migration without updating all dependent migrations.
 *
 * @exports     Migration SQL statements for tenant setup
 * @imports     drizzle-orm/sql
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { sql } from "drizzle-orm";
import { tenantContextFunctions } from "./tenants";

/**
 * Complete tenant infrastructure migration
 * This includes tenant table creation and RLS function setup
 */
export const tenantInfrastructureMigration = sql`
  -- Create tenant tracking table
  CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(63) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  );

  -- Create index for subdomain lookups during authentication
  CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);

  -- Function to get current tenant from session variable
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

  -- Function to set current tenant (call at connection start)
  CREATE OR REPLACE FUNCTION set_tenant(p_tenant_id UUID) 
  RETURNS VOID 
  LANGUAGE plpgsql
  AS $$
  BEGIN
    PERFORM set_config('app.current_tenant', p_tenant_id::TEXT, false);
  END;
  $$;

  -- Function to clear tenant context
  CREATE OR REPLACE FUNCTION clear_tenant() 
  RETURNS VOID 
  LANGUAGE plpgsql
  AS $$
  BEGIN
    PERFORM set_config('app.current_tenant', '', false);
  END;
  $$;
`;

/**
 * Migration to add tenant infrastructure to existing tables
 * This should be run for each existing table that needs tenant isolation
 */
export const addTenantIsolationToTable = (tableName: string) => sql`
  -- Add tenant_id column if it doesn't exist
  ALTER TABLE ${sql.raw(tableName)} 
  ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

  -- Add foreign key constraint to tenants table
  ALTER TABLE ${sql.raw(tableName)} 
  ADD CONSTRAINT IF NOT EXISTS ${sql.raw(`fk_${tableName}_tenant`)}
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  ON DELETE CASCADE;

  -- Create tenant index for RLS performance
  CREATE INDEX IF NOT EXISTS ${sql.raw(`idx_${tableName}_tenant`)} 
  ON ${sql.raw(tableName)}(tenant_id);

  -- Enable Row Level Security
  ALTER TABLE ${sql.raw(tableName)} ENABLE ROW LEVEL SECURITY;
  ALTER TABLE ${sql.raw(tableName)} FORCE ROW LEVEL SECURITY;

  -- Create tenant isolation policy
  CREATE POLICY IF NOT EXISTS tenant_isolation ON ${sql.raw(tableName)}
  FOR ALL
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());
`;

/**
 * Helper to generate RLS policies for a new table
 * This should be used when creating new tenant-aware tables
 */
export const createTenantTableWithRLS = (
  tableName: string,
  tableDefinition: string,
  additionalIndexes: string[] = []
) => {
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_${tableName}_tenant ON ${tableName}(tenant_id);`,
    ...additionalIndexes,
  ].join('\n  ');

  return sql.raw(`
    -- Create table with tenant column
    ${tableDefinition}

    -- Create indexes for performance
    ${indexes}

    -- Enable Row Level Security
    ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
    ALTER TABLE ${tableName} FORCE ROW LEVEL SECURITY;

    -- Create tenant isolation policy
    CREATE POLICY tenant_isolation ON ${tableName}
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());
  `);
};

/**
 * Verification query to check tenant infrastructure is properly set up
 */
export const verifyTenantInfrastructure = sql`
  -- Check that tenants table exists
  SELECT 
    'tenants_table' as check_name,
    EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'tenants'
    ) as passed;

  -- Check that RLS functions exist
  SELECT 
    'rls_functions' as check_name,
    EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name IN ('current_tenant_id', 'set_tenant', 'clear_tenant')
    ) as passed;

  -- Check that current tenant function works
  SELECT 
    'current_tenant_function' as check_name,
    (SELECT current_tenant_id() IS NULL) as passed;
`;
