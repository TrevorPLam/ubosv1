/**
 * @file        artifacts/api-server/src/routes/projects.ts
 * @module      API Server / Project Routes
 * @purpose     REST API endpoints for project management
 *
 * @ai_instructions
 *   - Follow existing route patterns from agents.ts and approvals.ts
 *   - Use proper middleware for authentication and authorization
 *   - Include request validation with Zod schemas
 *   - Handle errors consistently with proper HTTP status codes
 *   - Include proper TypeScript types
 *
 * @exports     Express router with project endpoints
 * @imports     Express, work service, middleware, Zod schemas
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth";
import { requirePermission } from "../middlewares/require-permission";
import { validateRequest } from "../middlewares/validate-request";
import { workService } from "../lib/work-service";
import { z } from "zod";
import type { Request } from "express";

// Extend Request type to include tenant context
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    tenantId: string;
    organizationId: string;
  };
}

const router = Router();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z.string().optional(),
  clientId: z.string().uuid().optional()
});

const listProjectsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(["active", "archived"]).optional(),
  clientId: z.string().uuid().optional()
});

const getProjectSchema = z.object({
  id: z.string().uuid()
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().optional(),
  tasks: z.array(z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    orderIndex: z.number().default(0)
  })).optional()
});

const listTemplatesSchema = z.object({
  category: z.string().optional()
});

const instantiateTemplateSchema = z.object({
  projectName: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z.string().optional(),
  clientId: z.string().uuid().optional()
});

/**
 * POST /projects
 * Create a new project
 */
router.post(
  "/",
  requireAuth,
  requirePermission(["projects:write"]),
  validateRequest({ body: createProjectSchema }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const project = await workService.createProject(req.user.tenantId, req.body);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

/**
 * GET /projects
 * List projects with filtering and pagination
 */
router.get(
  "/",
  requireAuth,
  requirePermission(["projects:read"]),
  validateRequest({ query: listProjectsSchema }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await workService.listProjects(req.user.tenantId, req.query);
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

/**
 * GET /projects/:id
 * Get project details with task counts
 */
router.get(
  "/:id",
  requireAuth,
  requirePermission(["projects:read"]),
  validateRequest({ params: getProjectSchema }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await workService.getProject(req.user.tenantId, req.params.id);
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "Project not found") {
        res.status(404).json({ error: "Project not found" });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

/**
 * GET /templates
 * List project templates
 */
router.get(
  "/templates",
  requireAuth,
  requirePermission(["templates:read"]),
  validateRequest({ query: listTemplatesSchema }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await workService.listTemplates(req.user.tenantId, req.query.category);
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

/**
 * POST /templates
 * Create project template
 */
router.post(
  "/templates",
  requireAuth,
  requirePermission(["templates:write"]),
  validateRequest({ body: createTemplateSchema }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const template = await workService.createTemplate(req.user.tenantId, req.body);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

/**
 * POST /templates/:id/instantiate
 * Create project from template
 */
router.post(
  "/templates/:id/instantiate",
  requireAuth,
  requirePermission(["projects:write"]),
  validateRequest({ 
    params: getProjectSchema,
    body: instantiateTemplateSchema 
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const project = await workService.instantiateTemplate(
        req.user.tenantId, 
        req.params.id, 
        req.body
      );
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof Error && error.message === "Template not found") {
        res.status(404).json({ error: "Template not found" });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

export default router;
