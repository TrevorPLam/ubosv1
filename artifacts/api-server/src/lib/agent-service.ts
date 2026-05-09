/**
 * @file        artifacts/api-server/src/lib/agent-service.ts
 * @module      API Server / Services / Agent
 * @purpose     Business logic for agent management operations
 *
 * @ai_instructions
 *   - Contains all agent-related business logic
 *   - Uses database through the db instance from lib/db
 *   - Handles pagination, filtering, and data transformation
 *   - Follows repository pattern for data access
 *   - Includes proper error handling and tenant isolation
 *
 * @exports     AgentService class and singleton instance
 * @imports     @workspace/db, drizzle-orm
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { 
  desc, 
  eq, 
  and,
  inArray 
} from "drizzle-orm";
import { db } from "@workspace/db";
import { 
  agentsTable, 
  agentRunsTable, 
  toolCallsTable,
  type Agent,
  type AgentRun,
  type ToolCall
} from "@workspace/db/schema";
import { ErrorTypes } from "../middlewares/error-handler";

interface ListAgentsParams {
  page: number;
  limit: number;
  status?: string;
  tenantId: string;
}

interface GetAgentDetailParams {
  agentId: string;
  tenantId: string;
}

interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AgentListResponse {
  agents: Agent[];
  pagination: PaginationResult;
}

interface AgentDetailResponse {
  agent: Agent;
  recentRuns: AgentRun[];
  toolCalls: ToolCall[];
}

/**
 * Agent service containing business logic for agent operations
 */
export class AgentService {
  /**
   * List agents with pagination and optional status filtering
   */
  async listAgents(params: ListAgentsParams): Promise<AgentListResponse> {
    const { page, limit, status, tenantId } = params;
    const offset = (page - 1) * limit;

    // Build base query with tenant isolation
    let baseQuery = eq(agentsTable.tenantId, tenantId);
    
    // Add status filter if provided
    if (status) {
      baseQuery = and(baseQuery, eq(agentsTable.status, status as any)) as any;
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: agentsTable.id })
      .from(agentsTable)
      .where(baseQuery);
    
    const total = countResult.length;

    // Get paginated results
    const agents = await db
      .select()
      .from(agentsTable)
      .where(baseQuery)
      .orderBy(desc(agentsTable.updatedAt))
      .limit(limit)
      .offset(offset);

    return {
      agents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get detailed information about a specific agent including recent runs and tool calls
   */
  async getAgentDetail(params: GetAgentDetailParams): Promise<AgentDetailResponse> {
    const { agentId, tenantId } = params;

    // Get agent with tenant isolation
    const agents = await db
      .select()
      .from(agentsTable)
      .where(and(
        eq(agentsTable.id, agentId),
        eq(agentsTable.tenantId, tenantId)
      ))
      .limit(1);

    if (agents.length === 0) {
      throw ErrorTypes.NotFound("Agent");
    }

    const agent = agents[0];

    // Get recent runs (last 10) for this agent
    const recentRuns = await db
      .select()
      .from(agentRunsTable)
      .where(and(
        eq(agentRunsTable.agentId, agentId),
        eq(agentRunsTable.tenantId, tenantId)
      ))
      .orderBy(desc(agentRunsTable.createdAt))
      .limit(10);

    // Get tool calls for recent runs
    const runIds = recentRuns.map(run => run.id);
    let toolCalls: ToolCall[] = [];
    
    if (runIds.length > 0) {
      toolCalls = await db
        .select()
        .from(toolCallsTable)
        .where(and(
          inArray(toolCallsTable.agentRunId, runIds),
          eq(toolCallsTable.tenantId, tenantId)
        ))
        .orderBy(desc(toolCallsTable.createdAt))
        .limit(50); // Limit to prevent excessive data
    }

    return {
      agent,
      recentRuns,
      toolCalls
    };
  }
}

/**
 * Singleton instance of the agent service
 */
export const agentService = new AgentService();
