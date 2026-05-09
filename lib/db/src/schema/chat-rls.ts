/**
 * @file        lib/db/src/schema/chat-rls.ts
 * @module      Database / Schema / Chat / RLS
 * @purpose     Row Level Security policies for chat schema tables
 *
 * @ai_instructions
 *   - This file contains RLS policies for tenant isolation on chat tables.
 *   - All policies use the tenant_id column with current_tenant_id() function.
 *   - Policies are applied to all operations (SELECT, INSERT, UPDATE, DELETE).
 *   - Follow existing RLS patterns from helpers.ts
 *
 * @exports     RLS policy SQL statements for chat tables
 * @imports     drizzle-orm/sql, ./helpers
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { sql } from "drizzle-orm";
import { rlsPolicies } from "./helpers";

/**
 * Chat tables that need RLS policies
 */
const CHAT_TABLES = [
  "chat_threads",
  "messages", 
  "message_versions",
  "citations",
  "summaries",
  "feedback",
  "attachments",
  "embedding_chunks"
] as const;

/**
 * Enable FORCE ROW LEVEL SECURITY on all chat tables
 */
export const enableChatRls = CHAT_TABLES.map(table => 
  rlsPolicies.enableForceRls(table)
);

/**
 * Create tenant isolation policies for all chat tables
 * Each table gets a single policy that handles all operations
 */
export const createChatTenantPolicies = CHAT_TABLES.map(table =>
  rlsPolicies.tenantIsolationPolicy(table, `${table}_tenant_isolation`)
);

/**
 * Create separate operation-specific policies for chat tables
 * Use these when you need different policies for different operations
 */
export const createChatTenantPoliciesDetailed = CHAT_TABLES.reduce((acc, table) => {
  const policies = rlsPolicies.tenantIsolationPolicies(table, `${table}_tenant`);
  return {
    ...acc,
    [table]: policies
  };
}, {});

/**
 * Complete RLS setup for all chat tables
 * Combines enabling RLS and creating policies
 */
export const setupChatRls = [
  // Enable FORCE ROW LEVEL SECURITY on all tables
  ...enableChatRls,
  // Create tenant isolation policies
  ...createChatTenantPolicies
];

/**
 * Individual table RLS setup functions
 * Use these for granular control or testing
 */
export const chatTableRlsSetup = {
  chatThreads: [
    rlsPolicies.enableForceRls("chat_threads"),
    rlsPolicies.tenantIsolationPolicy("chat_threads")
  ],
  
  messages: [
    rlsPolicies.enableForceRls("messages"),
    rlsPolicies.tenantIsolationPolicy("messages")
  ],
  
  messageVersions: [
    rlsPolicies.enableForceRls("message_versions"),
    rlsPolicies.tenantIsolationPolicy("message_versions")
  ],
  
  citations: [
    rlsPolicies.enableForceRls("citations"),
    rlsPolicies.tenantIsolationPolicy("citations")
  ],
  
  summaries: [
    rlsPolicies.enableForceRls("summaries"),
    rlsPolicies.tenantIsolationPolicy("summaries")
  ],
  
  feedback: [
    rlsPolicies.enableForceRls("feedback"),
    rlsPolicies.tenantIsolationPolicy("feedback")
  ],
  
  attachments: [
    rlsPolicies.enableForceRls("attachments"),
    rlsPolicies.tenantIsolationPolicy("attachments")
  ],
  
  embeddingChunks: [
    rlsPolicies.enableForceRls("embedding_chunks"),
    rlsPolicies.tenantIsolationPolicy("embedding_chunks")
  ]
};

/**
 * Drop all chat RLS policies
 * Use this for cleanup or migration rollback
 */
export const dropChatRls = CHAT_TABLES.map(table =>
  rlsPolicies.dropTenantPolicies(table, `${table}_tenant`)
);
