/**
 * @file        artifacts/api-server/src/routes/examples.ts
 * @module      API Server / Routes / Examples
 * @purpose     Example routes demonstrating middleware usage
 *
 * @ai_instructions
 *   - Demonstrates proper middleware composition
 *   - Shows validation, authentication, and authorization patterns
 *   - Use as reference for implementing protected routes
 *   - DO NOT use for production features
 *
 * @exports     Express router with example endpoints
 * @imports     express, @workspace/api-zod, middlewares
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/require-auth";
import { requirePermission, requireAdmin } from "../middlewares/require-permission";
import { validateRequest, commonSchemas } from "../middlewares/validate-request";
import { asyncHandler, ErrorTypes } from "../middlewares/error-handler";

const router: IRouter = Router();

/**
 * Example: Public endpoint (no authentication required)
 */
router.get("/examples/public", (_req, res) => {
  res.json({
    message: "This is a public endpoint",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Example: Authenticated endpoint (requires valid session)
 */
router.get(
  "/examples/authenticated",
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json({
      message: "This endpoint requires authentication",
      user: {
        id: _req.user?.id,
        role: _req.user?.role,
        tenantId: _req.user?.tenantId,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * Example: Permission-protected endpoint
 */
router.get(
  "/examples/permission-protected",
  requireAuth,
  requirePermission(["agents:read"]),
  asyncHandler(async (_req, res) => {
    res.json({
      message: "This endpoint requires agents:read permission",
      user: {
        id: _req.user?.id,
        role: _req.user?.role,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * Example: Admin-only endpoint
 */
router.get(
  "/examples/admin-only",
  requireAuth,
  requireAdmin,
  asyncHandler(async (_req, res) => {
    res.json({
      message: "This endpoint is for admins only",
      user: {
        id: _req.user?.id,
        role: _req.user?.role,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * Example: Validated POST endpoint
 */
router.post(
  "/examples/validated",
  requireAuth,
  validateRequest({
    body: z.object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
      role: z.enum(["member", "viewer"]).optional(),
    }),
    query: commonSchemas.paginationQuery,
  }),
  asyncHandler(async (req, res) => {
    res.json({
      message: "Request validated successfully",
      data: {
        body: req.body,
        query: req.query,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * Example: Parameter validation
 */
router.get(
  "/examples/param/:id",
  validateRequest({
    params: commonSchemas.uuidParam,
  }),
  asyncHandler(async (req, res) => {
    res.json({
      message: "Parameter validated successfully",
      data: {
        id: req.params.id,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * Example: Multiple permissions required (user needs at least one)
 */
router.get(
  "/examples/multi-permission",
  requireAuth,
  requirePermission(["agents:write", "chat:write"]),
  asyncHandler(async (_req, res) => {
    res.json({
      message: "This endpoint requires agents:write OR chat:write permission",
      user: {
        id: _req.user?.id,
        role: _req.user?.role,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * Example: Error handling demonstration
 */
router.get(
  "/examples/error-demo",
  requireAuth,
  asyncHandler(async (_req, res) => {
    // This will be caught by the global error handler
    throw ErrorTypes.ValidationError("This is a demonstration error", {
      field: "demo",
      value: "error",
    });
  })
);

export default router;
