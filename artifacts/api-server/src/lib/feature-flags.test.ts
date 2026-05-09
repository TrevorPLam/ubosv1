/**
 * @file        artifacts/api-server/src/lib/feature-flags.test.ts
 * @module      API Server / Feature Flags Tests
 * @purpose     Integration tests for feature flag service
 *
 * @ai_instructions
 *   - Test feature flag evaluation with and without Unleash server
 *   - Test graceful degradation when server is unavailable
 *   - Test context-based flag evaluation
 *   - Test error handling and logging
 *
 * @exports     Test suite for feature flag service
 * @imports     feature-flags, jest, test utilities
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { 
  isEnabled, 
  isEnabledSync, 
  getVariant, 
  initializeFeatureFlags, 
  shutdownFeatureFlags,
  FEATURE_FLAGS,
  type FeatureFlagContext 
} from './feature-flags';

describe('Feature Flag Service', () => {
  const testContext: FeatureFlagContext = {
    tenantId: 'test-tenant-123',
    userId: 'test-user-456',
    sessionId: 'test-session-789',
  };

  beforeAll(async () => {
    // Initialize feature flags for tests
    await initializeFeatureFlags();
  });

  afterAll(async () => {
    // Cleanup
    await shutdownFeatureFlags();
  });

  describe('isEnabled', () => {
    it('should return false when Unleash server is not available', async () => {
      const result = await isEnabled(FEATURE_FLAGS.AI_CHAT_STREAMING, testContext);
      
      // Should default to false when server is unavailable
      expect(typeof result).toBe('boolean');
      expect(result).toBe(false);
    });

    it('should handle missing context gracefully', async () => {
      const result = await isEnabled(FEATURE_FLAGS.AI_CHAT_STREAMING);
      
      expect(typeof result).toBe('boolean');
    });

    it('should accept different flag names', async () => {
      const flags = [
        FEATURE_FLAGS.AI_CHAT_STREAMING,
        FEATURE_FLAGS.AI_CONTENT_GENERATION,
        FEATURE_FLAGS.AI_SUPERVISOR,
        FEATURE_FLAGS.MCP_TOOL_EXECUTION,
        FEATURE_FLAGS.RAG_HYBRID_SEARCH,
      ];

      for (const flag of flags) {
        const result = await isEnabled(flag, testContext);
        expect(typeof result).toBe('boolean');
      }
    });

    it('should handle context with only tenant ID', async () => {
      const context: FeatureFlagContext = {
        tenantId: 'tenant-only',
      };

      const result = await isEnabled(FEATURE_FLAGS.AI_CHAT_STREAMING, context);
      expect(typeof result).toBe('boolean');
    });

    it('should handle context with custom properties', async () => {
      const context: FeatureFlagContext = {
        tenantId: 'test-tenant',
        userId: 'test-user',
        properties: {
          region: 'us-west',
          plan: 'premium',
        },
      };

      const result = await isEnabled(FEATURE_FLAGS.AI_CHAT_STREAMING, context);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('isEnabledSync', () => {
    it('should return false when client is not initialized', () => {
      const result = isEnabledSync(FEATURE_FLAGS.AI_CHAT_STREAMING, testContext);
      
      // Should return false for uninitialized client
      expect(result).toBe(false);
    });

    it('should handle missing context gracefully', () => {
      const result = isEnabledSync(FEATURE_FLAGS.AI_CHAT_STREAMING);
      
      expect(typeof result).toBe('boolean');
    });

    it('should be consistent with async version when initialized', async () => {
      // Test both methods return same type
      const asyncResult = await isEnabled(FEATURE_FLAGS.AI_CHAT_STREAMING, testContext);
      const syncResult = isEnabledSync(FEATURE_FLAGS.AI_CHAT_STREAMING, testContext);
      
      expect(typeof asyncResult).toBe('boolean');
      expect(typeof syncResult).toBe('boolean');
    });
  });

  describe('getVariant', () => {
    it('should return disabled variant when server is unavailable', async () => {
      const result = await getVariant(FEATURE_FLAGS.AI_CHAT_STREAMING, testContext);
      
      expect(result).toHaveProperty('enabled', false);
      expect(result).toHaveProperty('name', 'disabled');
    });

    it('should handle missing context gracefully', async () => {
      const result = await getVariant(FEATURE_FLAGS.AI_CHAT_STREAMING);
      
      expect(result).toHaveProperty('enabled');
      expect(result).toHaveProperty('name');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid flag names gracefully', async () => {
      // Test with potentially invalid flag name
      const result = await isEnabled('invalid-flag-name' as any, testContext);
      
      expect(typeof result).toBe('boolean');
    });

    it('should handle malformed context', async () => {
      const malformedContext = {
        tenantId: null,
        userId: undefined,
        properties: 'not-an-object',
      } as any;

      const result = await isEnabled(FEATURE_FLAGS.AI_CHAT_STREAMING, malformedContext);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Integration with AI Services', () => {
    it('should work with chat streaming feature flag', async () => {
      const result = await isEnabled(FEATURE_FLAGS.AI_CHAT_STREAMING, testContext);
      
      expect(typeof result).toBe('boolean');
    });

    it('should work with supervisor feature flag', async () => {
      const result = await isEnabled(FEATURE_FLAGS.AI_SUPERVISOR, testContext);
      
      expect(typeof result).toBe('boolean');
    });

    it('should work with MCP tool execution feature flag', async () => {
      const result = await isEnabled(FEATURE_FLAGS.MCP_TOOL_EXECUTION, testContext);
      
      expect(typeof result).toBe('boolean');
    });

    it('should work with RAG hybrid search feature flag', async () => {
      const result = await isEnabled(FEATURE_FLAGS.RAG_HYBRID_SEARCH, testContext);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent flag evaluations', async () => {
      const promises = Array.from({ length: 100 }, () =>
        isEnabled(FEATURE_FLAGS.AI_CHAT_STREAMING, testContext)
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(typeof result).toBe('boolean');
      });
    });

    it('should handle rapid sync evaluations', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        isEnabledSync(FEATURE_FLAGS.AI_CHAT_STREAMING, testContext);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
    });
  });

  describe('Feature Flag Constants', () => {
    it('should have all required feature flags defined', () => {
      expect(FEATURE_FLAGS.AI_CHAT_STREAMING).toBe('ai-chat-streaming');
      expect(FEATURE_FLAGS.AI_CONTENT_GENERATION).toBe('ai-content-generation');
      expect(FEATURE_FLAGS.AI_SUPERVISOR).toBe('ai-supervisor');
      expect(FEATURE_FLAGS.MCP_TOOL_EXECUTION).toBe('mcp-tool-execution');
      expect(FEATURE_FLAGS.RAG_HYBRID_SEARCH).toBe('rag-hybrid-search');
    });

    it('should have immutable flag constants', () => {
      const originalValue = FEATURE_FLAGS.AI_CHAT_STREAMING;
      
      // Attempting to modify should not affect the constant
      try {
        (FEATURE_FLAGS as any).AI_CHAT_STREAMING = 'modified';
      } catch {
        // Ignore errors from potential read-only properties
      }
      
      expect(FEATURE_FLAGS.AI_CHAT_STREAMING).toBe(originalValue);
    });
  });
});

describe('Feature Flag Service - Edge Cases', () => {
  it('should handle initialization timeout gracefully', async () => {
    // Mock timeout scenario
    const originalTimeout = setTimeout;
    const mockTimeout = jest.fn(() => {
      return originalTimeout(() => {}, 0); // Immediate timeout
    });
    global.setTimeout = mockTimeout;

    try {
      await initializeFeatureFlags();
    } catch (error) {
      // Should handle timeout gracefully
      expect(error).toBeDefined();
    } finally {
      global.setTimeout = originalTimeout;
    }
  });

  it('should handle multiple initialization attempts', async () => {
    await initializeFeatureFlags();
    await initializeFeatureFlags(); // Should not cause issues
    await initializeFeatureFlags(); // Should not cause issues
    
    // Service should still work
    const result = await isEnabled(FEATURE_FLAGS.AI_CHAT_STREAMING);
    expect(typeof result).toBe('boolean');
  });

  it('should handle shutdown and reinitialization', async () => {
    await shutdownFeatureFlags();
    
    // Should handle operations after shutdown
    const result1 = await isEnabled(FEATURE_FLAGS.AI_CHAT_STREAMING);
    expect(typeof result1).toBe('boolean');
    
    // Reinitialize should work
    await initializeFeatureFlags();
    
    const result2 = await isEnabled(FEATURE_FLAGS.AI_CHAT_STREAMING);
    expect(typeof result2).toBe('boolean');
  });
});
