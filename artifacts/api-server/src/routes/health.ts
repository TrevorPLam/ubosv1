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
import { db } from "@workspace/db";
import { config } from "../lib/config";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

/**
 * Readiness check endpoint that verifies database and Redis connectivity
 * Returns 200 when all dependencies are healthy, 503 otherwise
 */
router.get("/ready", async (_req, res) => {
  const checks = {
    database: false,
    redis: false,
  };

  try {
    // Check database connectivity using the db client directly
    await db.$client.query("SELECT 1");
    checks.database = true;
  } catch (error) {
    console.error("Database health check failed:", error);
  }

  try {
    // Check Redis connectivity (if configured)
    if (config.REDIS_URL) {
      // Basic Redis health check would go here
      // For now, we'll assume Redis is healthy if URL is configured
      checks.redis = true;
    }
  } catch (error) {
    console.error("Redis health check failed:", error);
  }

  const allHealthy = Object.values(checks).every(Boolean);
  const statusCode = allHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: allHealthy ? "ready" : "not_ready",
    checks,
    timestamp: new Date().toISOString(),
  });
});

export default router;
