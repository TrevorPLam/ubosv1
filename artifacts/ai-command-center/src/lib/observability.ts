/**
 * @file        artifacts/ai-command-center/src/lib/observability.ts
 * @module      AI Command Center / Observability
 * @purpose     Frontend error tracking and performance monitoring with Sentry
 *
 * @ai_instructions
 *   - Initialize Sentry for error tracking and performance monitoring.
 *   - Configure React integration for component profiling.
 *   - Set up user context tracking.
 *   - All initialization must be conditional on environment variables.
 *   - DO NOT start observability in test environments.
 *
 * @imports     @sentry/react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for frontend error tracking and performance monitoring
 */
export function initializeSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn("VITE_SENTRY_DSN not configured, skipping Sentry initialization");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Performance monitoring
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
    // Session replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // React integration for component profiling
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask sensitive inputs
        maskAllText: false,
        maskAllInputs: true,
      }),
    ],
    // Custom tags for better filtering
    initialScope: {
      tags: {
        service: "ai-command-center",
        version: import.meta.env.npm_package_version || "unknown",
      },
    },
    // Before send hook to filter sensitive data
    beforeSend(event) {
      // Remove sensitive URL parameters
      if (event.request?.url) {
        const url = new URL(event.request.url);
        url.searchParams.delete("token");
        url.searchParams.delete("api_key");
        event.request.url = url.toString();
      }
      return event;
    },
  });

  console.log("Sentry initialized for frontend error tracking and performance monitoring");
}

/**
 * Set user context in Sentry for authenticated users
 */
export function setSentryUser(userId: string, email?: string, tenantId?: string): void {
  Sentry.setUser({
    id: userId,
    email,
    tenantId,
  });
}

/**
 * Clear user context in Sentry
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add custom tags to Sentry context
 */
export function addSentryTags(tags: Record<string, string>): void {
  Sentry.setTags(tags);
}

/**
 * Add custom breadcrumb to Sentry for debugging
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: "debug" | "info" | "warning" | "error" = "info",
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
    data,
  });
}

/**
 * Capture a custom error with additional context
 */
export function captureError(
  error: Error | string,
  context?: Record<string, any>,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "error"
): void {
  const errorObj = typeof error === "string" ? new Error(error) : error;
  
  if (context) {
    Sentry.setContext("custom_context", context);
  }
  
  Sentry.captureException(errorObj, {
    level,
  });
}

/**
 * Track a custom user action or event
 */
export function trackUserAction(
  action: string,
  properties?: Record<string, any>
): void {
  addSentryBreadcrumb(`User action: ${action}`, "user", "info", properties);
}

/**
 * Performance monitoring wrapper for async operations
 */
export async function trackPerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  
  addSentryBreadcrumb(`Starting operation: ${operation}`, "performance", "info", context);
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    addSentryBreadcrumb(
      `Completed operation: ${operation}`,
      "performance", 
      "info", 
      { ...context, duration, success: true }
    );
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    addSentryBreadcrumb(
      `Failed operation: ${operation}`,
      "performance", 
      "error", 
      { ...context, duration, success: false, error: String(error) }
    );
    
    captureError(error as Error, { operation, duration, ...context });
    throw error;
  }
}
