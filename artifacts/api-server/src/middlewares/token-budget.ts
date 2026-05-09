/**
 * @file        artifacts/api-server/src/middlewares/token-budget.ts
 * @module      API Server / Middleware / Token Budget
 * @purpose     Middleware for pre-invocation token budget enforcement
 *
 * @ai_instructions
 *   - Implement budget checking before LLM calls
 *   - Extract tenant ID from request context
 *   - Estimate token usage from request body
 *   - Return proper HTTP status codes for budget violations
 *   - Follow Express middleware patterns
 *
 * @exports     tokenBudgetMiddleware factory function
 * @imports     CostService, Express types
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Request, Response, NextFunction } from "express";
import { CostService, BudgetExceededError } from "../lib/cost-service";
import { z } from "zod";

/**
 * Token budget estimation schema for different request types
 */
const tokenEstimationSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.string(),
    content: z.string()
  })).optional(),
  prompt: z.string().optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().optional()
});

/**
 * Estimate token count based on text content
 * This is a rough estimation - in production, you'd use a proper tokenizer
 * @param text - Text content to estimate tokens for
 * @returns Estimated token count
 */
function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token for English text
  // This is conservative - actual tokenization varies by model
  return Math.ceil(text.length / 4);
}

/**
 * Estimate total tokens for a request based on request body
 * @param requestBody - The request body containing LLM call parameters
 * @returns Estimated total token usage (input + output)
 */
function estimateRequestTokens(requestBody: any): number {
  try {
    const validated = tokenEstimationSchema.parse(requestBody);
    
    let inputTokens = 0;
    
    // Estimate tokens from messages array (chat format)
    if (validated.messages) {
      for (const message of validated.messages) {
        inputTokens += estimateTokens(message.content);
      }
    }
    
    // Estimate tokens from direct prompt
    if (validated.prompt) {
      inputTokens += estimateTokens(validated.prompt);
    }
    
    // Estimate output tokens (conservative estimate)
    // Most models use similar input/output token ratios
    const outputTokens = validated.maxTokens || Math.min(inputTokens, 2048);
    
    return inputTokens + outputTokens;
  } catch (error) {
    // If we can't estimate, use a conservative default
    console.warn("Failed to estimate tokens for request, using default:", error);
    return 1000; // Conservative default estimate
  }
}

/**
 * Middleware factory for token budget enforcement
 * @param options - Configuration options
 * @returns Express middleware function
 */
export function tokenBudgetMiddleware(options: {
  skipPaths?: string[];
  strictMode?: boolean;
} = {}) {
  const { skipPaths = [], strictMode = true } = options;
  
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip budget check for certain paths (health checks, etc.)
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Only apply to LLM-related endpoints
    const llmEndpoints = [
      "/api/chat",
      "/api/agents",
      "/api/completions",
      "/api/embeddings"
    ];
    
    if (!llmEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
      return next();
    }
    
    try {
      // Extract tenant ID from request context (set by auth middleware)
      const tenantId = (req as any).tenantId;
      if (!tenantId) {
        return res.status(401).json({
          error: "Tenant context required for budget enforcement",
          statusCode: 401
        });
      }
      
      // Estimate token usage for this request
      const estimatedTokens = estimateRequestTokens(req.body);
      
      // Check budget before proceeding
      await CostService.checkBudget(tenantId, estimatedTokens);
      
      // Add budget context to request for later usage recording
      (req as any).budgetContext = {
        tenantId,
        estimatedTokens,
        model: req.body?.model || "unknown"
      };
      
      next();
    } catch (error) {
      if (error instanceof BudgetExceededError) {
        return res.status(429).json({
          error: "Token budget exceeded",
          message: error.message,
          statusCode: 429,
          details: {
            currentUsage: error.currentUsage,
            monthlyLimit: error.monthlyLimit,
            resetDate: error.resetDate
          }
        });
      }
      
      // Log unexpected errors and continue (fail open in strict mode is off)
      console.error("Budget check failed:", error);
      
      if (strictMode) {
        return res.status(500).json({
          error: "Budget enforcement failed",
          message: "Unable to verify token budget",
          statusCode: 500
        });
      } else {
        // Fail open - allow request but log warning
        console.warn("Proceeding with request due to budget check failure");
        next();
      }
    }
  };
}

/**
 * Middleware to record actual token usage after LLM call completes
 * This should be used in conjunction with the budget check middleware
 */
export function tokenUsageRecorder() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original res.json method
    const originalJson = res.json;
    
    // Override res.json to intercept response
    res.json = function(data: any) {
      // Extract usage information from response if available
      const budgetContext = (req as any).budgetContext;
      if (budgetContext && data.usage) {
        // Record actual usage if provided by LLM service
        recordTokenUsage(req, data.usage);
      } else if (budgetContext) {
        // Fall back to estimated usage if actual not available
        recordTokenUsage(req, {
          inputTokens: Math.floor(budgetContext.estimatedTokens * 0.7), // Rough split
          outputTokens: Math.floor(budgetContext.estimatedTokens * 0.3)
        });
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * Helper function to record token usage
 * @param req - Express request object
 * @param usage - Token usage information
 */
async function recordTokenUsage(req: Request, usage: {
  inputTokens: number;
  outputTokens: number;
  totalTokens?: number;
}): Promise<void> {
  try {
    const budgetContext = (req as any).budgetContext;
    if (!budgetContext) return;
    
    const eventId = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await CostService.recordUsage({
      tenantId: budgetContext.tenantId,
      eventId,
      model: budgetContext.model,
      eventType: "response", // Default to response type
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      agentRunId: req.body?.agentRunId,
      messageId: req.body?.messageId,
      userId: (req as any).user?.id,
      metadata: {
        endpoint: req.path,
        method: req.method,
        userAgent: req.get("User-Agent"),
        requestId: req.headers["x-request-id"]
      }
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error("Failed to record token usage:", error);
  }
}

/**
 * Middleware to add budget information to response headers
 * Useful for frontend display of remaining budget
 */
export function budgetHeadersMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) {
      return next();
    }
    
    try {
      const budget = await CostService.getTenantBudget(tenantId);
      if (budget) {
        const remainingTokens = budget.monthlyTokenLimit - budget.currentUsage;
        const usagePercent = (budget.currentUsage / budget.monthlyTokenLimit) * 100;
        
        res.set({
          "X-Token-Remaining": remainingTokens.toString(),
          "X-Token-Limit": budget.monthlyTokenLimit.toString(),
          "X-Token-Usage-Percent": usagePercent.toFixed(1),
          "X-Budget-Status": budget.status,
          "X-Budget-Reset": budget.resetDate
        });
      }
    } catch (error) {
      // Don't fail the request if we can't get budget info
      console.warn("Failed to get budget info for headers:", error);
    }
    
    next();
  };
}
