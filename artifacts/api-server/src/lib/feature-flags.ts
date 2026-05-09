/**
 * @file        artifacts/api-server/src/lib/feature-flags.ts
 * @module      API Server / Feature Flags
 * @purpose     Unleash client integration for runtime feature flag management
 *
 * @ai_instructions
 *   - Initialize Unleash client with proper configuration
 *   - Export typed isEnabled function for easy usage
 *   - Handle connection failures gracefully
 *   - Support tenant-level context for feature evaluation
 *   - Include proper error handling and fallback behavior
 *
 * @exports     FeatureFlagService class and isEnabled function
 * @imports     @unleash/nodejs, config, logger
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { initialize, Unleash } from 'unleash-client';
import { unleash } from './config';
import { logger } from './logger';

// Feature flag names - centralized for type safety and discoverability
export const FEATURE_FLAGS = {
  AI_CHAT_STREAMING: 'ai-chat-streaming',
  AI_CONTENT_GENERATION: 'ai-content-generation', 
  AI_SUPERVISOR: 'ai-supervisor',
  MCP_TOOL_EXECUTION: 'mcp-tool-execution',
  RAG_HYBRID_SEARCH: 'rag-hybrid-search',
} as const;

export type FeatureFlagName = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];

// Feature flag evaluation context
export interface FeatureFlagContext {
  tenantId?: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, string>;
}

// Unleash context interface (not exported from unleash-client)
interface UnleashContext {
  [key: string]: any;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, string>;
  remoteAddress?: string;
  appName?: string;
}

/**
 * Feature Flag Service wrapping Unleash client
 * Provides centralized feature flag management with proper error handling
 */
class FeatureFlagService {
  private unleash: Unleash | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the Unleash client
   * Called automatically on first use, but can be called explicitly for warmup
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      logger.info({ url: unleash.url, appName: unleash.appName }, 'Initializing Unleash feature flag client');

      this.unleash = initialize({
        url: unleash.url,
        appName: unleash.appName,
        instanceId: `${unleash.appName}-${process.env.HOSTNAME || 'local'}`,
        customHeaders: {
          Authorization: unleash.apiToken,
        },
        refreshInterval: 30000, // 30 seconds
        metricsInterval: 60000, // 1 minute
      });

      // Wait for initial sync
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Unleash initialization timeout'));
        }, 10000); // 10 second timeout

        this.unleash!.on('ready', () => {
          clearTimeout(timeout);
          logger.info({}, 'Unleash client initialized successfully');
          this.initialized = true;
          resolve();
        });

        this.unleash!.on('error', (error: Error) => {
          clearTimeout(timeout);
          logger.error({ error }, 'Unleash client initialization failed');
          reject(error);
        });
      });
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Unleash client');
      // Don't throw - allow application to run without feature flags
      this.unleash = null;
      this.initialized = false;
    }
  }

  /**
   * Check if a feature flag is enabled
   * @param flagName - The feature flag to check
   * @param context - Evaluation context (tenant, user, etc.)
   * @returns Promise<boolean> - true if enabled, false if disabled or client not available
   */
  async isEnabled(
    flagName: FeatureFlagName,
    context?: FeatureFlagContext
  ): Promise<boolean> {
    // Ensure client is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    // If client is not available, default to false (safe default)
    if (!this.unleash) {
      logger.warn({ flagName }, 'Feature flag client not available, defaulting to false');
      return false;
    }

    try {
      const unleashContext: UnleashContext = {
        userId: context?.userId,
        sessionId: context?.sessionId,
        properties: {
          ...(context?.tenantId && { tenantId: context.tenantId }),
          ...context?.properties,
        },
      };

      const enabled = this.unleash.isEnabled(flagName, unleashContext);
      
      logger.debug({ flagName: String(flagName), enabled, context: unleashContext }, 'Feature flag evaluation');

      return enabled;
    } catch (error) {
      logger.error({ flagName: String(flagName), error, context }, 'Feature flag evaluation failed');
      // Default to false on error for safety
      return false;
    }
  }

  /**
   * Synchronous version of isEnabled for hot paths
   * Note: This may return stale data if client is not fully initialized
   * @param flagName - The feature flag to check
   * @param context - Evaluation context
   * @returns boolean - true if enabled, false if disabled or client not available
   */
  isEnabledSync(
    flagName: FeatureFlagName,
    context?: FeatureFlagContext
  ): boolean {
    if (!this.initialized || !this.unleash) {
      logger.debug({ flagName: String(flagName) }, 'Feature flag client not initialized, sync check returning false');
      return false;
    }

    try {
      const unleashContext: UnleashContext = {
        userId: context?.userId,
        sessionId: context?.sessionId,
        properties: {
          ...(context?.tenantId && { tenantId: context.tenantId }),
          ...context?.properties,
        },
      };

      return this.unleash.isEnabled(flagName, unleashContext);
    } catch (error) {
      logger.error({ flagName: String(flagName), error, context }, 'Synchronous feature flag evaluation failed');
      return false;
    }
  }

  /**
   * Get all feature flag variants (for advanced use cases)
   */
  async getVariant(
    flagName: FeatureFlagName,
    context?: FeatureFlagContext
  ): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.unleash) {
      return { enabled: false, name: 'disabled' };
    }

    try {
      const unleashContext: UnleashContext = {
        userId: context?.userId,
        sessionId: context?.sessionId,
        properties: {
          ...(context?.tenantId && { tenantId: context.tenantId }),
          ...context?.properties,
        },
      };

      return this.unleash.getVariant(flagName, unleashContext);
    } catch (error) {
      logger.error({ flagName: String(flagName), error, context }, 'Feature flag variant evaluation failed');
      return { enabled: false, name: 'disabled' };
    }
  }

  /**
   * Shutdown the Unleash client
   */
  async shutdown(): Promise<void> {
    if (this.unleash) {
      this.unleash.destroy();
      this.unleash = null;
      this.initialized = false;
      this.initializationPromise = null;
      logger.info({}, 'Unleash client shutdown');
    }
  }
}

// Singleton instance
const featureFlagService = new FeatureFlagService();

// Export convenience functions
export const isEnabled = (
  flagName: FeatureFlagName,
  context?: FeatureFlagContext
) => featureFlagService.isEnabled(flagName, context);

export const isEnabledSync = (
  flagName: FeatureFlagName,
  context?: FeatureFlagContext
) => featureFlagService.isEnabledSync(flagName, context);

export const getVariant = (
  flagName: FeatureFlagName,
  context?: FeatureFlagContext
) => featureFlagService.getVariant(flagName, context);

export const initializeFeatureFlags = () => featureFlagService.initialize();
export const shutdownFeatureFlags = () => featureFlagService.shutdown();

// Export the service for advanced use cases
export { featureFlagService };

// Export types for external use
export type { FeatureFlagService };
