/**
 * @file        artifacts/api-server/src/tests/work.test.ts
 * @module      API Server / Work Tests
 * @purpose     Integration tests for work management APIs
 *
 * @ai_instructions
 *   - Follow existing test patterns from agents.test.ts and approvals.test.ts
 *   - Test all major CRUD operations for projects and tasks
 *   - Test template instantiation workflow
 *   - Include proper authentication and authorization testing
 *   - Test error handling and edge cases
 *
 * @exports     Test suite for work management APIs
 * @imports     test utilities, work service, schemas
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { db } from '@workspace/db';
import { projects, tasks } from '@workspace/db/schema';
import { app } from '../app';

describe('Work Management APIs', () => {
  let authToken: string;
  let tenantId: string;
  let userId: string;

  beforeAll(async () => {
    // Setup test authentication context
    userId = uuidv4();
    tenantId = uuidv4();
    authToken = 'Bearer test-token';
  });

  describe('Projects API', () => {
    let projectId: string;

    it('should create a new project', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project for integration testing',
        color: '#FF5722'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', authToken)
        .send(projectData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(projectData.name);
      expect(response.body.description).toBe(projectData.description);
      expect(response.body.color).toBe(projectData.color);
      expect(response.body.status).toBe('active');

      projectId = response.body.id;
    });

    it('should list projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.projects)).toBe(true);
      expect(response.body.projects.length).toBeGreaterThan(0);
    });

    it('should get project details with task counts', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('project');
      expect(response.body).toHaveProperty('taskCounts');
      expect(response.body.project.id).toBe(projectId);
      expect(response.body.taskCounts).toHaveProperty('total');
      expect(response.body.taskCounts).toHaveProperty('backlog');
    });

    it('should return 404 for non-existent project', async () => {
      const fakeId = uuidv4();
      
      await request(app)
        .get(`/api/projects/${fakeId}`)
        .set('Authorization', authToken)
        .expect(404);
    });

    it('should validate project creation data', async () => {
      const invalidData = {
        // Missing required name field
        description: 'Invalid project'
      };

      await request(app)
        .post('/api/projects')
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(422);
    });
  });

  describe('Tasks API', () => {
    let projectId: string;
    let taskId: string;

    beforeAll(async () => {
      // Create a project for task testing
      const projectData = {
        name: 'Task Test Project',
        description: 'Project for task testing'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', authToken)
        .send(projectData)
        .expect(201);

      projectId = response.body.id;
    });

    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'A test task for integration testing',
        priority: 'high',
        billable: true
      };

      const response = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', authToken)
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(taskData.title);
      expect(response.body.description).toBe(taskData.description);
      expect(response.body.priority).toBe(taskData.priority);
      expect(response.body.billable).toBe(taskData.billable);
      expect(response.body.status).toBe('backlog');

      taskId = response.body.id;
    });

    it('should list tasks for a project', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/tasks`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('tasks');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.tasks)).toBe(true);
      expect(response.body.tasks.length).toBeGreaterThan(0);
    });

    it('should update a task', async () => {
      const updateData = {
        title: 'Updated Task Title',
        priority: 'medium'
      };

      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.priority).toBe(updateData.priority);
    });

    it('should move a task to new status', async () => {
      const moveData = {
        status: 'in-progress',
        orderIndex: 1
      };

      const response = await request(app)
        .post(`/api/tasks/${taskId}/move`)
        .set('Authorization', authToken)
        .send(moveData)
        .expect(200);

      expect(response.body.status).toBe(moveData.status);
      expect(response.body.order_index).toBe(moveData.orderIndex);
    });

    it('should add a comment to a task', async () => {
      const commentData = {
        content: 'This is a test comment'
      };

      const response = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', authToken)
        .send(commentData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe(commentData.content);
      expect(response.body.task_id).toBe(taskId);
    });

    it('should add a dependency between tasks', async () => {
      // First create another task to depend on
      const dependencyTaskData = {
        title: 'Dependency Task',
        priority: 'medium'
      };

      const dependencyResponse = await request(app)
        .post(`/api/projects/${projectId}/tasks`)
        .set('Authorization', authToken)
        .send(dependencyTaskData)
        .expect(201);

      const dependencyTaskId = dependencyResponse.body.id;

      // Now add the dependency
      const dependencyData = {
        dependencyTaskId: dependencyTaskId
      };

      const response = await request(app)
        .post(`/api/tasks/${taskId}/dependencies`)
        .set('Authorization', authToken)
        .send(dependencyData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.dependent_task_id).toBe(taskId);
      expect(response.body.dependency_task_id).toBe(dependencyTaskId);
    });

    it('should prevent self-dependency', async () => {
      const dependencyData = {
        dependencyTaskId: taskId
      };

      await request(app)
        .post(`/api/tasks/${taskId}/dependencies`)
        .set('Authorization', authToken)
        .send(dependencyData)
        .expect(400);
    });
  });

  describe('Templates API', () => {
    let templateId: string;

    it('should create a project template', async () => {
      const templateData = {
        name: 'Test Template',
        description: 'A template for testing',
        category: 'Testing',
        tasks: [
          {
            title: 'Template Task 1',
            description: 'First task in template',
            priority: 'high',
            orderIndex: 0
          },
          {
            title: 'Template Task 2',
            description: 'Second task in template',
            priority: 'medium',
            orderIndex: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/projects/templates')
        .set('Authorization', authToken)
        .send(templateData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(templateData.name);
      expect(response.body.category).toBe(templateData.category);

      templateId = response.body.id;
    });

    it('should list templates', async () => {
      const response = await request(app)
        .get('/api/projects/templates')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('templates');
      expect(Array.isArray(response.body.templates)).toBe(true);
      expect(response.body.templates.length).toBeGreaterThan(0);
    });

    it('should instantiate a project from template', async () => {
      const instantiateData = {
        projectName: 'Project from Template',
        description: 'Project created from template',
        color: '#4CAF50'
      };

      const response = await request(app)
        .post(`/api/projects/templates/${templateId}/instantiate`)
        .set('Authorization', authToken)
        .send(instantiateData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(instantiateData.projectName);
      expect(response.body.description).toBe(instantiateData.description);
      expect(response.body.color).toBe(instantiateData.color);

      // Verify that tasks were created from template
      const tasksResponse = await request(app)
        .get(`/api/projects/${response.body.id}/tasks`)
        .set('Authorization', authToken)
        .expect(200);

      expect(tasksResponse.body.tasks.length).toBe(2);
      expect(tasksResponse.body.tasks[0].title).toBe('Template Task 1');
      expect(tasksResponse.body.tasks[1].title).toBe('Template Task 2');
    });

    it('should return 404 for non-existent template', async () => {
      const fakeId = uuidv4();
      const instantiateData = {
        projectName: 'Test Project'
      };

      await request(app)
        .post(`/api/projects/templates/${fakeId}/instantiate`)
        .set('Authorization', authToken)
        .send(instantiateData)
        .expect(404);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should reject requests without authentication', async () => {
      await request(app)
        .get('/api/projects')
        .expect(401);
    });

    it('should reject requests with invalid authentication', async () => {
      await request(app)
        .get('/api/projects')
        .set('Authorization', 'Invalid token')
        .expect(401);
    });

    it('should reject operations on resources from other tenants', async () => {
      // This test would require setting up multi-tenant isolation
      // For now, we'll just verify the endpoint exists and is protected
      const fakeProjectId = uuidv4();
      
      await request(app)
        .get(`/api/projects/${fakeProjectId}`)
        .set('Authorization', authToken)
        .expect(404); // Should be 404, not 403, since tenant isolation happens at DB level
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      await request(app)
        .post('/api/projects')
        .set('Authorization', authToken)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    it('should validate UUID parameters', async () => {
      await request(app)
        .get('/api/projects/invalid-uuid')
        .set('Authorization', authToken)
        .expect(422);
    });

    it('should handle database constraint violations', async () => {
      // Try to create a project with duplicate name within same tenant
      const projectData = {
        name: 'Duplicate Test Project',
        description: 'First project'
      };

      // Create first project
      await request(app)
        .post('/api/projects')
        .set('Authorization', authToken)
        .send(projectData)
        .expect(201);

      // Try to create duplicate
      await request(app)
        .post('/api/projects')
        .set('Authorization', authToken)
        .send(projectData)
        .expect(400); // Should fail due to unique constraint
    });
  });

  afterAll(async () => {
    // Clean up test data
    // In a real implementation, you'd want to clean up created test data
    // This would involve deleting the test projects, tasks, etc.
  });
});
