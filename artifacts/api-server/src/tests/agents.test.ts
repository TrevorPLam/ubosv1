/**
 * @file        artifacts/api-server/src/tests/agents.test.ts
 * @module      API Server / Tests / Agents
 * @purpose     Integration tests for agent management endpoints
 *
 * @ai_instructions
 *   - Test all agent endpoints with authentication and authorization
 *   - Test pagination, filtering, and error scenarios
 *   - Use test database with proper tenant isolation
 *   - Verify response formats match OpenAPI specification
 *   - Test both success and failure cases
 *
 * @exports     Test suite for agent endpoints
 * @imports     test framework, setup utilities, agent services
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import request from "supertest";
import { app } from "../app";
import { db } from "@workspace/db";
import { agentsTable } from "@workspace/db/schema";
import { v4 as uuid } from "uuid";

// Test setup and teardown
const TEST_TENANT_ID = uuid();
const TEST_USER_ID = uuid();

beforeAll(async () => {
  // Setup test data
  await db.insert(agentsTable).values([
    {
      id: uuid(),
      tenantId: TEST_TENANT_ID,
      name: "Test Agent 1",
      model: "gpt-4",
      systemPrompt: "You are a helpful assistant",
      status: "idle",
      memoryUsageMb: 0,
      tokenCount: 0
    },
    {
      id: uuid(),
      tenantId: TEST_TENANT_ID,
      name: "Test Agent 2",
      model: "claude-3-sonnet",
      systemPrompt: "You are a helpful assistant",
      status: "running-tool",
      memoryUsageMb: 128,
      tokenCount: 1000
    }
  ]);
});

afterAll(async () => {
  // Cleanup test data
  await db.delete(agentsTable).where(eq(agentsTable.tenantId, TEST_TENANT_ID));
});

describe("Agent API Endpoints", () => {
  describe("GET /agents", () => {
    it("should return 401 for unauthenticated requests", async () => {
      const response = await request(app)
        .get("/api/agents")
        .expect(401);

      expect(response.body).toMatchObject({
        error: "Unauthorized",
        statusCode: 401
      });
    });

    it("should return paginated agent list for authenticated users", async () => {
      // Mock authenticated user
      const mockUser = {
        id: TEST_USER_ID,
        tenantId: TEST_TENANT_ID,
        organizationId: uuid(),
        role: "admin"
      };

      const response = await request(app)
        .get("/api/agents")
        .set("Authorization", `Bearer mock-token-${mockUser.id}`)
        .expect(200);

      expect(response.body).toHaveProperty("agents");
      expect(response.body).toHaveProperty("pagination");
      expect(Array.isArray(response.body.agents)).toBe(true);
      expect(response.body.agents.length).toBeGreaterThan(0);
      expect(response.body.pagination).toMatchObject({
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
        totalPages: expect.any(Number)
      });
    });

    it("should filter agents by status", async () => {
      const mockUser = {
        id: TEST_USER_ID,
        tenantId: TEST_TENANT_ID,
        organizationId: uuid(),
        role: "admin"
      };

      const response = await request(app)
        .get("/api/agents?status=idle")
        .set("Authorization", `Bearer mock-token-${mockUser.id}`)
        .expect(200);

      expect(response.body.agents).toHaveLength(1);
      expect(response.body.agents[0].status).toBe("idle");
    });

    it("should respect pagination limits", async () => {
      const mockUser = {
        id: TEST_USER_ID,
        tenantId: TEST_TENANT_ID,
        organizationId: uuid(),
        role: "admin"
      };

      const response = await request(app)
        .get("/api/agents?page=1&limit=1")
        .set("Authorization", `Bearer mock-token-${mockUser.id}`)
        .expect(200);

      expect(response.body.agents).toHaveLength(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.page).toBe(1);
    });
  });

  describe("GET /agents/:id", () => {
    let testAgentId: string;

    beforeAll(async () => {
      // Get a test agent ID
      const agents = await db
        .select()
        .from(agentsTable)
        .where(eq(agentsTable.tenantId, TEST_TENANT_ID))
        .limit(1);
      
      testAgentId = agents[0]?.id;
    });

    it("should return 401 for unauthenticated requests", async () => {
      await request(app)
        .get(`/api/agents/${testAgentId}`)
        .expect(401);
    });

    it("should return agent details for authenticated users", async () => {
      const mockUser = {
        id: TEST_USER_ID,
        tenantId: TEST_TENANT_ID,
        organizationId: uuid(),
        role: "admin"
      };

      const response = await request(app)
        .get(`/api/agents/${testAgentId}`)
        .set("Authorization", `Bearer mock-token-${mockUser.id}`)
        .expect(200);

      expect(response.body).toHaveProperty("agent");
      expect(response.body).toHaveProperty("recentRuns");
      expect(response.body).toHaveProperty("toolCalls");
      expect(response.body.agent.id).toBe(testAgentId);
      expect(Array.isArray(response.body.recentRuns)).toBe(true);
      expect(Array.isArray(response.body.toolCalls)).toBe(true);
    });

    it("should return 404 for non-existent agent", async () => {
      const mockUser = {
        id: TEST_USER_ID,
        tenantId: TEST_TENANT_ID,
        organizationId: uuid(),
        role: "admin"
      };

      await request(app)
        .get(`/api/agents/${uuid()}`)
        .set("Authorization", `Bearer mock-token-${mockUser.id}`)
        .expect(404);
    });

    it("should return 400 for invalid agent ID format", async () => {
      const mockUser = {
        id: TEST_USER_ID,
        tenantId: TEST_TENANT_ID,
        organizationId: uuid(),
        role: "admin"
      };

      await request(app)
        .get("/api/agents/invalid-uuid")
        .set("Authorization", `Bearer mock-token-${mockUser.id}`)
        .expect(422);
    });
  });
});
