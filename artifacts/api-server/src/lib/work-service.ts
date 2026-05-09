/**
 * @file        artifacts/api-server/src/lib/work-service.ts
 * @module      API Server / Work Service
 * @purpose     Business logic for work management (projects, tasks, templates)
 *
 * @ai_instructions
 *   - Follow existing service patterns from agent-service.ts and approval-service.ts
 *   - Use proper transaction handling for template instantiation
 *   - Implement optimistic concurrency with updatedAt checks
 *   - Use Zod schemas for validation from @workspace/api-zod
 *   - Handle tenant isolation properly
 *   - Include proper error handling and logging
 *
 * @exports     WorkService class with methods for project/task/template operations
 * @imports     drizzle-orm, schema types, Zod schemas
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { 
  eq, 
  and, 
  desc, 
  asc, 
  ilike, 
  count,
  inArray 
} from "drizzle-orm";
import { db } from "@workspace/db";
import { 
  projects, 
  tasks, 
  taskComments, 
  taskDependencies, 
  projectTemplates, 
  templateTasks,
  type Project,
  type Task,
  type TaskComment,
  type TaskDependency,
  type ProjectTemplate,
  type TemplateTask,
  type InsertProject,
  type InsertTask,
  type InsertTaskComment,
  type InsertTaskDependency,
  type InsertProjectTemplate,
  type InsertTemplateTask
} from "@workspace/db/schema";
import { 
  CreateProjectBody,
  CreateTaskBody, 
  UpdateTaskBody,
  MoveTaskBody,
  AddTaskCommentBody,
  AddTaskDependencyBody,
  CreateTemplateBody,
  InstantiateTemplateBody
} from "@workspace/api-zod";

export class WorkService {
  /**
   * Create a new project
   */
  async createProject(tenantId: string, data: any): Promise<Project> {
    const validatedData = CreateProjectBody.parse(data);
    
    const [project] = await db
      .insert(projects)
      .values({
        ...validatedData,
        tenant_id: tenantId,
        color: validatedData.color || "#3B82F6"
      })
      .returning();
    
    return project;
  }

  /**
   * List projects with filtering and pagination
   */
  async listProjects(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      clientId?: string;
    } = {}
  ) {
    const { page = 1, limit = 20, status, clientId } = options;
    const offset = (page - 1) * limit;

    let whereConditions = [eq(projects.tenant_id, tenantId)];
    
    if (status) {
      whereConditions.push(eq(projects.status, status as any));
    }
    
    if (clientId) {
      whereConditions.push(eq(projects.client_id, clientId));
    }

    const [projectList, totalCount] = await Promise.all([
      db
        .select()
        .from(projects)
        .where(and(...whereConditions))
        .orderBy(desc(projects.updated_at))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(projects)
        .where(and(...whereConditions))
        .then(result => result[0].count)
    ]);

    return {
      projects: projectList,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Get project details with task counts
   */
  async getProject(tenantId: string, projectId: string) {
    const [project, taskCounts] = await Promise.all([
      db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.tenant_id, tenantId)))
        .then(result => result[0]),
      
      Promise.all([
        db.select({ count: count() }).from(tasks).where(eq(tasks.project_id, projectId)),
        db.select({ count: count() }).from(tasks).where(and(eq(tasks.project_id, projectId), eq(tasks.status, 'backlog'))),
        db.select({ count: count() }).from(tasks).where(and(eq(tasks.project_id, projectId), eq(tasks.status, 'in-progress'))),
        db.select({ count: count() }).from(tasks).where(and(eq(tasks.project_id, projectId), eq(tasks.status, 'in-review'))),
        db.select({ count: count() }).from(tasks).where(and(eq(tasks.project_id, projectId), eq(tasks.status, 'done')))
      ]).then(([total, backlog, inProgress, inReview, done]) => ({
        total: total[0].count,
        backlog: backlog[0].count,
        inProgress: inProgress[0].count,
        inReview: inReview[0].count,
        done: done[0].count
      }))
    ]);

    if (!project) {
      throw new Error('Project not found');
    }

    return {
      project,
      taskCounts
    };
  }

  /**
   * Create a new task within a project
   */
  async createTask(tenantId: string, projectId: string, data: any): Promise<Task> {
    const validatedData = CreateTaskBody.parse(data);
    
    // Verify project exists and belongs to tenant
    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.tenant_id, tenantId)))
      .then(result => result[0]);
    
    if (!project) {
      throw new Error('Project not found');
    }

    const [task] = await db
      .insert(tasks)
      .values({
        ...validatedData,
        tenant_id: tenantId,
        project_id: projectId,
        order_index: validatedData.orderIndex ?? 0
      })
      .returning();
    
    return task;
  }

  /**
   * List tasks for a project with filtering and pagination
   */
  async listTasks(
    tenantId: string,
    projectId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      priority?: string;
      assignedAgentId?: string;
      search?: string;
    } = {}
  ) {
    const { page = 1, limit = 20, status, priority, assignedAgentId, search } = options;
    const offset = (page - 1) * limit;

    // Verify project exists and belongs to tenant
    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.tenant_id, tenantId)))
      .then(result => result[0]);
    
    if (!project) {
      throw new Error('Project not found');
    }

    let whereConditions = [
      eq(tasks.project_id, projectId),
      eq(tasks.tenant_id, tenantId)
    ];
    
    if (status) {
      whereConditions.push(eq(tasks.status, status as any));
    }
    
    if (priority) {
      whereConditions.push(eq(tasks.priority, priority as any));
    }
    
    if (assignedAgentId) {
      whereConditions.push(eq(tasks.assigned_agent_id, assignedAgentId));
    }
    
    if (search) {
      whereConditions.push(ilike(tasks.title, `%${search}%`));
    }

    const [taskList, totalCount] = await Promise.all([
      db
        .select()
        .from(tasks)
        .where(and(...whereConditions))
        .orderBy(asc(tasks.order_index), desc(tasks.created_at))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(tasks)
        .where(and(...whereConditions))
        .then(result => result[0].count)
    ]);

    return {
      tasks: taskList,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Update task fields with optimistic concurrency
   */
  async updateTask(tenantId: string, taskId: string, data: any): Promise<Task> {
    const validatedData = UpdateTaskBody.parse(data);
    
    const existingTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.tenant_id, tenantId)))
      .then(result => result[0]);
    
    if (!existingTask) {
      throw new Error('Task not found');
    }

    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...validatedData,
        updated_at: new Date()
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.tenant_id, tenantId)))
      .returning();
    
    return updatedTask;
  }

  /**
   * Move task to new status with optional order index
   */
  async moveTask(tenantId: string, taskId: string, data: any): Promise<Task> {
    const validatedData = MoveTaskBody.parse(data);
    
    const existingTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.tenant_id, tenantId)))
      .then(result => result[0]);
    
    if (!existingTask) {
      throw new Error('Task not found');
    }

    const [updatedTask] = await db
      .update(tasks)
      .set({
        status: validatedData.status,
        order_index: validatedData.orderIndex ?? existingTask.order_index,
        updated_at: new Date()
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.tenant_id, tenantId)))
      .returning();
    
    return updatedTask;
  }

  /**
   * Add comment to task
   */
  async addTaskComment(tenantId: string, taskId: string, authorId: string, data: any): Promise<TaskComment> {
    const validatedData = AddTaskCommentBody.parse(data);
    
    // Verify task exists and belongs to tenant
    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.tenant_id, tenantId)))
      .then(result => result[0]);
    
    if (!task) {
      throw new Error('Task not found');
    }

    const [comment] = await db
      .insert(taskComments)
      .values({
        task_id: taskId,
        author_id: authorId,
        content: validatedData.content
      })
      .returning();
    
    return comment;
  }

  /**
   * Add dependency between tasks
   */
  async addTaskDependency(tenantId: string, taskId: string, data: any): Promise<TaskDependency> {
    const validatedData = AddTaskDependencyBody.parse(data);
    
    // Verify both tasks exist and belong to tenant
    const [dependentTask, dependencyTask] = await Promise.all([
      db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.tenant_id, tenantId)))
        .then(result => result[0]),
      db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, validatedData.dependencyTaskId), eq(tasks.tenant_id, tenantId)))
        .then(result => result[0])
    ]);
    
    if (!dependentTask) {
      throw new Error('Task not found');
    }
    
    if (!dependencyTask) {
      throw new Error('Dependency task not found');
    }

    if (taskId === validatedData.dependencyTaskId) {
      throw new Error('Task cannot depend on itself');
    }

    const [dependency] = await db
      .insert(taskDependencies)
      .values({
        tenant_id: tenantId,
        dependent_task_id: taskId,
        dependency_task_id: validatedData.dependencyTaskId
      })
      .returning();
    
    return dependency;
  }

  /**
   * List project templates
   */
  async listTemplates(tenantId: string, category?: string) {
    let whereConditions = [eq(projectTemplates.tenant_id, tenantId)];
    
    if (category) {
      whereConditions.push(eq(projectTemplates.category, category));
    }

    const templateList = await db
      .select()
      .from(projectTemplates)
      .where(and(...whereConditions))
      .orderBy(desc(projectTemplates.updated_at));

    return { templates: templateList };
  }

  /**
   * Create project template with tasks
   */
  async createTemplate(tenantId: string, data: any): Promise<ProjectTemplate> {
    const validatedData = CreateTemplateBody.parse(data);
    
    const template = await db.transaction(async (tx) => {
      const [template] = await tx
        .insert(projectTemplates)
        .values({
          tenant_id: tenantId,
          name: validatedData.name,
          description: validatedData.description,
          category: validatedData.category
        })
        .returning();

      if (validatedData.tasks && validatedData.tasks.length > 0) {
        await tx
          .insert(templateTasks)
          .values(
            validatedData.tasks.map((task: any) => ({
              template_id: template.id,
              title: task.title,
              description: task.description,
              status: 'backlog',
              priority: task.priority || 'medium',
              order_index: task.orderIndex || 0
            }))
          );
      }

      return template;
    });

    return template;
  }

  /**
   * Create project from template
   */
  async instantiateTemplate(tenantId: string, templateId: string, data: any): Promise<Project> {
    const validatedData = InstantiateTemplateBody.parse(data);
    
    const project = await db.transaction(async (tx) => {
      // Verify template exists and belongs to tenant
      const template = await tx
        .select()
        .from(projectTemplates)
        .where(and(eq(projectTemplates.id, templateId), eq(projectTemplates.tenant_id, tenantId)))
        .then(result => result[0]);
      
      if (!template) {
        throw new Error('Template not found');
      }

      // Create project
      const [project] = await tx
        .insert(projects)
        .values({
          tenant_id: tenantId,
          name: validatedData.projectName,
          description: validatedData.description,
          color: validatedData.color || "#3B82F6",
          client_id: validatedData.clientId
        })
        .returning();

      // Get template tasks
      const templateTasksList = await tx
        .select()
        .from(templateTasks)
        .where(eq(templateTasks.template_id, templateId))
        .orderBy(asc(templateTasks.order_index));

      // Create tasks from template
      if (templateTasksList.length > 0) {
        await tx
          .insert(tasks)
          .values(
            templateTasksList.map((templateTask: any) => ({
              tenant_id: tenantId,
              project_id: project.id,
              title: templateTask.title,
              description: templateTask.description,
              status: templateTask.status,
              priority: templateTask.priority,
              order_index: templateTask.order_index,
              billable: false
            }))
          );
      }

      return project;
    });

    return project;
  }
}

export const workService = new WorkService();
