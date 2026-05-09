/**
 * @file        artifacts/api-server/src/routes/index.ts
 * @module      API Server / Routes
 * @purpose     Route aggregation and mount point for all API endpoints
 *
 * @ai_instructions
 *   - All route modules must be imported and mounted here.
 *   - Route order matters for middleware and path matching.
 *   - Health routes should be mounted first for monitoring.
 *   - DO NOT add routes without updating API documentation.
 *
 * @exports     Express router with all sub-routes mounted
 * @imports     express, ./health
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Router, type IRouter } from "express";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);

export default router;
