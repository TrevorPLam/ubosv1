/**
 * @file        artifacts/api-server/src/lib/agents/worker.ts
 * @module      Agents / Worker
 * @purpose     Worker agent for executing tasks with MCP tool access
 *
 * @ai_instructions
 *   - Execute tasks using LLM reasoning and MCP tools
 *   - Handle tool calls with proper error handling and timeouts
 *   - Support task cancellation and status updates
 *   - Log all tool invocations for audit purposes
 *   - Implement retry logic for failed tool calls
 *
 * @exports     WorkerAgent class with task execution methods
 * @imports     @workspace/db, @workspace/db/schema, ../mcp/runtime
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { EventEmitter } from "node:events";
import OpenAI from "openai";
import { db } from "@workspace/db";
import { 
  agentsTable, 
  agentRunsTable,
  toolCallsTable,
  type Agent,
  type AgentRun,
  type ToolCall
} from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../logger";
import { MCPRuntime } from "../mcp/runtime";
import { type AgentCapability } from "./registry";

// Worker task definition
export interface WorkerTask {
  id: string;
  description: string;
  requirements: string[];
  complexity: 'low' | 'medium' | 'high';
  dependencies: string[];
  priority: number;
  orchestrationId: string;
  timeoutMs?: number;
}

// Worker task result
export interface WorkerResult {
  taskId: string;
  success: boolean;
  result: string | null;
  error?: string;
  executionTime: number;
  agentName: string;
  toolCalls: Array<{
    toolName: string;
    args: Record<string, unknown>;
    result: unknown;
    executionTime: number;
    success: boolean;
  }>;
  metadata?: Record<string, unknown>;
}

// Worker configuration
export interface WorkerConfig {
  maxRetries?: number;
  toolTimeoutMs?: number;
  maxTokens?: number;
  temperature?: number;
}

export class WorkerAgent extends EventEmitter {
  private agent: AgentCapability;
  private openai: OpenAI;
  private mcpRuntime: MCPRuntime;
  private config: Required<WorkerConfig>;
  private activeTasks: Map<string, { startTime: number; controller: AbortController }> = new Map();

  constructor(agent: AgentCapability, config: WorkerConfig = {}) {
    super();
    
    this.agent = agent;
    this.config = {
      maxRetries: config.maxRetries || 3,
      toolTimeoutMs: config.toolTimeoutMs || 30000,
      maxTokens: config.maxTokens || 4000,
      temperature: config.temperature || 0.7
    };

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.mcpRuntime = new MCPRuntime();
  }

  /**
   * Execute a worker task
   */
  async executeTask(task: WorkerTask): Promise<WorkerResult> {
    const startTime = Date.now();
    const controller = new AbortController();
    
    // Track active task
    this.activeTasks.set(task.id, { startTime, controller });

    logger.info({ 
      taskId: task.id,
      agentName: this.agent.agentName,
      description: task.description.substring(0, 100),
      complexity: task.complexity
    }, 'Starting worker task execution');

    try {
      // Create agent run record
      const agentRun = await this.createAgentRun(task);
      
      // Execute the task with LLM and tools
      const result = await this.executeTaskWithTools(task, agentRun.id, controller.signal);
      
      // Update agent run with completion status
      await this.updateAgentRun(agentRun.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        tokenUsageInput: result.tokenUsage?.input || 0,
        tokenUsageOutput: result.tokenUsage?.output || 0
      });

      const executionTime = Date.now() - startTime;

      logger.info({ 
        taskId: task.id,
        agentName: this.agent.agentName,
        executionTime,
        success: true,
        toolCallCount: result.toolCalls.length
      }, 'Worker task completed successfully');

      this.emit('taskCompleted', { taskId: task.id, result });

      return {
        taskId: task.id,
        success: true,
        result: result.response,
        executionTime,
        agentName: this.agent.agentName,
        toolCalls: result.toolCalls,
        metadata: {
          agentRunId: agentRun.id,
          tokenUsage: result.tokenUsage,
          complexity: task.complexity
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error({ 
        taskId: task.id,
        agentName: this.agent.agentName,
        error: errorMessage,
        executionTime
      }, 'Worker task failed');

      this.emit('taskFailed', { taskId: task.id, error });

      return {
        taskId: task.id,
        success: false,
        result: null,
        error: errorMessage,
        executionTime,
        agentName: this.agent.agentName,
        toolCalls: []
      };

    } finally {
      // Clean up active task
      this.activeTasks.delete(task.id);
    }
  }

  /**
   * Cancel an active task
   */
  cancelTask(taskId: string): boolean {
    const activeTask = this.activeTasks.get(taskId);
    if (!activeTask) {
      return false;
    }

    activeTask.controller.abort();
    this.activeTasks.delete(taskId);

    logger.info({ taskId, agentName: this.agent.agentName }, 'Worker task cancelled');

    this.emit('taskCancelled', { taskId });

    return true;
  }

  /**
   * Get agent name
   */
  getAgentName(): string {
    return this.agent.agentName;
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): AgentCapability {
    return this.agent;
  }

  /**
   * Execute task using LLM with tool calling
   */
  private async executeTaskWithTools(
    task: WorkerTask, 
    agentRunId: string,
    abortSignal: AbortSignal
  ): Promise<{
    response: string;
    toolCalls: Array<{
      toolName: string;
      args: Record<string, unknown>;
      result: unknown;
      executionTime: number;
      success: boolean;
    }>;
    tokenUsage?: { input: number; output: number };
  }> {
    const toolCalls: Array<{
      toolName: string;
      args: Record<string, unknown>;
      result: unknown;
      executionTime: number;
      success: boolean;
    }> = [];

    // Build system prompt with agent context
    const systemPrompt = this.buildSystemPrompt(task);

    // Build messages array
    const messages: Array<OpenAI.Chat.Completions.ChatCompletionMessageParam> = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `Task: ${task.description}\n\nRequirements:\n${task.requirements.map(req => `- ${req}`).join('\n')}` 
      }
    ];

    let finalResponse = '';
    let maxIterations = 10; // Prevent infinite loops
    let iteration = 0;
    let tokenUsage: { input: number; output: number } = { input: 0, output: 0 };

    while (iteration < maxIterations) {
      iteration++;

      // Check for abort signal
      if (abortSignal.aborted) {
        throw new Error('Task execution aborted');
      }

      // Get available tools for this agent
      const availableTools = await this.getAvailableTools();

      // Call LLM with tool calling
      const response = await this.openai.chat.completions.create({
        model: this.agent.model,
        messages,
        tools: availableTools.length > 0 ? this.formatToolsForLLM(availableTools) : undefined,
        tool_choice: availableTools.length > 0 ? 'auto' : undefined,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const assistantMessage = response.choices[0]?.message;
      if (!assistantMessage) {
        throw new Error('No response from LLM');
      }

      // Track token usage
      tokenUsage = {
        input: tokenUsage.input + (response.usage?.prompt_tokens || 0),
        output: tokenUsage.output + (response.usage?.completion_tokens || 0)
      };

      // Add assistant message to conversation
      messages.push({
        role: 'assistant',
        content: assistantMessage.content || '',
      });

      // Check if assistant wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Execute each tool call
        for (const toolCall of assistantMessage.tool_calls) {
          const toolStartTime = Date.now();

          try {
            // Parse tool arguments
            const toolArgs = JSON.parse(toolCall.function.arguments || '{}');

            // Execute tool via MCP runtime
            const toolResult = await this.executeTool(
              toolCall.function.name,
              toolArgs,
              this.config.toolTimeoutMs,
              abortSignal
            );

            const toolExecutionTime = Date.now() - toolStartTime;

            // Record tool call
            await this.recordToolCall(agentRunId, {
              toolName: toolCall.function.name,
              args: toolArgs,
              result: toolResult,
              success: true,
              executionTime: toolExecutionTime
            });

            toolCalls.push({
              toolName: toolCall.function.name,
              args: toolArgs,
              result: toolResult,
              executionTime: toolExecutionTime,
              success: true
            });

            // Add tool result to conversation
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult)
            });

          } catch (error) {
            const toolExecutionTime = Date.now() - toolStartTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Record failed tool call
            await this.recordToolCall(agentRunId, {
              toolName: toolCall.function.name,
              args: JSON.parse(toolCall.function.arguments || '{}'),
              result: null,
              success: false,
              executionTime: toolExecutionTime,
              error: errorMessage
            });

            toolCalls.push({
              toolName: toolCall.function.name,
              args: JSON.parse(toolCall.function.arguments || '{}'),
              result: null,
              executionTime: toolExecutionTime,
              success: false
            });

            // Add error to conversation
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: errorMessage })
            });

            logger.warn({ 
              toolName: toolCall.function.name,
              error: errorMessage,
              taskId: task.id
            }, 'Tool execution failed');
          }
        }
      } else {
        // No more tool calls, this is the final response
        finalResponse = assistantMessage.content || 'Task completed without response';
        break;
      }
    }

    if (iteration >= maxIterations) {
      throw new Error('Maximum tool call iterations exceeded');
    }

    return {
      response: finalResponse,
      toolCalls,
      tokenUsage
    };
  }

  /**
   * Build system prompt with agent context
   */
  private buildSystemPrompt(task: WorkerTask): string {
    return `You are ${this.agent.agentName}, a specialized AI agent.

Your capabilities: ${this.agent.capabilities.join(', ')}
Available tools: ${this.agent.tools.join(', ')}

System prompt: ${this.agent.description}

Task complexity: ${task.complexity}
Priority: ${task.priority}

Instructions:
1. Use your available tools when necessary to complete the task
2. Provide clear, accurate, and helpful responses
3. If you cannot complete the task, explain why
4. Be concise but thorough in your responses
5. Focus on the specific requirements provided

Current task context: ${task.orchestrationId}`;
  }

  /**
   * Get available tools for this agent
   */
  private async getAvailableTools(): Promise<Array<{ name: string; description: string; parameters: Record<string, unknown> }>> {
    try {
      // This would query the MCP runtime for available tools
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        agentName: this.agent.agentName
      }, 'Failed to get available tools');
      return [];
    }
  }

  /**
   * Format tools for OpenAI function calling
   */
  private formatToolsForLLM(tools: Array<{ name: string; description: string; parameters: Record<string, unknown> }>) {
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }
    }));
  }

  /**
   * Execute a tool via MCP runtime
   */
  private async executeTool(
    toolName: string,
    args: Record<string, unknown>,
    timeoutMs: number,
    abortSignal: AbortSignal
  ): Promise<unknown> {
    // This would integrate with the actual MCP runtime
    // For now, simulate tool execution with timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Tool execution timeout: ${toolName}`));
      }, timeoutMs);

      const checkAbort = () => {
        if (abortSignal.aborted) {
          clearTimeout(timeout);
          reject(new Error('Tool execution aborted'));
        }
      };

      const interval = setInterval(checkAbort, 100);

      // Simulate tool execution
      setTimeout(() => {
        clearTimeout(timeout);
        clearInterval(interval);
        
        if (abortSignal.aborted) {
          reject(new Error('Tool execution aborted'));
          return;
        }

        // Mock result - in real implementation this would call MCP runtime
        resolve({
          success: true,
          data: `Mock result for ${toolName} with args: ${JSON.stringify(args)}`
        });
      }, 1000);
    });
  }

  /**
   * Create agent run record
   */
  private async createAgentRun(task: WorkerTask): Promise<AgentRun> {
    const [agentRun] = await db
      .insert(agentRunsTable)
      .values({
        agentId: this.agent.agentId,
        tenantId: 'current-tenant', // TODO: Get from context
        taskId: task.id,
        status: 'running',
        startedAt: new Date().toISOString()
      })
      .returning();

    return agentRun;
  }

  /**
   * Update agent run record
   */
  private async updateAgentRun(
    agentRunId: string, 
    updates: Partial<AgentRun>
  ): Promise<void> {
    await db
      .update(agentRunsTable)
      .set({
        ...updates,
        updatedAt: new Date().toISOString()
      })
      .where(eq(agentRunsTable.id, agentRunId));
  }

  /**
   * Record tool call execution
   */
  private async recordToolCall(
    agentRunId: string,
    toolCall: {
      toolName: string;
      args: Record<string, unknown>;
      result: unknown;
      success: boolean;
      executionTime: number;
      error?: string;
    }
  ): Promise<void> {
    await db
      .insert(toolCallsTable)
      .values({
        agentRunId,
        tenantId: 'current-tenant', // TODO: Get from context
        mcpServerId: null, // TODO: Get from tool registry
        toolName: toolCall.toolName,
        args: toolCall.args,
        result: toolCall.result,
        status: toolCall.success ? 'completed' : 'failed',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        executionTimeMs: toolCall.executionTime,
        errorMessage: toolCall.error
      });
  }

  /**
   * Get active task count
   */
  getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  /**
   * Get worker statistics
   */
  getStatistics(): {
    activeTasks: number;
    totalExecutions: number;
    averageExecutionTime: number;
    successRate: number;
  } {
    // This would require persistent storage for accurate metrics
    // For now, return placeholder values
    return {
      activeTasks: this.activeTasks.size,
      totalExecutions: 0,
      averageExecutionTime: 0,
      successRate: 0
    };
  }
}

/**
 * Create worker agent instance
 */
export function createWorkerAgent(agent: AgentCapability, config?: WorkerConfig): WorkerAgent {
  return new WorkerAgent(agent, config);
}
