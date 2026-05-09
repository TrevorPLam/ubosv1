/**
 * @file        artifacts/api-server/src/tests/work.integration.test.ts
 * @module      API Server / Work Integration Tests
 * @purpose     Integration tests for work management APIs (projects, tasks, templates)
 *
 * @ai_instructions
 *   - Follow existing test patterns from other integration tests
 *   - Test all CRUD operations for projects and tasks
 *   - Test task lifecycle (status transitions)
 *   - Test template creation and instantiation
 *   - Test task dependencies and comments
 *   - Use proper test data cleanup
 *
 * @exports     Integration test suite for work management
 * @imports     Jest, Express, work service, test utilities
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import request from "supertest";
import { app } from "../app";
import { db } from "@workspace/db";
import { workService } from "../lib/work-service";
import { 
  eq, 
  sql
} from "drizzle-orm";
import { 
  taskDependencies,
  taskComments,
  tasks,
  projectTemplates,
  templateTasks,
  projects
} from "@workspace/db/schema";

// Test data cleanup helper
const cleanupTestData = async (tenantId: string) => {
  await db.delete(taskDependencies).where(eq(taskDependencies.tenant_id, tenantId));
  await db.delete(taskComments).where(eq(taskComments.task_id, sql`(select id from tasks where tenant_id = ${tenantId})`));
  await db.delete(tasks).where(eq(tasks.tenant_id, tenantId));
  await db.delete(templateTasks).where(eq(templateTasks.template_id, sql`(select id from project_templates where tenant_id = ${tenantId})`));
  await db.delete(projectTemplates).where(eq(projectTemplates.tenant_id, tenantId));
  await db.delete(projects).where(eq(projects.tenant_id, tenantId));
};

describe("Work Management Integration Tests", () => {
  const testTenantId = "test-tenant-id";
  const testUserId = "test-user-id";
  const authHeaders = {
    "x-tenant-id": testTenantId,
    "x-user-id": testUserId,
    "authorization": "Bearer test-token"
  };

  beforeEach(async () => {
    await cleanupTestData(testTenantId);
  });

  afterAll(async () => {
    await cleanupTestData(testTenantId);
  });

  describe("Project CRUD Operations", () => {
    test("POST /projects - create project", async () => {
      const projectData = {
        name: "Test Project",
        description: "A test project",
        color: "#FF5722"
      };

      const response = await request(app)
        .post("/api/projects")
        .set(authHeaders)
        .send(projectData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: "Test Project",
        description: "A test project",
        color: "#FF5722",
        status: "active",
        tenant_id: testTenantId
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.created_at).toBeDefined();
    });

    test("GET /projects - list projects", async () => {
      // Create test project
      await workService.createProject(testTenantId, {
        name: "Test Project 1",
        description: "First test project"
      });

      const response = await request(app)
        .get("/api/projects")
        .set(authHeaders)
        .expect(200);

      expect(response.body.projects).toHaveLength(1);
      expect(response.body.projects[0]).toMatchObject({
        name: "Test Project 1",
        description: "First test project"
      });
      expect(response.body.pagination).toBeDefined();
    });

    test("GET /projects/:id - get project details", async () => {
      const project = await workService.createProject(testTenantId, {
        name: "Test Project",
        description: "A test project"
      });

      const response = await request(app)
        .get(`/api/projects/${project.id}`)
        .set(authHeaders)
        .expect(200);

      expect(response.body.project).toMatchObject({
        id: project.id,
        name: "Test Project",
        description: "A test project"
      });
      expect(response.body.taskCounts).toBeDefined();
    });
  });

  describe("Task CRUD Operations", () => {
    let testProject: any;

    beforeEach(async () => {
      testProject = await workService.createProject(testTenantId, {
        name: "Test Project",
        description: "A test project"
      });
    });

    test("POST /projects/:projectId/tasks - create task", async () => {
      const taskData = {
        title: "Test Task",
        description: "A test task",
        priority: "high"
      };

      const response = await request(app)
        .post(`/api/projects/${testProject.id}/tasks`)
        .set(authHeaders)
        .send(taskData)
        .expect(201);

      expect(response.body).toMatchObject({
        title: "Test Task",
        description: "A test task",
        priority: "high",
        status: "backlog",
        project_id: testProject.id,
        tenant_id: testTenantId
      });
    });

    test("GET /projects/:projectId/tasks - list tasks", async () => {
      // Create test tasks
      await workService.createTask(testTenantId, testProject.id, {
        title: "Task 1",
        priority: "low"
      });
      await workService.createTask(testTenantId, testProject.id, {
        title: "Task 2",
        priority: "high"
      });

      const response = await request(app)
        .get(`/api/projects/${testProject.id}/tasks`)
        .set(authHeaders)
        .expect(200);

      expect(response.body.tasks).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    test("PATCH /tasks/:id - update task", async () => {
      const task = await workService.createTask(testTenantId, testProject.id, {
        title: "Original Task",
        priority: "low"
      });

      const updateData = {
        title: "Updated Task",
        priority: "high"
      };

      const response = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .set(authHeaders)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: task.id,
        title: "Updated Task",
        priority: "high"
      });
    });
  });

  describe("Task Lifecycle", () => {
    let testProject: any;
    let testTask: any;

    beforeEach(async () => {
      testProject = await workService.createProject(testTenantId, {
        name: "Test Project",
        description: "A test project"
      });
      testTask = await workService.createTask(testTenantId, testProject.id, {
        title: "Test Task",
        priority: "medium"
      });
    });

    test("POST /tasks/:id/move - move task through status transitions", async () => {
      // Move from backlog to in-progress
      const response1 = await request(app)
        .post(`/api/tasks/${testTask.id}/move`)
        .set(authHeaders)
        .send({ status: "in-progress" })
        .expect(200);

      expect(response1.body.status).toBe("in-progress");

      // Move to in-review
      const response2 = await request(app)
        .post(`/api/tasks/${testTask.id}/move`)
        .set(authHeaders)
        .send({ status: "in-review" })
        .expect(200);

      expect(response2.body.status).toBe("in-review");

      // Move to done
      const response3 = await request(app)
        .post(`/api/tasks/${testTask.id}/move`)
        .set(authHeaders)
        .send({ status: "done" })
        .expect(200);

      expect(response3.body.status).toBe("done");
    });

    test("POST /tasks/:id/comments - add comment to task", async () => {
      const commentData = {
        content: "This is a test comment"
      };

      const response = await request(app)
        .post(`/api/tasks/${testTask.id}/comments`)
        .set(authHeaders)
        .send(commentData)
        .expect(201);

      expect(response.body).toMatchObject({
        content: "This is a test comment",
        task_id: testTask.id,
        author_id: testUserId
      });
      expect(response.body.created_at).toBeDefined();
    });

    test("POST /tasks/:id/dependencies - add task dependency", async () => {
      // Create dependency task
      const dependencyTask = await workService.createTask(testTenantId, testProject.id, {
        title: "Dependency Task",
        priority: "medium"
      });

      const dependencyData = {
        dependencyTaskId: dependencyTask.id
      };

      const response = await request(app)
        .post(`/api/tasks/${testTask.id}/dependencies`)
        .set(authHeaders)
        .send(dependencyData)
        .expect(201);

      expect(response.body).toMatchObject({
        dependent_task_id: testTask.id,
        dependency_task_id: dependencyTask.id,
        tenant_id: testTenantId
      });
    });
  });

  describe("Template Operations", () => {
    test("POST /templates - create project template", async () => {
      const templateData = {
        name: "Test Template",
        description: "A test template",
        category: "Development",
        tasks: [
          {
            title: "Setup Project",
            description: "Initial project setup",
            priority: "high",
            orderIndex: 0
          },
          {
            title: "Development",
            description: "Main development work",
            priority: "medium",
            orderIndex: 1
          }
        ]
      };

      const response = await request(app)
        .post("/api/templates")
        .set(authHeaders)
        .send(templateData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: "Test Template",
        description: "A test template",
        category: "Development"
      });
      expect(response.body.id).toBeDefined();
    });

    test("GET /templates - list templates", async () => {
      // Create test template
      await workService.createTemplate(testTenantId, {
        name: "Test Template",
        description: "A test template",
        category: "Development"
      });

      const response = await request(app)
        .get("/api/templates")
        .set(authHeaders)
        .expect(200);

      expect(response.body.templates).toHaveLength(1);
      expect(response.body.templates[0]).toMatchObject({
        name: "Test Template",
        description: "A test template",
        category: "Development"
      });
    });

    test("POST /templates/:id/instantiate - create project from template", async () => {
      // Create template with tasks
      const template = await workService.createTemplate(testTenantId, {
        name: "Test Template",
        description: "A test template",
        category: "Development",
        tasks: [
          {
            title: "Task 1",
            description: "First task",
            priority: "high",
            orderIndex: 0
          },
          {
            title: "Task 2",
            description: "Second task",
            priority: "medium",
            orderIndex: 1
          }
        ]
      });

      const instantiateData = {
        projectName: "Instantiated Project",
        description: "Project created from template",
        color: "#2196F3"
      };

      const response = await request(app)
        .post(`/api/templates/${template.id}/instantiate`)
        .set(authHeaders)
        .send(instantiateData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: "Instantiated Project",
        description: "Project created from template",
        color: "#2196F3",
        tenant_id: testTenantId
      });
      expect(response.body.id).toBeDefined();

      // Verify tasks were created
      const tasksResponse = await request(app)
        .get(`/api/projects/${response.body.id}/tasks`)
        .set(authHeaders)
        .expect(200);

      expect(tasksResponse.body.tasks).toHaveLength(2);
      expect(tasksResponse.body.tasks[0]).toMatchObject({
        title: "Task 1",
        description: "First task",
        priority: "high"
      });
    });
  });

  describe("Error Handling", () => {
    test("GET /projects/:id - project not found", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      
      await request(app)
        .get(`/api/projects/${fakeId}`)
        .set(authHeaders)
        .expect(404);
    });

    test("POST /projects/:projectId/tasks - project not found", async () => {
      const fakeProjectId = "00000000-0000-0000-0000-000000000000";
      const taskData = {
        title: "Test Task",
        priority: "medium"
      };

      await request(app)
        .post(`/api/projects/${fakeProjectId}/tasks`)
        .set(authHeaders)
        .send(taskData)
        .expect(404);
    });

    test("POST /tasks/:id/dependencies - dependency on self", async () => {
      const testProject = await workService.createProject(testTenantId, {
        name: "Test Project",
        description: "A test project"
      });
      const testTask = await workService.createTask(testTenantId, testProject.id, {
        title: "Test Task",
        priority: "medium"
      });

      const dependencyData = {
        dependencyTaskId: testTask.id
      };

      await request(app)
        .post(`/api/tasks/${testTask.id}/dependencies`)
        .set(authHeaders)
        .send(dependencyData)
        .expect(400);
    });
  });
});
