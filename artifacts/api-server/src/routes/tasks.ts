/**
 * @file        artifacts/api-server/src/routes/tasks.ts
 * @module      API Server / Task Routes
 * @purpose     REST API endpoints for task management
 *
 * @ai_instructions
 *   - Follow existing route patterns from agents.ts and approvals.ts
 *   - Use proper middleware for authentication and authorization
 *   - Include request validation with Zod schemas
 *   - Handle errors consistently with proper HTTP status codes
 *   - Include proper TypeScript types
 *
 * @exports     Express router with task endpoints
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
const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  assignedAgentId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  billable: z.boolean().default(false),
  orderIndex: z.number().default(0)
});

const listTasksSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(["backlog", "in-progress", "in-review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  assignedAgentId: z.string().uuid().optional(),
  search: z.string().optional()
});

const getTaskSchema = z.object({
  id: z.string().uuid()
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  assignedAgentId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  billable: z.boolean().optional(),
  orderIndex: z.number().optional()
});

const moveTaskSchema = z.object({
  status: z.enum(["backlog", "in-progress", "in-review", "done"]),
  orderIndex: z.number().optional()
});

const addCommentSchema = z.object({
  content: z.string().min(1).max(2000)
});

const addDependencySchema = z.object({
  dependencyTaskId: z.string().uuid()
});

/**
 * POST /projects/:projectId/tasks
 * Create a new task within a project
 */
router.post(
  "/projects/:projectId/tasks",
  requireAuth,
  requirePermission(["tasks:write"]),
  validateRequest({ 
    params: z.object({ projectId: z.string().uuid() }),
    body: createTaskSchema 
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const task = await workService.createTask(req.user.tenantId, req.params.projectId, req.body);
      res.status(201).json(task);
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
 * GET /projects/:projectId/tasks
 * List tasks for a project with filtering and pagination
 */
router.get(
  "/projects/:projectId/tasks",
  requireAuth,
  requirePermission(["tasks:read"]),
  validateRequest({ 
    params: z.object({ projectId: z.string().uuid() }),
    query: listTasksSchema 
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await workService.listTasks(req.user.tenantId, req.params.projectId, req.query);
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
 * PATCH /tasks/:id
 * Update task fields
 */
router.patch(
  "/:id",
  requireAuth,
  requirePermission(["tasks:write"]),
  validateRequest({ 
    params: getTaskSchema,
    body: updateTaskSchema 
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const task = await workService.updateTask(req.user.tenantId, req.params.id, req.body);
      res.json(task);
    } catch (error) {
      if (error instanceof Error && error.message === "Task not found") {
        res.status(404).json({ error: "Task not found" });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

/**
 * POST /tasks/:id/move
 * Move task to new status with optional order index
 */
router.post(
  "/:id/move",
  requireAuth,
  requirePermission(["tasks:write"]),
  validateRequest({ 
    params: getTaskSchema,
    body: moveTaskSchema 
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const task = await workService.moveTask(req.user.tenantId, req.params.id, req.body);
      res.json(task);
    } catch (error) {
      if (error instanceof Error && error.message === "Task not found") {
        res.status(404).json({ error: "Task not found" });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

/**
 * POST /tasks/:id/comments
 * Add comment to task
 */
router.post(
  "/:id/comments",
  requireAuth,
  requirePermission(["tasks:write"]),
  validateRequest({ 
    params: getTaskSchema,
    body: addCommentSchema 
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const comment = await workService.addTaskComment(
        req.user.tenantId, 
        req.params.id, 
        req.user.id, 
        req.body
      );
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof Error && error.message === "Task not found") {
        res.status(404).json({ error: "Task not found" });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

/**
 * POST /tasks/:id/dependencies
 * Add dependency between tasks
 */
router.post(
  "/:id/dependencies",
  requireAuth,
  requirePermission(["tasks:write"]),
  validateRequest({ 
    params: getTaskSchema,
    body: addDependencySchema 
  }),
  async (req: AuthenticatedRequest, res) => {
    try {
      const dependency = await workService.addTaskDependency(req.user.tenantId, req.params.id, req.body);
      res.status(201).json(dependency);
    } catch (error) {
      if (error instanceof Error && error.message === "Task not found") {
        res.status(404).json({ error: "Task not found" });
      } else if (error instanceof Error && error.message === "Dependency task not found") {
        res.status(404).json({ error: "Dependency task not found" });
      } else if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

export default router;
