/**
 * @file        artifacts/api-server/src/routes/approvals.ts
 * @module      API Server / Routes / Approvals
 * @purpose     Approval workflow endpoints for listing and deciding on approval requests
 *
 * @ai_instructions
 *   - Use requireAuth and requirePermission middleware for authentication
 *   - Use validateRequest middleware for query, parameter, and body validation
 *   - Delegate business logic to approvalService
 *   - Follow error handling patterns with asyncHandler
 *   - Return responses matching OpenAPI specification
 *
 * @exports     Express router with approval endpoints
 * @imports     express, @workspace/api-zod, middlewares, services
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/require-auth";
import { requirePermission } from "../middlewares/require-permission";
import { validateRequest, commonSchemas } from "../middlewares/validate-request";
import { asyncHandler } from "../middlewares/error-handler";
import { approvalService } from "../lib/approval-service";

const router: IRouter = Router();

// Query schemas for validation
const listApprovalsQuerySchema = z.object({
  page: commonSchemas.paginationQuery.shape.page.optional(),
  limit: commonSchemas.paginationQuery.shape.limit.optional(),
  status: z.enum(["pending", "approved", "rejected", "expired"]).optional().default("pending")
});

const approvalIdParamSchema = commonSchemas.uuidParam;

// Body schema for approval decision
const approvalDecisionBodySchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  comment: z.string().optional()
});

/**
 * GET /approvals
 * List approval requests with pagination and optional status filter
 */
router.get(
  "/approvals",
  requireAuth,
  requirePermission(["approvals:read"]),
  validateRequest({ query: listApprovalsQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status = "pending" } = req.query as {
      page?: number;
      limit?: number;
      status?: string;
    };

    const result = await approvalService.listApprovals({
      page: Number(page),
      limit: Number(limit),
      status,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

/**
 * POST /approvals/:id/decide
 * Record decision on an approval request and update agent status
 */
router.post(
  "/approvals/:id/decide",
  requireAuth,
  requirePermission(["approvals:write"]),
  validateRequest({ 
    params: approvalIdParamSchema,
    body: approvalDecisionBodySchema
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const { decision, comment } = req.body as {
      decision: "approved" | "rejected";
      comment?: string;
    };

    const result = await approvalService.decideApproval({
      approvalRequestId: id,
      decision,
      comment,
      decidedBy: req.user!.id,
      decidedByName: req.user!.id, // TODO: Get actual user name from Clerk
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

export default router;
