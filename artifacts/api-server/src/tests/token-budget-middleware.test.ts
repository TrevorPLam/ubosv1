/**
 * @file        artifacts/api-server/src/tests/token-budget-middleware.test.ts
 * @module      API Server / Tests / Token Budget Middleware
 * @purpose     Integration tests for token budget enforcement middleware
 *
 * @ai_instructions
 *   - Test middleware budget enforcement
 *   - Test request estimation and blocking
 *   - Test response headers and usage recording
 *   - Mock Express request/response objects
 *   - Test different endpoint scenarios
 *
 * @exports     Token budget middleware tests
 * @imports     Jest, Express mocks, middleware functions
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { tenantTokenBudgetsTable } from "@workspace/db/schema";
import { CostService } from "../lib/cost-service";
import { 
  tokenBudgetMiddleware, 
  tokenUsageRecorder, 
  budgetHeadersMiddleware 
} from "../middlewares/token-budget";

describe("Token Budget Middleware Integration Tests", () => {
  let testTenantId: string;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(async () => {
    // Create test tenant with budget
    testTenantId = `test-tenant-${Date.now()}`;
    
    await CostService.upsertTenantBudget(testTenantId, {
      monthlyTokenLimit: 1000,
      alertThresholdPercent: 80,
      hardLimitEnabled: true,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Setup mock request/response
    mockRequest = {
      path: "/api/chat",
      method: "POST",
      body: {
        model: "gpt-4",
        messages: [
          { role: "user", content: "Hello, how are you?" }
        ]
      },
      get: jest.fn(),
      headers: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  afterEach(async () => {
    // Clean up test data
    await db
      .delete(tenantTokenBudgetsTable)
      .where(eq(tenantTokenBudgetsTable.tenantId, testTenantId));
  });

  describe("Token Budget Middleware", () => {
    test("should allow requests within budget", async () => {
      // Add tenant context to request
      (mockRequest as any).tenantId = testTenantId;

      const middleware = tokenBudgetMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalledWith(429);
    });

    test("should block requests exceeding budget", async () => {
      // Use up entire budget first
      await CostService.recordUsage({
        tenantId: testTenantId,
        eventId: `test-${Date.now()}`,
        model: "gpt-4",
        eventType: "prompt",
        inputTokens: 1000,
        outputTokens: 0
      });

      // Add tenant context to request
      (mockRequest as any).tenantId = testTenantId;

      const middleware = tokenBudgetMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Token budget exceeded",
          statusCode: 429
        })
      );
    });

    test("should skip budget check for non-LLM endpoints", async () => {
      mockRequest.path = "/api/health";

      const middleware = tokenBudgetMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    test("should skip budget check for excluded paths", async () => {
      mockRequest.path = "/api/health";
      
      const middleware = tokenBudgetMiddleware({ 
        skipPaths: ["/api/health", "/api/ready"] 
      });
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    test("should return 401 when tenant context is missing", async () => {
      // Don't add tenant context
      delete (mockRequest as any).tenantId;

      const middleware = tokenBudgetMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Tenant context required for budget enforcement"
        })
      );
    });

    test("should add budget context to request", async () => {
      (mockRequest as any).tenantId = testTenantId;

      const middleware = tokenBudgetMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockRequest as any).budgetContext).toBeDefined();
      expect((mockRequest as any).budgetContext.tenantId).toBe(testTenantId);
      expect((mockRequest as any).budgetContext.estimatedTokens).toBeGreaterThan(0);
    });

    test("should handle malformed request bodies gracefully", async () => {
      (mockRequest as any).tenantId = testTenantId;
      mockRequest.body = { invalid: "data" };

      const middleware = tokenBudgetMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect((mockRequest as any).budgetContext.estimatedTokens).toBe(1000); // Default estimate
    });
  });

  describe("Token Usage Recorder", () => {
    test("should record usage when response contains usage data", async () => {
      // Setup budget context
      (mockRequest as any).budgetContext = {
        tenantId: testTenantId,
        estimatedTokens: 100,
        model: "gpt-4"
      };

      const middleware = tokenUsageRecorder();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Simulate response with usage data
      const responseData = {
        choices: [{ message: { content: "Hello!" } }],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 30,
          total_tokens: 80
        }
      };

      // Call the overridden json method
      await (mockResponse.json as jest.Mock)(responseData);

      // Verify usage was recorded (check database)
      const events = await db
        .select()
        .from(db.schema.tokenUsageEventsTable)
        .where(eq(db.schema.tokenUsageEventsTable.tenantId, testTenantId));

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].inputTokens).toBe(50);
      expect(events[0].outputTokens).toBe(30);
    });

    test("should fall back to estimated usage when actual not provided", async () => {
      (mockRequest as any).budgetContext = {
        tenantId: testTenantId,
        estimatedTokens: 100,
        model: "gpt-4"
      };

      const middleware = tokenUsageRecorder();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Simulate response without usage data
      const responseData = { choices: [{ message: { content: "Hello!" } }] };

      await (mockResponse.json as jest.Mock)(responseData);

      // Verify usage was recorded with estimates
      const events = await db
        .select()
        .from(db.schema.tokenUsageEventsTable)
        .where(eq(db.schema.tokenUsageEventsTable.tenantId, testTenantId));

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].inputTokens).toBe(70); // 70% of estimate
      expect(events[0].outputTokens).toBe(30); // 30% of estimate
    });
  });

  describe("Budget Headers Middleware", () => {
    test("should add budget information to response headers", async () => {
      (mockRequest as any).tenantId = testTenantId;

      // Add some usage
      await CostService.recordUsage({
        tenantId: testTenantId,
        eventId: `header-test-${Date.now()}`,
        model: "gpt-4",
        eventType: "prompt",
        inputTokens: 200,
        outputTokens: 0
      });

      const middleware = budgetHeadersMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          "X-Token-Remaining": "800", // 1000 - 200
          "X-Token-Limit": "1000",
          "X-Token-Usage-Percent": "20.0",
          "X-Budget-Status": "active"
        })
      );
    });

    test("should handle missing tenant context gracefully", async () => {
      // Don't add tenant context
      delete (mockRequest as any).tenantId;

      const middleware = budgetHeadersMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.set).not.toHaveBeenCalled();
    });

    test("should handle budget retrieval errors gracefully", async () => {
      (mockRequest as any).tenantId = "non-existent-tenant";

      const middleware = budgetHeadersMiddleware();
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.set).not.toHaveBeenCalled();
    });
  });

  describe("Middleware Integration", () => {
    test("should work together in complete flow", async () => {
      // Setup complete middleware chain
      const budgetMiddleware = tokenBudgetMiddleware();
      const headersMiddleware = budgetHeadersMiddleware();
      const recorderMiddleware = tokenUsageRecorder();

      (mockRequest as any).tenantId = testTenantId;

      // Execute middleware chain
      await budgetMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      await headersMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
      await recorderMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify budget check passed
      expect(mockNext).toHaveBeenCalledTimes(3);
      expect((mockRequest as any).budgetContext).toBeDefined();

      // Verify headers were set
      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          "X-Token-Remaining": "1000"
        })
      );

      // Simulate response and verify usage recording
      const responseData = {
        choices: [{ message: { content: "Hello!" } }],
        usage: { prompt_tokens: 50, completion_tokens: 25, total_tokens: 75 }
      };

      await (mockResponse.json as jest.Mock)(responseData);

      // Verify usage was recorded
      const events = await db
        .select()
        .from(db.schema.tokenUsageEventsTable)
        .where(eq(db.schema.tokenUsageEventsTable.tenantId, testTenantId));

      expect(events.length).toBeGreaterThan(0);
    });
  });
});
