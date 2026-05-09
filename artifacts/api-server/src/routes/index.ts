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
import examplesRouter from "./examples";
import agentsRouter from "./agents";
import approvalsRouter from "./approvals";
import chatRouter from "./chat";
import projectsRouter from "./projects";
import tasksRouter from "./tasks";
import { clientsRouter } from "./clients";
import { crmRouter } from "./crm";
import { agreementsRouter } from "./agreements";
import filesRouter from "./files";
import documentsRouter from "./documents";
import knowledgeRouter from "./knowledge";
import { emailRouter } from "./email";
import assetsRouter from "./assets";
import assetCategoriesRouter from "./asset-categories";
import financeRouter from "./finance";

const router: IRouter = Router();

// Health routes (no authentication)
router.use(healthRouter);

// Example routes (demonstrating middleware usage)
router.use(examplesRouter);

// Agent management routes
router.use(agentsRouter);

// Approval workflow routes
router.use(approvalsRouter);

// Chat and conversation routes
router.use(chatRouter);

// Work management routes
router.use(projectsRouter);
router.use(tasksRouter);

// Client management routes
router.use(clientsRouter);

// CRM and pipeline routes
router.use(crmRouter);

// Agreement management routes
router.use(agreementsRouter);

// File storage and upload routes
router.use("/files", filesRouter);

// Document management routes
router.use("/documents", documentsRouter);

// Knowledge base and certification routes
router.use("/knowledge", knowledgeRouter);

// Email management routes
router.use("/email", emailRouter);

// Asset management routes
router.use("/assets", assetsRouter);
router.use("/asset-categories", assetCategoriesRouter);

// Finance and accounting routes
router.use(financeRouter);

export default router;
