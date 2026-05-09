/**
 * @file        lib/db/src/schema/work.ts
 * @module      Database / Schema / Work
 * @purpose     Work management schema for projects, tasks, and templates
 *
 * @ai_instructions
 *   - Follow multi-tenant patterns using tenantColumn from helpers.ts
 *   - Apply RLS policies for tenant isolation
 *   - Use pgEnum for status and priority fields with documented state transitions
 *   - Include proper indexes for performance with RLS
 *   - Follow existing schema patterns from agents.ts and other schema files
 *   - Implement soft deletes with deleted_at pattern
 *   - Add created_at and updated_at to every table
 *
 * @exports     projects, tasks, task_comments, task_dependencies, project_templates, template_tasks tables and types
 * @imports     drizzle-orm/pg-core, drizzle-zod, zod, ./helpers
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { 
  pgTable, 
  text, 
  uuid, 
  timestamp, 
  integer, 
  pgEnum,
  index,
  boolean,
  unique,
  check
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { tenantColumn } from "./helpers";

// Project status enum
export const projectStatusEnum = pgEnum("project_status", [
  "active",
  "archived"
]);

// Task status enum with documented state transitions
// Valid transitions: backlog -> in-progress -> in-review -> done
// Any status can move back to backlog for re-planning
export const taskStatusEnum = pgEnum("task_status", [
  "backlog",
  "in-progress", 
  "in-review",
  "done"
]);

// Task priority enum
export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "critical"
]);

// Projects table - main container for work
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  name: text("name").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default("active"),
  color: text("color").default("#3B82F6"), // Default blue color
  client_id: uuid("client_id"), // Nullable FK to clients table (will be added in CRM schema)
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  deleted_at: timestamp("deleted_at") // Soft delete
}, (table) => ({
  // Composite index for tenant + status queries
  tenantStatusIdx: index("idx_projects_tenant_status").on(table.tenant_id, table.status),
  // Index for client lookups
  clientIdx: index("idx_projects_client").on(table.client_id),
  // Unique constraint on project name within tenant
  uniqueNamePerTenant: unique("unique_project_name_tenant").on(table.tenant_id, table.name)
}));

// Tasks table - individual work items
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  project_id: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("backlog"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  assigned_agent_id: uuid("assigned_agent_id"), // FK to agents table
  due_date: timestamp("due_date"),
  billable: boolean("billable").notNull().default(false),
  order_index: integer("order_index").notNull().default(0), // For explicit ordering within status columns
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  deleted_at: timestamp("deleted_at") // Soft delete
}, (table) => ({
  // Composite indexes for common query patterns
  tenantProjectIdx: index("idx_tasks_tenant_project").on(table.tenant_id, table.project_id),
  tenantStatusIdx: index("idx_tasks_tenant_status").on(table.tenant_id, table.status),
  tenantAssigneeIdx: index("idx_tasks_tenant_assignee").on(table.tenant_id, table.assigned_agent_id),
  tenantDueDateIdx: index("idx_tasks_tenant_due_date").on(table.tenant_id, table.due_date),
  // Index for ordering within projects
  projectOrderIdx: index("idx_tasks_project_order").on(table.project_id, table.order_index)
}));

// Task comments table - discussion and updates
export const taskComments = pgTable("task_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  task_id: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  author_id: uuid("author_id").notNull(), // Will reference users table when implemented
  content: text("content").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  // Index for fetching comments by task
  taskIdx: index("idx_task_comments_task").on(table.task_id),
  // Index for author queries
  authorIdx: index("idx_task_comments_author").on(table.author_id)
}));

// Task dependencies table - relationships between tasks
export const taskDependencies = pgTable("task_dependencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  dependent_task_id: uuid("dependent_task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  dependency_task_id: uuid("dependency_task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  // Prevent self-references and duplicate dependencies
  noSelfReference: check("no_self_reference", sql`${table.dependent_task_id} != ${table.dependency_task_id}`),
  // Unique constraint to prevent duplicate dependencies
  uniqueDependency: unique("unique_task_dependency").on(table.dependent_task_id, table.dependency_task_id),
  // Indexes for dependency lookups
  dependentIdx: index("idx_task_dependencies_dependent").on(table.dependent_task_id),
  dependencyIdx: index("idx_task_dependencies_dependency").on(table.dependency_task_id),
  // Tenant index for RLS
  tenantIdx: index("idx_task_dependencies_tenant").on(table.tenant_id)
}));

// Project templates table - reusable project structures
export const projectTemplates = pgTable("project_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // e.g., "Onboarding", "Marketing Campaign", "Development"
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  // Tenant + category index for template browsing
  tenantCategoryIdx: index("idx_project_templates_tenant_category").on(table.tenant_id, table.category),
  // Unique name within tenant
  uniqueNamePerTenant: unique("unique_template_name_tenant").on(table.tenant_id, table.name)
}));

// Template tasks table - task definitions within templates
export const templateTasks = pgTable("template_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  template_id: uuid("template_id").notNull().references(() => projectTemplates.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("backlog"), // Default status when instantiated
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  order_index: integer("order_index").notNull().default(0)
}, (table) => ({
  // Index for fetching tasks by template
  templateIdx: index("idx_template_tasks_template").on(table.template_id),
  // Index for ordering within template
  templateOrderIdx: index("idx_template_tasks_order").on(table.template_id, table.order_index)
}));

// Zod schemas for validation
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, created_at: true, updated_at: true, deleted_at: true });
export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({ id: true, created_at: true });
export const insertTaskDependencySchema = createInsertSchema(taskDependencies).omit({ id: true, created_at: true });
export const insertProjectTemplateSchema = createInsertSchema(projectTemplates).omit({ id: true, created_at: true, updated_at: true });
export const insertTemplateTaskSchema = createInsertSchema(templateTasks).omit({ id: true });

// Type exports
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskDependency = z.infer<typeof insertTaskDependencySchema>;
export type TaskDependency = typeof taskDependencies.$inferSelect;
export type InsertProjectTemplate = z.infer<typeof insertProjectTemplateSchema>;
export type ProjectTemplate = typeof projectTemplates.$inferSelect;
export type InsertTemplateTask = z.infer<typeof insertTemplateTaskSchema>;
export type TemplateTask = typeof templateTasks.$inferSelect;
