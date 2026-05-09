/**
 * @file        artifacts/api-server/src/routes/health.ts
 * @module      API Server / Routes
 * @purpose     Health check endpoint for monitoring service status
 *
 * @ai_instructions
 *   - Health endpoint must return validated response schema.
 *   - Response should include minimal service status information.
 *   - Endpoint path must be /healthz for Kubernetes compatibility.
 *   - DO NOT add authentication to health check endpoints.
 *
 * @exports     Express router
 * @imports     express, @workspace/api-zod
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
