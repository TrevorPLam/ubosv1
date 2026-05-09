/**
 * @file        lib/db/src/schema/knowledge-rls.ts
 * @module      Database / Schema / Knowledge / RLS
 * @purpose     Row Level Security policies for knowledge management tables
 *
 * @ai_instructions
 *   - Follow the same pattern as work-rls.ts and chat-rls.ts
 *   - Create RLS policies for all knowledge tables
 *   - Use tenant isolation policies from helpers.ts
 *   - Include enable, create, and drop policy helpers
 *
 * @exports     RLS policy arrays for knowledge tables
 * @imports     drizzle-orm/sql, ./helpers
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { sql } from "drizzle-orm";
import { rlsPolicies } from "./helpers";

// List of all knowledge tables that need RLS policies
export const KNOWLEDGE_TABLES = [
  "knowledge_entries",
  "knowledge_versions", 
  "certification_records"
] as const;

/**
 * Enable FORCE ROW LEVEL SECURITY on all knowledge tables
 */
export const enableKnowledgeRls = KNOWLEDGE_TABLES.map(table => 
  rlsPolicies.enableForceRls(table)
);

/**
 * Create tenant isolation policies for all knowledge tables
 * Each table gets a single policy that handles all operations
 */
export const createKnowledgeTenantPolicies = KNOWLEDGE_TABLES.map(table =>
  rlsPolicies.tenantIsolationPolicy(table, `${table}_tenant_isolation`)
);

/**
 * Create detailed tenant isolation policies for each operation type
 * Use these when you need different policies for different operations
 */
export const createKnowledgeTenantPoliciesDetailed = KNOWLEDGE_TABLES.reduce((acc, table) => {
  const policies = rlsPolicies.tenantIsolationPolicies(table, `${table}_tenant`);
  return {
    ...acc,
    [table]: policies
  };
}, {} as Record<string, ReturnType<typeof rlsPolicies.tenantIsolationPolicies>>);

/**
 * Complete RLS setup for knowledge tables
 * This includes both enabling RLS and creating tenant isolation policies
 */
export const knowledgeTableRlsSetup = {
  knowledge_entries: [
    rlsPolicies.enableForceRls("knowledge_entries"),
    rlsPolicies.tenantIsolationPolicy("knowledge_entries")
  ],
  
  knowledge_versions: [
    rlsPolicies.enableForceRls("knowledge_versions"),
    rlsPolicies.tenantIsolationPolicy("knowledge_versions")
  ],
  
  certification_records: [
    rlsPolicies.enableForceRls("certification_records"),
    rlsPolicies.tenantIsolationPolicy("certification_records")
  ]
};

/**
 * Drop all knowledge RLS policies
 * Use this for cleanup or migration rollback
 */
export const dropKnowledgeRls = KNOWLEDGE_TABLES.map(table =>
  rlsPolicies.dropTenantPolicies(table, `${table}_tenant`)
);
