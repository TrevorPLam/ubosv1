/**
 * @file        artifacts/api-server/src/lib/cost-service.ts
 * @module      API Server / Services / Cost
 * @purpose     Token budget enforcement and cost governance service
 *
 * @ai_instructions
 *   - Implement atomic budget checking and usage recording
 *   - Use database transactions for consistency
 *   - Follow FinOps best practices for real-time cost control
 *   - Implement proper error handling for budget exceeded scenarios
 *   - Support grace periods and alert thresholds
 *
 * @exports     CostService class with budget management methods
 * @imports     Database, billing schema, and configuration
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { eq, and, gte, lt, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { 
  tenantTokenBudgetsTable, 
  tokenUsageEventsTable,
  type TenantTokenBudget,
  type TokenUsageEvent,
  type TokenUsageRecord,
  tokenUsageRecordSchema
} from "@workspace/db/schema";
import { z } from "zod";

export class BudgetExceededError extends Error {
  constructor(
    message: string,
    public readonly currentUsage: number,
    public readonly monthlyLimit: number,
    public readonly resetDate: Date
  ) {
    super(message);
    this.name = "BudgetExceededError";
  }
}

export class CostService {
  /**
   * Check if a tenant has sufficient token budget before making an LLM call
   * @param tenantId - The tenant ID to check budget for
   * @param requestedTokens - Number of tokens that will be used
   * @returns Promise that resolves if budget is sufficient, throws if exceeded
   */
  static async checkBudget(tenantId: string, requestedTokens: number): Promise<void> {
    if (requestedTokens <= 0) {
      return; // No tokens requested, no budget check needed
    }

    // Get current budget for tenant
    const budget = await this.getTenantBudget(tenantId);
    if (!budget) {
      throw new Error(`No budget configuration found for tenant: ${tenantId}`);
    }

    // Check if budget is suspended
    if (budget.status === "suspended") {
      throw new BudgetExceededError(
        "Token budget is suspended for this tenant",
        budget.currentUsage,
        budget.monthlyTokenLimit,
        new Date(budget.resetDate)
      );
    }

    // Check if we're in grace period
    const now = new Date();
    if (budget.status === "grace_period" && budget.gracePeriodEndsAt) {
      const graceEndsAt = new Date(budget.gracePeriodEndsAt);
      if (now > graceEndsAt) {
        // Grace period expired, update status to exceeded
        await this.updateBudgetStatus(tenantId, "exceeded");
        throw new BudgetExceededError(
          "Grace period expired. Token budget exceeded.",
          budget.currentUsage,
          budget.monthlyTokenLimit,
          new Date(budget.resetDate)
        );
      }
      // Still in grace period, allow usage but log warning
      console.warn(`Tenant ${tenantId} exceeding budget during grace period`);
      return;
    }

    // Check if hard limit is enabled and budget would be exceeded
    if (budget.hardLimitEnabled && budget.currentUsage + requestedTokens > budget.monthlyTokenLimit) {
      // Check if we should enter grace period (first time exceeding)
      if (budget.status === "active") {
        const gracePeriodEndsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        await this.updateBudgetStatus(tenantId, "grace_period", gracePeriodEndsAt);
        throw new BudgetExceededError(
          "Token budget exceeded. 24-hour grace period started.",
          budget.currentUsage,
          budget.monthlyTokenLimit,
          new Date(budget.resetDate)
        );
      }

      // Already exceeded or in grace period
      throw new BudgetExceededError(
        "Token budget exceeded. Hard limit enforced.",
        budget.currentUsage,
        budget.monthlyTokenLimit,
        new Date(budget.resetDate)
      );
    }

    // Check alert threshold (80% by default)
    const usagePercent = (budget.currentUsage / budget.monthlyTokenLimit) * 100;
    if (usagePercent >= budget.alertThresholdPercent) {
      console.warn(`Tenant ${tenantId} has used ${usagePercent.toFixed(1)}% of token budget`);
      // TODO: Send alert notification to tenant administrators
    }
  }

  /**
   * Record token usage after an LLM call completes
   * @param usageData - Token usage record with metadata
   * @returns Promise that resolves when usage is recorded
   */
  static async recordUsage(usageData: TokenUsageRecord): Promise<void> {
    // Validate input data
    const validatedData = tokenUsageRecordSchema.parse(usageData);

    // Use a transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Record the usage event
      await tx.insert(tokenUsageEventsTable).values({
        tenantId: validatedData.tenantId,
        eventId: validatedData.eventId,
        model: validatedData.model,
        eventType: validatedData.eventType,
        inputTokens: validatedData.inputTokens,
        outputTokens: validatedData.outputTokens,
        totalTokens: validatedData.inputTokens + validatedData.outputTokens,
        costEstimate: validatedData.costEstimate?.toString() || "0.000000",
        agentRunId: validatedData.agentRunId,
        messageId: validatedData.messageId,
        userId: validatedData.userId,
        metadata: validatedData.metadata || {}
      });

      // Atomically update the tenant's current usage
      const totalTokens = validatedData.inputTokens + validatedData.outputTokens;
      await tx
        .update(tenantTokenBudgetsTable)
        .set({ 
          currentUsage: sql`current_usage + ${totalTokens}`,
          updatedAt: new Date().toISOString()
        })
        .where(eq(tenantTokenBudgetsTable.tenantId, validatedData.tenantId));
    });
  }

  /**
   * Get current budget configuration for a tenant
   * @param tenantId - The tenant ID
   * @returns Promise resolving to budget configuration or null
   */
  static async getTenantBudget(tenantId: string): Promise<TenantTokenBudget | null> {
    const budgets = await db
      .select()
      .from(tenantTokenBudgetsTable)
      .where(eq(tenantTokenBudgetsTable.tenantId, tenantId))
      .limit(1);
    
    return budgets[0] || null;
  }

  /**
   * Create or update budget configuration for a tenant
   * @param tenantId - The tenant ID
   * @param budgetConfig - Budget configuration
   * @returns Promise resolving to updated budget
   */
  static async upsertTenantBudget(
    tenantId: string, 
    budgetConfig: {
      monthlyTokenLimit: number;
      alertThresholdPercent?: number;
      hardLimitEnabled?: boolean;
      resetDate: string;
    }
  ): Promise<TenantTokenBudget> {
    const now = new Date().toISOString();
    
    // Upsert the budget configuration
    const result = await db
      .insert(tenantTokenBudgetsTable)
      .values({
        tenantId,
        monthlyTokenLimit: budgetConfig.monthlyTokenLimit,
        currentUsage: 0,
        resetDate: budgetConfig.resetDate,
        status: "active",
        alertThresholdPercent: budgetConfig.alertThresholdPercent || 80,
        hardLimitEnabled: budgetConfig.hardLimitEnabled ?? true,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: tenantTokenBudgetsTable.tenantId,
        set: {
          monthlyTokenLimit: budgetConfig.monthlyTokenLimit,
          resetDate: budgetConfig.resetDate,
          alertThresholdPercent: budgetConfig.alertThresholdPercent || 80,
          hardLimitEnabled: budgetConfig.hardLimitEnabled ?? true,
          updatedAt: now
        }
      })
      .returning();

    return result[0];
  }

  /**
   * Update budget status (used for grace period and suspension)
   * @param tenantId - The tenant ID
   * @param status - New status
   * @param gracePeriodEndsAt - Optional grace period end date
   */
  static async updateBudgetStatus(
    tenantId: string, 
    status: "active" | "suspended" | "grace_period" | "exceeded",
    gracePeriodEndsAt?: Date
  ): Promise<void> {
    await db
      .update(tenantTokenBudgetsTable)
      .set({
        status,
        gracePeriodEndsAt: gracePeriodEndsAt?.toISOString(),
        updatedAt: new Date().toISOString()
      })
      .where(eq(tenantTokenBudgetsTable.tenantId, tenantId));
  }

  /**
   * Reset monthly usage for all tenants (called by cron job)
   * @returns Promise resolving to number of tenants reset
   */
  static async resetMonthlyUsage(): Promise<number> {
    const now = new Date().toISOString();
    
    const result = await db
      .update(tenantTokenBudgetsTable)
      .set({
        currentUsage: 0,
        status: "active",
        gracePeriodEndsAt: null,
        updatedAt: now
      })
      .where(and(
        lt(tenantTokenBudgetsTable.resetDate, now),
        gte(tenantTokenBudgetsTable.resetDate, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ))
      .returning({ id: tenantTokenBudgetsTable.id });

    return result.length;
  }

  /**
   * Get usage analytics for a tenant
   * @param tenantId - The tenant ID
   * @param startDate - Start date for analytics
   * @param endDate - End date for analytics
   * @returns Promise resolving to usage analytics
   */
  static async getUsageAnalytics(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalTokens: number;
    totalCost: number;
    usageByModel: Record<string, { tokens: number; cost: number }>;
    usageByEventType: Record<string, { tokens: number; cost: number }>;
  }> {
    const events = await db
      .select()
      .from(tokenUsageEventsTable)
      .where(and(
        eq(tokenUsageEventsTable.tenantId, tenantId),
        gte(tokenUsageEventsTable.timestamp, startDate.toISOString()),
        lt(tokenUsageEventsTable.timestamp, endDate.toISOString())
      ));

    const analytics = {
      totalTokens: 0,
      totalCost: 0,
      usageByModel: {} as Record<string, { tokens: number; cost: number }>,
      usageByEventType: {} as Record<string, { tokens: number; cost: number }>
    };

    for (const event of events) {
      const tokens = event.totalTokens;
      const cost = parseFloat(event.costEstimate);

      analytics.totalTokens += tokens;
      analytics.totalCost += cost;

      // Aggregate by model
      if (!analytics.usageByModel[event.model]) {
        analytics.usageByModel[event.model] = { tokens: 0, cost: 0 };
      }
      analytics.usageByModel[event.model].tokens += tokens;
      analytics.usageByModel[event.model].cost += cost;

      // Aggregate by event type
      if (!analytics.usageByEventType[event.eventType]) {
        analytics.usageByEventType[event.eventType] = { tokens: 0, cost: 0 };
      }
      analytics.usageByEventType[event.eventType].tokens += tokens;
      analytics.usageByEventType[event.eventType].cost += cost;
    }

    return analytics;
  }
}
