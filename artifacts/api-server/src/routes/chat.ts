/**
 * @file        artifacts/api-server/src/routes/chat.ts
 * @module      API Server / Routes / Chat
 * @purpose     Chat API routes with REST operations and SSE streaming
 *
 * @ai_instructions
 *   - All endpoints must use authentication and authorization middleware
 *   - Use Zod schemas from @workspace/api-zod for request validation
 *   - SSE streaming endpoint should handle connection management properly
 *   - Follow Express router patterns and error handling
 *   - Include proper TypeScript types and JSDoc comments
 *
 * @exports     Express router with chat endpoints
 * @imports     express, middleware, chat services, validation schemas
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Router, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../middlewares/require-auth";
import { requirePermission, requireSinglePermission } from "../middlewares/require-permission";
import { validateRequest } from "../middlewares/validate-request";
import { globalErrorHandler } from "../middlewares/error-handler";
import { chatService } from "../lib/chat-service";
import { chatStreamService } from "../lib/chat-stream";
import type {
  CreateThreadRequest,
  UpdateThreadRequest,
  SendMessageRequest,
  EditMessageRequest,
  FeedbackRequest,
  GenerateSummaryRequest,
  UpdateGroundingRequest
} from "@workspace/api-zod";

const router = Router();

// Apply authentication middleware to all chat routes
router.use(requireAuth);
router.use(requireSinglePermission("chat:read"));

/**
 * POST /threads
 * Create a new chat thread
 */
router.post("/threads", 
  requireSinglePermission("chat:write"),
  validateRequest({ body: CreateThreadRequest }),
  async (req: Request, res: Response) => {
    try {
      const thread = await chatService.createThread(req.body, req.tenantId!, req.user!.id);
      res.status(201).json(thread);
    } catch (error) {
      globalErrorHandler(error, req, res, () => {});
    }
  }
);

/**
 * GET /threads
 * List chat threads for the tenant
 */
router.get("/threads",
  validateRequest({ 
    query: {
      page: { type: "number", default: 1, minimum: 1 },
      limit: { type: "number", default: 20, minimum: 1, maximum: 100 },
      projectId: { type: "string", optional: true },
      isActive: { type: "boolean", optional: true }
    }
  }),
  async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20, projectId, isActive } = req.query;
      const result = await chatService.listThreads({
        page: Number(page),
        limit: Number(limit),
        projectId: projectId as string,
        isActive: isActive ? isActive === "true" : undefined,
        tenantId: req.tenantId!
      });
      res.json(result);
    } catch (error) {
      globalErrorHandler(error, req, res, () => {});
    }
  }
);

/**
 * GET /threads/:id
 * Get thread details with all messages
 */
router.get("/threads/:id",
  async (req: Request, res: Response) => {
    try {
      const thread = await chatService.getThreadDetail(req.params.id, req.tenantId!);
      res.json(thread);
    } catch (error) {
      globalErrorHandler(error, req, res, () => {});
    }
  }
);

/**
 * PATCH /threads/:id
 * Update thread metadata
 */
router.patch("/threads/:id",
  requireSinglePermission("chat:write"),
  validateRequest({ body: UpdateThreadRequest }),
  async (req: Request, res: Response) => {
    try {
      const thread = await chatService.updateThread(req.params.id, req.body, req.tenantId!);
      res.json(thread);
    } catch (error) {
      globalErrorHandler(error, req, res, () => {});
    }
  }
);

/**
 * DELETE /threads/:id
 * Soft-delete a thread
 */
router.delete("/threads/:id",
  requireSinglePermission("chat:write"),
  async (req: Request, res: Response) => {
    try {
      await chatService.deleteThread(req.params.id, req.tenantId!);
      res.status(204).send();
    } catch (error) {
      globalErrorHandler(error, req, res, () => {});
    }
  }
);

/**
 * POST /threads/:id/messages
 * Send a message to a thread
 */
router.post("/threads/:id/messages",
  requireSinglePermission("chat:write"),
  validateRequest({ body: SendMessageRequest }),
  async (req: Request, res: Response) => {
    try {
      const message = await chatService.sendMessage(
        req.params.id,
        req.body,
        req.tenantId!,
        req.user!.id
      );
      res.status(201).json(message);
    } catch (error) {
      globalErrorHandler(error, req, res, () => {});
    }
  }
);

/**
 * GET /threads/:id/stream
 * SSE endpoint for streaming assistant responses
 */
router.get("/threads/:id/stream",
  requirePermission("chat:read"),
  async (req: Request, res: Response) => {
    try {
      const { messageId } = req.query;
      
      if (!messageId || typeof messageId !== "string") {
        return res.status(400).json({
          error: "Bad Request",
          message: "messageId query parameter is required",
          statusCode: 400
        });
      }

      // Set SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Important for nginx

      // Generate client ID for this connection
      const clientId = randomUUID();
      
      // Handle client disconnect
      req.on("close", () => {
        chatStreamService.removeClient(clientId);
      });

      // Start streaming
      await chatStreamService.streamResponse(
        clientId,
        req.params.id,
        messageId,
        req.tenantId!,
        req.user!.id,
        res
      );
    } catch (error) {
      globalErrorHandler(error, req, res, () => {});
    }
  }
);

/**
 * PATCH /messages/:id
 * Edit a message (creates a new version)
 */
router.patch("/messages/:id",
  requireSinglePermission("chat:write"),
  validateRequest({ body: EditMessageRequest }),
  async (req: Request, res: Response) => {
    try {
      const message = await chatService.editMessage(
        req.params.id,
        req.body,
        req.tenantId!,
        req.user!.id
      );
      res.json(message);
    } catch (error) {
      globalErrorHandler(error, req, res, () => {});
    }
  }
);

/**
 * POST /messages/:id/feedback
 * Submit feedback on a message
 */
router.post("/messages/:id/feedback",
  requireSinglePermission("chat:write"),
  validateRequest({ body: FeedbackRequest }),
  async (req: Request, res: Response) => {
    try {
      const feedback = await chatService.submitFeedback(
        req.params.id,
        req.body,
        req.tenantId!,
        req.user!.id
      );
      res.status(201).json(feedback);
    } catch (error) {
      globalErrorHandler(error, req, res, () => {});
    }
  }
);

/**
 * POST /threads/:id/summarize
 * Generate or regenerate thread summary
 */
router.post("/threads/:id/summarize",
  requireSinglePermission("chat:write"),
  validateRequest({ body: GenerateSummaryRequest }),
  async (req: Request, res: Response) => {
    try {
      const job = await chatService.generateSummary(
        req.params.id,
        req.body.forceRegenerate || false,
        req.tenantId!
      );
      res.status(202).json(job);
    } catch (error) {
      globalErrorHandler(error, req, res, () => {});
    }
  }
);

/**
 * POST /threads/:id/grounding
 * Update grounding mode for a thread
 */
router.post("/threads/:id/grounding",
  requireSinglePermission("chat:write"),
  validateRequest({ body: UpdateGroundingRequest }),
  async (req: Request, res: Response) => {
    try {
      const thread = await chatService.updateGroundingMode(
        req.params.id,
        req.body.groundingMode,
        req.tenantId!
      );
      res.json(thread);
    } catch (error) {
      globalErrorHandler(error, req, res, () => {});
    }
  }
);

export default router;
