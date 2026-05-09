/**
 * @file        lib/db/src/schema/work-rls.ts
 * @module      Database / Schema / Work / RLS
 * @purpose     Row Level Security policies for work management tables
 *
 * @ai_instructions
 *   - Follow the same pattern as chat-rls.ts
 *   - Create RLS policies for all work tables
 *   - Use tenant isolation policies from helpers.ts
 *   - Include enable, create, and drop policy helpers
 *
 * @exports     RLS policy arrays for work tables
 * @imports     drizzle-orm/sql, ./helpers
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { sql } from "drizzle-orm";
import { rlsPolicies } from "./helpers";

// List of all work tables that need RLS policies
export const WORK_TABLES = [
  "projects",
  "tasks", 
  "task_comments",
  "task_dependencies",
  "project_templates",
  "template_tasks"
] as const;

/**
 * Enable FORCE ROW LEVEL SECURITY on all work tables
 */
export const enableWorkRls = WORK_TABLES.map(table => 
  rlsPolicies.enableForceRls(table)
);

/**
 * Create tenant isolation policies for all work tables
 * Each table gets a single policy that handles all operations
 */
export const createWorkTenantPolicies = WORK_TABLES.map(table =>
  rlsPolicies.tenantIsolationPolicy(table, `${table}_tenant_isolation`)
);

/**
 * Create detailed tenant isolation policies for each operation type
 * Use these when you need different policies for different operations
 */
export const createWorkTenantPoliciesDetailed = WORK_TABLES.reduce((acc, table) => {
  const policies = rlsPolicies.tenantIsolationPolicies(table, `${table}_tenant`);
  return {
    ...acc,
    [table]: policies
  };
}, {} as Record<string, ReturnType<typeof rlsPolicies.tenantIsolationPolicies>>);

/**
 * Complete RLS setup for work tables
 * This includes both enabling RLS and creating tenant isolation policies
 */
export const workTableRlsSetup = {
  projects: [
    rlsPolicies.enableForceRls("projects"),
    rlsPolicies.tenantIsolationPolicy("projects")
  ],
  
  tasks: [
    rlsPolicies.enableForceRls("tasks"),
    rlsPolicies.tenantIsolationPolicy("tasks")
  ],
  
  task_comments: [
    rlsPolicies.enableForceRls("task_comments"),
    rlsPolicies.tenantIsolationPolicy("task_comments")
  ],
  
  task_dependencies: [
    rlsPolicies.enableForceRls("task_dependencies"),
    rlsPolicies.tenantIsolationPolicy("task_dependencies")
  ],
  
  project_templates: [
    rlsPolicies.enableForceRls("project_templates"),
    rlsPolicies.tenantIsolationPolicy("project_templates")
  ],
  
  template_tasks: [
    rlsPolicies.enableForceRls("template_tasks"),
    rlsPolicies.tenantIsolationPolicy("template_tasks")
  ]
};

/**
 * Drop all work RLS policies
 * Use this for cleanup or migration rollback
 */
export const dropWorkRls = WORK_TABLES.map(table =>
  rlsPolicies.dropTenantPolicies(table, `${table}_tenant`)
);
