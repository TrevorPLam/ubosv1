/**
 * @file        artifacts/api-server/src/lib/agents/supervisor.ts
 * @module      Agents / Supervisor
 * @purpose     Supervisor agent for task decomposition, delegation, and synthesis
 *
 * @ai_instructions
 *   - Implement hierarchical supervisor-worker pattern
 *   - Use LLM for task decomposition and synthesis
 *   - Coordinate parallel worker execution
 *   - Handle timeouts and abort signals gracefully
 *   - Support checkpointing for durability
 *
 * @exports     SupervisorAgent class with orchestration methods
 * @imports     @workspace/db, @workspace/db/schema, ./registry, ./worker
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
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
import { isEnabled, FEATURE_FLAGS, type FeatureFlagContext } from "../feature-flags";
import { agentRegistry, type AgentCapability, type CapabilityMatch } from "./registry";
import { WorkerAgent, type WorkerTask, type WorkerResult } from "./worker";

// Task decomposition result
export interface Subtask {
  id: string;
  description: string;
  requirements: string[];
  dependencies: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  suggestedAgentType: string;
  priority: number;
}

// Orchestration state
export interface OrchestrationState {
  id: string;
  tenantId: string;
  originalTask: string;
  subtasks: Subtask[];
  workerResults: Map<string, WorkerResult>;
  status: 'decomposing' | 'delegating' | 'executing' | 'synthesizing' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  error?: string;
}

// Synthesis result
export interface SynthesisResult {
  finalResponse: string;
  confidence: number;
  sources: Array<{
    subtaskId: string;
    agentName: string;
    contribution: string;
    reliability: number;
  }>;
  metadata: {
    totalExecutionTime: number;
    subtaskCount: number;
    successCount: number;
    failureCount: number;
  };
}

// Supervisor configuration
export interface SupervisorConfig {
  maxSubtasks?: number;
  maxParallelWorkers?: number;
  taskTimeoutMs?: number;
  synthesisModel?: string;
  decompositionModel?: string;
  enableCheckpointing?: boolean;
}

export class SupervisorAgent extends EventEmitter {
  private openai: OpenAI;
  private config: Required<SupervisorConfig>;
  private workers: Map<string, WorkerAgent> = new Map();
  private activeOrchestrations: Map<string, OrchestrationState> = new Map();

  constructor(config: SupervisorConfig = {}) {
    super();
    
    this.config = {
      maxSubtasks: config.maxSubtasks || 8,
      maxParallelWorkers: config.maxParallelWorkers || 4,
      taskTimeoutMs: config.taskTimeoutMs || 10 * 60 * 1000, // 10 minutes
      synthesisModel: config.synthesisModel || 'gpt-4',
      decompositionModel: config.decompositionModel || 'gpt-4',
      enableCheckpointing: config.enableCheckpointing ?? true
    };

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Process a user task through the supervisor orchestration pipeline
   */
  async processTask(
    task: string,
    tenantId: string,
    options: {
      userId?: string;
      threadId?: string;
      priority?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<SynthesisResult> {
    // Check if AI supervisor is enabled
    const context: FeatureFlagContext = {
      tenantId,
      userId: options.userId,
    };
    
    const supervisorEnabled = await isEnabled(FEATURE_FLAGS.AI_SUPERVISOR, context);
    if (!supervisorEnabled) {
      throw new Error('AI supervisor orchestration is currently disabled');
    }

    const orchestrationId = randomUUID();
    const startTime = Date.now();

    logger.info({ 
      orchestrationId,
      task: task.substring(0, 100),
      tenantId,
      userId: options.userId
    }, 'Starting supervisor orchestration');

    try {
      // Initialize orchestration state
      const state: OrchestrationState = {
        id: orchestrationId,
        tenantId,
        originalTask: task,
        subtasks: [],
        workerResults: new Map(),
        status: 'decomposing',
        startTime
      };

      this.activeOrchestrations.set(orchestrationId, state);

      // Step 1: Decompose task into subtasks
      this.emit('orchestrationStarted', { orchestrationId, task, tenantId });
      
      const subtasks = await this.decomposeTask(task, tenantId);
      state.subtasks = subtasks;
      state.status = 'delegating';

      logger.info({ 
        orchestrationId,
        subtaskCount: subtasks.length
      }, 'Task decomposition completed');

      // Step 2: Delegate subtasks to workers
      const workerAssignments = await this.delegateSubtasks(subtasks, tenantId);
      state.status = 'executing';

      // Step 3: Execute workers in parallel
      const results = await this.executeWorkers(workerAssignments, orchestrationId);
      
      // Store worker results
      results.forEach(result => {
        state.workerResults.set(result.taskId, result);
      });

      // Step 4: Synthesize final response
      state.status = 'synthesizing';
      const synthesis = await this.synthesizeResults(state);

      // Complete orchestration
      state.status = 'completed';
      state.endTime = Date.now();

      logger.info({ 
        orchestrationId,
        executionTime: state.endTime - state.startTime,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length
      }, 'Supervisor orchestration completed');

      this.emit('orchestrationCompleted', { orchestrationId, result: synthesis });

      return synthesis;

    } catch (error) {
      const state = this.activeOrchestrations.get(orchestrationId);
      if (state) {
        state.status = 'failed';
        state.error = error instanceof Error ? error.message : 'Unknown error';
        state.endTime = Date.now();
      }

      logger.error({ 
        orchestrationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      }, 'Supervisor orchestration failed');

      this.emit('orchestrationFailed', { orchestrationId, error });

      throw error;
    } finally {
      // Clean up orchestration state
      setTimeout(() => {
        this.activeOrchestrations.delete(orchestrationId);
      }, 60000); // Keep state for 1 minute for debugging
    }
  }

  /**
   * Decompose a complex task into manageable subtasks
   */
  private async decomposeTask(task: string, tenantId: string): Promise<Subtask[]> {
    logger.debug({ task: task.substring(0, 100), tenantId }, 'Decomposing task');

    const prompt = `
You are a task decomposition specialist. Break down the following user task into specific, actionable subtasks that can be handled by specialized AI agents.

User Task: "${task}"

Guidelines:
1. Create between 2-8 subtasks maximum
2. Each subtask should be independent and specific
3. Assign a complexity level (low/medium/high)
4. Suggest the best type of agent for each subtask
5. Identify dependencies between subtasks
6. Prioritize subtasks (1 = highest priority)

Available agent types:
- CodeReviewer: For code analysis, review, and suggestions
- ResearchBot: For information gathering and analysis
- DocumentWriter: For creating and formatting documents
- DataAnalyst: For data processing and analysis
- ToolExecutor: For executing specific tools and APIs

Respond with a JSON array of subtasks following this structure:
[
  {
    "id": "unique_subtask_id",
    "description": "Clear description of what needs to be done",
    "requirements": ["specific requirement 1", "specific requirement 2"],
    "dependencies": ["subtask_id_if_any"],
    "estimatedComplexity": "low|medium|high",
    "suggestedAgentType": "agent_type_from_list",
    "priority": 1
  }
]
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.decompositionModel,
        messages: [
          { role: "system", content: "You are a task decomposition specialist. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from task decomposition');
      }

      // Parse JSON response
      const subtasks = JSON.parse(content) as Subtask[];
      
      // Validate and limit subtasks
      const validatedSubtasks = subtasks
        .slice(0, this.config.maxSubtasks)
        .filter((subtask, index, array) => 
          subtask.id && 
          subtask.description && 
          subtask.suggestedAgentType &&
          array.findIndex(s => s.id === subtask.id) === index // Unique IDs
        );

      logger.info({ 
        task: task.substring(0, 100),
        subtaskCount: validatedSubtasks.length
      }, 'Task decomposition successful');

      return validatedSubtasks;

    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        task: task.substring(0, 100)
      }, 'Task decomposition failed');

      // Fallback: create a single subtask
      return [{
        id: 'fallback_task',
        description: task,
        requirements: ['Complete the original task'],
        dependencies: [],
        estimatedComplexity: 'medium' as const,
        suggestedAgentType: 'ToolExecutor',
        priority: 1
      }];
    }
  }

  /**
   * Delegate subtasks to appropriate worker agents
   */
  private async delegateSubtasks(
    subtasks: Subtask[], 
    tenantId: string
  ): Promise<Array<{ subtask: Subtask; worker: WorkerAgent }>> {
    logger.debug({ subtaskCount: subtasks.length, tenantId }, 'Delegating subtasks');

    const assignments: Array<{ subtask: Subtask; worker: WorkerAgent }> = [];

    for (const subtask of subtasks) {
      try {
        // Find best matching agent for this subtask
        const match = await agentRegistry.getBestAgent(
          `${subtask.description} ${subtask.requirements.join(' ')}`,
          tenantId
        );

        if (!match) {
          logger.warn({ 
            subtaskId: subtask.id,
            description: subtask.description.substring(0, 50)
          }, 'No suitable agent found for subtask');
          continue;
        }

        // Get or create worker instance
        let worker = this.workers.get(match.agent.agentId);
        if (!worker) {
          worker = new WorkerAgent(match.agent);
          this.workers.set(match.agent.agentId, worker);
        }

        assignments.push({ subtask, worker });

        logger.debug({ 
          subtaskId: subtask.id,
          agentName: match.agent.agentName,
          matchScore: match.score
        }, 'Subtask delegated to worker');

      } catch (error) {
        logger.error({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          subtaskId: subtask.id
        }, 'Failed to delegate subtask');
      }
    }

    logger.info({ 
      totalSubtasks: subtasks.length,
      delegatedSubtasks: assignments.length
    }, 'Subtask delegation completed');

    return assignments;
  }

  /**
   * Execute workers in parallel with dependency management
   */
  private async executeWorkers(
    assignments: Array<{ subtask: Subtask; worker: WorkerAgent }>,
    orchestrationId: string
  ): Promise<WorkerResult[]> {
    logger.debug({ 
      assignmentCount: assignments.length,
      orchestrationId
    }, 'Executing workers');

    const results: WorkerResult[] = [];
    const executing = new Set<string>();
    const completed = new Set<string>();
    const failed = new Set<string>();

    // Create worker tasks
    const workerTasks: WorkerTask[] = assignments.map(({ subtask, worker }) => ({
      id: subtask.id,
      description: subtask.description,
      requirements: subtask.requirements,
      complexity: subtask.estimatedComplexity,
      dependencies: subtask.dependencies,
      priority: subtask.priority,
      orchestrationId
    }));

    // Execute with dependency resolution and parallelism limits
    while (completed.size + failed.size < workerTasks.length) {
      // Find tasks ready to execute
      const readyTasks = workerTasks.filter(task => 
        !executing.has(task.id) &&
        !completed.has(task.id) &&
        !failed.has(task.id) &&
        task.dependencies.every((dep: string) => completed.has(dep))
      );

      // Limit parallel execution
      const tasksToExecute = readyTasks
        .slice(0, this.config.maxParallelWorkers - executing.size);

      if (tasksToExecute.length === 0 && executing.size > 0) {
        // Wait for current tasks to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      // Execute tasks in parallel
      const executionPromises = tasksToExecute.map(async task => {
        const assignment = assignments.find(a => a.subtask.id === task.id);
        if (!assignment) return null;

        executing.add(task.id);

        try {
          const result = await Promise.race([
            assignment.worker.executeTask(task),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Task timeout')), this.config.taskTimeoutMs)
            )
          ]);

          completed.add(task.id);
          return result;

        } catch (error) {
          failed.add(task.id);
          logger.error({ 
            error: error instanceof Error ? error.message : 'Unknown error',
            taskId: task.id
          }, 'Worker task failed');

          return {
            taskId: task.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            result: null,
            executionTime: 0,
            agentName: assignment.worker.getAgentName()
          } as WorkerResult;

        } finally {
          executing.delete(task.id);
        }
      });

      const batchResults = await Promise.all(executionPromises);
      results.push(...batchResults.filter(Boolean) as WorkerResult[]);
    }

    logger.info({ 
      totalTasks: workerTasks.length,
      successCount: completed.size,
      failureCount: failed.size,
      orchestrationId
    }, 'Worker execution completed');

    return results;
  }

  /**
   * Synthesize worker results into a final response
   */
  private async synthesizeResults(state: OrchestrationState): Promise<SynthesisResult> {
    logger.debug({ orchestrationId: state.id }, 'Synthesizing results');

    const successfulResults = Array.from(state.workerResults.values())
      .filter(result => result.success);

    const failedResults = Array.from(state.workerResults.values())
      .filter(result => !result.success);

    // Prepare synthesis prompt
    const prompt = `
You are a synthesis specialist. Combine the results from multiple specialized AI agents to create a comprehensive, coherent response to the original user task.

Original Task: "${state.originalTask}"

${successfulResults.length > 0 ? `
Successful Agent Results:
${successfulResults.map((result, index) => `
Agent ${index + 1} (${result.agentName}):
${result.result}
`).join('\n---\n')}
` : ''}

${failedResults.length > 0 ? `
Failed Tasks:
${failedResults.map((result, index) => `
Task ${index + 1} (${result.agentName}): ${result.error}
`).join('\n')}
` : ''}

Instructions:
1. Create a comprehensive response that directly addresses the original task
2. Integrate information from all successful agents
3. Acknowledge any failed tasks and their impact
4. Ensure the response is coherent and well-structured
5. Include specific details and insights from the agent results
6. If there are conflicts or contradictions, resolve them logically

Respond with:
1. A confidence score (0-1) indicating how well you can address the original task
2. A brief summary of which agents contributed what
3. The final synthesized response

Format your response as JSON:
{
  "confidence": 0.8,
  "summary": "Brief summary of contributions",
  "response": "The complete synthesized response"
}
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.synthesisModel,
        messages: [
          { role: "system", content: "You are a synthesis specialist. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 3000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from synthesis');
      }

      const synthesis = JSON.parse(content);
      const executionTime = (state.endTime || Date.now()) - state.startTime;

      const result: SynthesisResult = {
        finalResponse: synthesis.response || 'Unable to synthesize a response.',
        confidence: synthesis.confidence || 0.5,
        sources: successfulResults.map(result => ({
          subtaskId: result.taskId,
          agentName: result.agentName,
          contribution: result.result?.substring(0, 200) + '...' || '',
          reliability: 0.8 // Default reliability, could be enhanced with agent performance metrics
        })),
        metadata: {
          totalExecutionTime: executionTime,
          subtaskCount: state.subtasks.length,
          successCount: successfulResults.length,
          failureCount: failedResults.length
        }
      };

      logger.info({ 
        orchestrationId: state.id,
        confidence: result.confidence,
        executionTime
      }, 'Result synthesis completed');

      return result;

    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        orchestrationId: state.id
      }, 'Result synthesis failed');

      // Fallback synthesis
      const executionTime = (state.endTime || Date.now()) - state.startTime;
      const successfulResults = Array.from(state.workerResults.values()).filter(r => r.success);

      return {
        finalResponse: successfulResults.length > 0 
          ? successfulResults.map(r => r.result).join('\n\n')
          : 'Unable to complete the task due to failures in all subtasks.',
        confidence: successfulResults.length > 0 ? 0.6 : 0.2,
        sources: successfulResults.map(result => ({
          subtaskId: result.taskId,
          agentName: result.agentName,
          contribution: result.result?.substring(0, 200) + '...' || '',
          reliability: 0.7
        })),
        metadata: {
          totalExecutionTime: executionTime,
          subtaskCount: state.subtasks.length,
          successCount: successfulResults.length,
          failureCount: state.subtasks.length - successfulResults.length
        }
      };
    }
  }

  /**
   * Get active orchestration status
   */
  getOrchestrationStatus(orchestrationId: string): OrchestrationState | null {
    return this.activeOrchestrations.get(orchestrationId) || null;
  }

  /**
   * Cancel an active orchestration
   */
  async cancelOrchestration(orchestrationId: string): Promise<boolean> {
    const state = this.activeOrchestrations.get(orchestrationId);
    if (!state || state.status === 'completed' || state.status === 'failed') {
      return false;
    }

    // Mark as failed
    state.status = 'failed';
    state.error = 'Orchestration cancelled by user';
    state.endTime = Date.now();

    // Cancel active workers (this would need to be implemented in WorkerAgent)
    // For now, just mark as cancelled

    this.emit('orchestrationCancelled', { orchestrationId });

    logger.info({ orchestrationId }, 'Orchestration cancelled');

    return true;
  }

  /**
   * Get orchestration statistics
   */
  getStatistics(): {
    activeOrchestrations: number;
    totalWorkers: number;
    averageExecutionTime: number;
    successRate: number;
  } {
    const activeOrchestrations = this.activeOrchestrations.size;
    const totalWorkers = this.workers.size;

    // Calculate average execution time and success rate from recent orchestrations
    // This would require persistent storage for accurate metrics
    const averageExecutionTime = 0; // Placeholder
    const successRate = 0; // Placeholder

    return {
      activeOrchestrations,
      totalWorkers,
      averageExecutionTime,
      successRate
    };
  }
}

/**
 * Create and configure supervisor agent
 */
export function createSupervisorAgent(config?: SupervisorConfig): SupervisorAgent {
  return new SupervisorAgent(config);
}

/**
 * Global supervisor instance
 */
export const supervisorAgent = createSupervisorAgent();
