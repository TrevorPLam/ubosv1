/**
 * @file        artifacts/api-server/src/routes/agents.ts
 * @module      API Server / Routes / Agents
 * @purpose     Agent management endpoints for listing and retrieving agent details
 *
 * @ai_instructions
 *   - Use requireAuth and requirePermission middleware for authentication
 *   - Use validateRequest middleware for query and parameter validation
 *   - Delegate business logic to agentService
 *   - Follow error handling patterns with asyncHandler
 *   - Return responses matching OpenAPI specification
 *
 * @exports     Express router with agent endpoints
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
import { asyncHandler, ErrorTypes } from "../middlewares/error-handler";
import { agentService } from "../lib/agent-service";

const router: IRouter = Router();

// Query schemas for validation
const listAgentsQuerySchema = z.object({
  page: commonSchemas.paginationQuery.shape.page.optional(),
  limit: commonSchemas.paginationQuery.shape.limit.optional(),
  status: z.enum(["idle", "thinking", "running-tool", "awaiting-approval", "error"]).optional()
});

const agentIdParamSchema = commonSchemas.uuidParam;

/**
 * GET /agents
 * List agents with pagination and optional status filter
 */
router.get(
  "/agents",
  requireAuth,
  requirePermission(["agents:read"]),
  validateRequest({ query: listAgentsQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status } = req.query as {
      page?: number;
      limit?: number;
      status?: string;
    };

    const result = await agentService.listAgents({
      page: Number(page),
      limit: Number(limit),
      status,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

/**
 * GET /agents/:id
 * Get detailed information about a specific agent including recent runs and tool calls
 */
router.get(
  "/agents/:id",
  requireAuth,
  requirePermission(["agents:read"]),
  validateRequest({ params: agentIdParamSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    const result = await agentService.getAgentDetail({
      agentId: id,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

export default router;
