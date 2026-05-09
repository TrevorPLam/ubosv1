/**
 * @file        artifacts/api-server/src/lib/tenant-context.ts
 * @module      API Server / Tenant Context Helper
 * @purpose     Helper functions for getting current tenant context in services
 *
 * @ai_instructions
 *   - This module provides utility functions for accessing tenant context
 *   - Use async local storage or request context for tenant isolation
 *   - Provide fallback error handling when tenant context is missing
 *
 * @exports     getCurrentTenantId function
 * @imports     AsyncLocalStorage or similar context mechanism
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  tenantId?: string;
  userId?: string;
}

// Async local storage for request context
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Set request context with tenant information
 * @param context Request context
 */
export function setRequestContext(context: RequestContext): void {
  asyncLocalStorage.enterWith(context);
}

/**
 * Get current tenant ID from request context
 * @returns Current tenant ID
 * @throws Error if tenant context is not available
 */
export function getCurrentTenantId(): string {
  const store = asyncLocalStorage.getStore();
  const tenantId = store?.tenantId;

  if (!tenantId) {
    throw new Error('Tenant context not available. Make sure tenant context middleware is properly configured.');
  }

  return tenantId;
}

/**
 * Get current user ID from request context
 * @returns Current user ID or undefined
 */
export function getCurrentUserId(): string | undefined {
  const store = asyncLocalStorage.getStore();
  return store?.userId;
}

/**
 * Check if tenant context is available
 * @returns True if tenant context is available
 */
export function hasTenantContext(): boolean {
  const store = asyncLocalStorage.getStore();
  return !!store?.tenantId;
}
