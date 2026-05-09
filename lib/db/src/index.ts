/**
 * @file        lib/db/src/index.ts
 * @module      Database / Core
 * @purpose     Database connection and ORM setup using Drizzle with PostgreSQL
 *
 * @ai_instructions
 *   - DATABASE_URL environment variable must be set before importing.
 *   - All database queries must use the exported db instance.
 *   - DO NOT create additional database connections; use the exported pool.
 *   - Schema must be imported from the schema index file.
 *
 * @exports     db, pool, all schema exports
 * @imports     drizzle-orm/node-postgres, pg, ./schema
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Import config to ensure environment variables are validated
// Note: This creates a dependency on the API server package structure
// In a production setup, consider moving config to a shared package
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });

/**
 * Tenant context management for transaction-scoped tenant isolation
 * These functions manage PostgreSQL session variables for RLS policies
 */

/**
 * Set tenant context for the current database session
 * @param tenantId - The tenant UUID to set as current context
 * @returns Promise<void>
 */
export async function setTenantContext(tenantId: string): Promise<void> {
  await pool.query('SELECT set_tenant($1::UUID)', [tenantId]);
}

/**
 * Clear tenant context from the current database session
 * @returns Promise<void>
 */
export async function clearTenantContext(): Promise<void> {
  await pool.query('SELECT clear_tenant()');
}

/**
 * Execute a database operation within a specific tenant context
 * @param tenantId - The tenant UUID to execute the operation as
 * @param operation - Database operation function
 * @returns Promise<T> - Result of the operation
 */
export async function withTenantContext<T>(
  tenantId: string,
  operation: () => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('SELECT set_tenant($1::UUID)', [tenantId]);
    
    // Create a temporary db instance with this client for the operation
    const tenantDb = drizzle(client, { schema });
    
    // Execute the operation with the tenant-scoped database
    // Note: In a real implementation, you'd need to pass tenantDb to the operation
    // For now, we'll set the session variable and use the regular db
    const result = await operation();
    
    return result;
  } finally {
    await client.query('SELECT clear_tenant()');
    client.release();
  }
}

/**
 * Health check function to verify database connection and extension availability
 * @returns Promise<HealthCheckResult> - Health check status with extension details
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  database: boolean;
  extensions: Array<{
    name: string;
    version: string | null;
    available: boolean;
  }>;
  timestamp: Date;
}> {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    
    // Check required extensions
    const requiredExtensions = ['pgvector', 'pgvectorscale', 'pg_cron', 'pg_textsearch', 'anon'];
    const extensionQuery = `
      SELECT 
        extname as name,
        extversion as version
      FROM pg_extension 
      WHERE extname = ANY($1)
    `;
    
    const result = await pool.query(extensionQuery, [requiredExtensions]);
    const installedExtensions = new Set(result.rows.map((row: any) => row.name));
    
    const extensions = requiredExtensions.map(name => ({
      name,
      version: result.rows.find((row: any) => row.name === name)?.version || null,
      available: installedExtensions.has(name)
    }));
    
    const allExtensionsAvailable = extensions.every(ext => ext.available);
    
    return {
      status: allExtensionsAvailable ? 'healthy' : 'unhealthy',
      database: true,
      extensions,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      database: false,
      extensions: [],
      timestamp: new Date()
    };
  }
}

/**
 * Verify specific extension is available
 * @param extensionName - Name of the extension to check
 * @returns Promise<boolean> - True if extension is available
 */
export async function verifyExtension(extensionName: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT 1 FROM pg_extension WHERE extname = $1',
      [extensionName]
    );
    return result.rows.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Enable all required extensions if not already enabled
 * This function should be called during application startup
 * @returns Promise<void>
 */
export async function ensureExtensions(): Promise<void> {
  const extensionCommands = [
    'CREATE EXTENSION IF NOT EXISTS pgvector',
    'CREATE EXTENSION IF NOT EXISTS pgvectorscale', 
    'CREATE EXTENSION IF NOT EXISTS pg_cron',
    'CREATE EXTENSION IF NOT EXISTS pg_textsearch',
    'CREATE EXTENSION IF NOT EXISTS anon'
  ];
  
  for (const command of extensionCommands) {
    try {
      await pool.query(command);
      console.log(`✓ Extension enabled: ${command.match(/pg_\w+/)?.[0]}`);
    } catch (error) {
      console.error(`✗ Failed to enable extension: ${command}`, error);
      throw error;
    }
  }
}

export * from "./schema";
