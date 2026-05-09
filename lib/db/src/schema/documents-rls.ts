/**
 * @file        lib/db/src/schema/documents-rls.ts
 * @module      Database / Schema / Documents / RLS
 * @purpose     Row Level Security policies for document management tables
 *
 * @ai_instructions
 *   - Follow the same pattern as work-rls.ts and chat-rls.ts
 *   - Create RLS policies for all document tables
 *   - Use tenant isolation policies from helpers.ts
 *   - Include enable, create, and drop policy helpers
 *
 * @exports     RLS policy arrays for document tables
 * @imports     drizzle-orm/sql, ./helpers
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { sql } from "drizzle-orm";
import { rlsPolicies } from "./helpers";

// List of all document tables that need RLS policies
export const DOCUMENT_TABLES = [
  "documents",
  "document_versions", 
  "storage_references",
  "entity_documents"
] as const;

/**
 * Enable FORCE ROW LEVEL SECURITY on all document tables
 */
export const enableDocumentsRls = DOCUMENT_TABLES.map(table => 
  rlsPolicies.enableForceRls(table)
);

/**
 * Create tenant isolation policies for all document tables
 * Each table gets a single policy that handles all operations
 */
export const createDocumentsTenantPolicies = DOCUMENT_TABLES.map(table =>
  rlsPolicies.tenantIsolationPolicy(table, `${table}_tenant_isolation`)
);

/**
 * Create detailed tenant isolation policies for each operation type
 * Use these when you need different policies for different operations
 */
export const createDocumentsTenantPoliciesDetailed = DOCUMENT_TABLES.reduce((acc, table) => {
  const policies = rlsPolicies.tenantIsolationPolicies(table, `${table}_tenant`);
  return {
    ...acc,
    [table]: policies
  };
}, {} as Record<string, ReturnType<typeof rlsPolicies.tenantIsolationPolicies>>);

/**
 * Complete RLS setup for document tables
 * This includes both enabling RLS and creating tenant isolation policies
 */
export const documentsTableRlsSetup = {
  documents: [
    rlsPolicies.enableForceRls("documents"),
    rlsPolicies.tenantIsolationPolicy("documents")
  ],
  
  document_versions: [
    rlsPolicies.enableForceRls("document_versions"),
    rlsPolicies.tenantIsolationPolicy("document_versions")
  ],
  
  storage_references: [
    rlsPolicies.enableForceRls("storage_references"),
    rlsPolicies.tenantIsolationPolicy("storage_references")
  ],
  
  entity_documents: [
    rlsPolicies.enableForceRls("entity_documents"),
    rlsPolicies.tenantIsolationPolicy("entity_documents")
  ]
};

/**
 * Drop all document RLS policies
 * Use this for cleanup or migration rollback
 */
export const dropDocumentsRls = DOCUMENT_TABLES.map(table =>
  rlsPolicies.dropTenantPolicies(table, `${table}_tenant`)
);
