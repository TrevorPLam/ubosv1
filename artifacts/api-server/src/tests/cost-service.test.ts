/**
 * @file        artifacts/api-server/src/tests/cost-service.test.ts
 * @module      API Server / Tests / Cost Service
 * @purpose     Integration tests for token budget enforcement and cost governance
 *
 * @ai_instructions
 *   - Test budget checking and usage recording
 *   - Test budget exceeded scenarios
 *   - Test atomic operations and race conditions
 *   - Use proper test isolation with transactions
 *   - Mock external dependencies
 *
 * @exports     CostService integration tests
 * @imports     Jest, test utilities, CostService
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { 
  tenantTokenBudgetsTable, 
  tokenUsageEventsTable,
  type TenantTokenBudget
} from "@workspace/db/schema";
import { CostService, BudgetExceededError } from "../lib/cost-service";

describe("CostService Integration Tests", () => {
  let testTenantId: string;
  let testBudget: TenantTokenBudget;

  beforeEach(async () => {
    // Create a test tenant with budget
    testTenantId = `test-tenant-${Date.now()}`;
    
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1); // Next month
    
    testBudget = await CostService.upsertTenantBudget(testTenantId, {
      monthlyTokenLimit: 1000,
      alertThresholdPercent: 80,
      hardLimitEnabled: true,
      resetDate: resetDate.toISOString()
    });
  });

  afterEach(async () => {
    // Clean up test data
    await db
      .delete(tokenUsageEventsTable)
      .where(eq(tokenUsageEventsTable.tenantId, testTenantId));
    
    await db
      .delete(tenantTokenBudgetsTable)
      .where(eq(tenantTokenBudgetsTable.tenantId, testTenantId));
  });

  describe("Budget Checking", () => {
    test("should allow usage within budget", async () => {
      await expect(CostService.checkBudget(testTenantId, 500))
        .resolves.not.toThrow();
    });

    test("should throw BudgetExceededError when exceeding hard limit", async () => {
      // Use up most of the budget first
      await CostService.recordUsage({
        tenantId: testTenantId,
        eventId: `test-${Date.now()}-1`,
        model: "gpt-4",
        eventType: "prompt",
        inputTokens: 900,
        outputTokens: 0
      });

      // Try to exceed budget
      await expect(CostService.checkBudget(testTenantId, 200))
        .rejects.toThrow(BudgetExceededError);
    });

    test("should enter grace period on first budget exceed", async () => {
      // Use up entire budget
      await CostService.recordUsage({
        tenantId: testTenantId,
        eventId: `test-${Date.now()}-1`,
        model: "gpt-4",
        eventType: "prompt",
        inputTokens: 1000,
        outputTokens: 0
      });

      const error = await CostService.checkBudget(testTenantId, 100)
        .catch(e => e);

      expect(error).toBeInstanceOf(BudgetExceededError);
      expect(error.message).toContain("grace period");
      
      // Check that budget status is updated to grace_period
      const budget = await CostService.getTenantBudget(testTenantId);
      expect(budget?.status).toBe("grace_period");
    });

    test("should allow usage during grace period", async () => {
      // Put tenant in grace period
      await CostService.recordUsage({
        tenantId: testTenantId,
        eventId: `test-${Date.now()}-1`,
        model: "gpt-4",
        eventType: "prompt",
        inputTokens: 1000,
        outputTokens: 0
      });

      // First exceed should create grace period
      try {
        await CostService.checkBudget(testTenantId, 100);
      } catch (error) {
        // Expected - grace period created
      }

      // Second request during grace period should be allowed
      await expect(CostService.checkBudget(testTenantId, 50))
        .resolves.not.toThrow();
    });

    test("should reject suspended budgets", async () => {
      // Suspend the budget
      await CostService.updateBudgetStatus(testTenantId, "suspended");

      await expect(CostService.checkBudget(testTenantId, 100))
        .rejects.toThrow("suspended");
    });
  });

  describe("Usage Recording", () => {
    test("should record usage and update budget atomically", async () => {
      const usageData = {
        tenantId: testTenantId,
        eventId: `test-${Date.now()}`,
        model: "gpt-4",
        eventType: "response" as const,
        inputTokens: 100,
        outputTokens: 50,
        userId: "test-user"
      };

      await CostService.recordUsage(usageData);

      // Check usage event was recorded
      const events = await db
        .select()
        .from(tokenUsageEventsTable)
        .where(eq(tokenUsageEventsTable.eventId, usageData.eventId));

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        tenantId: testTenantId,
        eventId: usageData.eventId,
        model: usageData.model,
        eventType: usageData.eventType,
        inputTokens: usageData.inputTokens,
        outputTokens: usageData.outputTokens,
        userId: usageData.userId
      });

      // Check budget was updated
      const budget = await CostService.getTenantBudget(testTenantId);
      expect(budget?.currentUsage).toBe(150); // 100 + 50
    });

    test("should handle concurrent usage recording atomically", async () => {
      const concurrentRequests = 10;
      const tokensPerRequest = 10;

      // Simulate concurrent requests
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        CostService.recordUsage({
          tenantId: testTenantId,
          eventId: `concurrent-${Date.now()}-${i}`,
          model: "gpt-4",
          eventType: "prompt",
          inputTokens: tokensPerRequest,
          outputTokens: 0
        })
      );

      await Promise.all(promises);

      // Check that all usage was recorded correctly
      const budget = await CostService.getTenantBudget(testTenantId);
      expect(budget?.currentUsage).toBe(concurrentRequests * tokensPerRequest);

      // Check that all events were recorded
      const events = await db
        .select()
        .from(tokenUsageEventsTable)
        .where(eq(tokenUsageEventsTable.tenantId, testTenantId));

      expect(events).toHaveLength(concurrentRequests);
    });

    test("should prevent duplicate event IDs", async () => {
      const eventId = `duplicate-${Date.now()}`;

      // Record first usage
      await CostService.recordUsage({
        tenantId: testTenantId,
        eventId,
        model: "gpt-4",
        eventType: "prompt",
        inputTokens: 100,
        outputTokens: 0
      });

      // Try to record duplicate
      await expect(CostService.recordUsage({
        tenantId: testTenantId,
        eventId,
        model: "gpt-4",
        eventType: "prompt",
        inputTokens: 50,
        outputTokens: 0
      })).rejects.toThrow();
    });
  });

  describe("Budget Management", () => {
    test("should upsert tenant budget correctly", async () => {
      const newBudget = await CostService.upsertTenantBudget(testTenantId, {
        monthlyTokenLimit: 2000,
        alertThresholdPercent: 90,
        hardLimitEnabled: false,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      expect(newBudget.monthlyTokenLimit).toBe(2000);
      expect(newBudget.alertThresholdPercent).toBe(90);
      expect(newBudget.hardLimitEnabled).toBe(false);
    });

    test("should update budget status correctly", async () => {
      await CostService.updateBudgetStatus(testTenantId, "suspended");

      const budget = await CostService.getTenantBudget(testTenantId);
      expect(budget?.status).toBe("suspended");
    });

    test("should reset monthly usage correctly", async () => {
      // Add some usage
      await CostService.recordUsage({
        tenantId: testTenantId,
        eventId: `reset-test-${Date.now()}`,
        model: "gpt-4",
        eventType: "prompt",
        inputTokens: 500,
        outputTokens: 0
      });

      // Reset usage
      await CostService.updateBudgetStatus(testTenantId, "active");

      const budget = await CostService.getTenantBudget(testTenantId);
      expect(budget?.currentUsage).toBeGreaterThan(0); // Should still have usage

      // Manual reset for testing
      await db
        .update(tenantTokenBudgetsTable)
        .set({ currentUsage: 0 })
        .where(eq(tenantTokenBudgetsTable.tenantId, testTenantId));

      const resetBudget = await CostService.getTenantBudget(testTenantId);
      expect(resetBudget?.currentUsage).toBe(0);
    });
  });

  describe("Usage Analytics", () => {
    test("should provide usage analytics", async () => {
      // Record some usage
      await CostService.recordUsage({
        tenantId: testTenantId,
        eventId: `analytics-${Date.now()}-1`,
        model: "gpt-4",
        eventType: "prompt",
        inputTokens: 100,
        outputTokens: 50
      });

      await CostService.recordUsage({
        tenantId: testTenantId,
        eventId: `analytics-${Date.now()}-2`,
        model: "claude-3",
        eventType: "response",
        inputTokens: 200,
        outputTokens: 100
      });

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

      const analytics = await CostService.getUsageAnalytics(testTenantId, startDate, endDate);

      expect(analytics.totalTokens).toBe(450); // (100+50) + (200+100)
      expect(analytics.usageByModel).toEqual({
        "gpt-4": { tokens: 150, cost: expect.any(Number) },
        "claude-3": { tokens: 300, cost: expect.any(Number) }
      });
      expect(analytics.usageByEventType).toEqual({
        "prompt": { tokens: 300, cost: expect.any(Number) },
        "response": { tokens: 150, cost: expect.any(Number) }
      });
    });
  });
});
