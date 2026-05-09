/**
 * @file        artifacts/api-server/src/lib/agents/__tests__/integration.test.ts
 * @module      Agents / Integration Tests
 * @purpose     Integration tests for supervisor-worker orchestration
 *
 * @ai_instructions
 *   - Test full supervisor-worker-tool orchestration flow
 *   - Mock external dependencies (OpenAI, MCP runtime, database)
 *   - Verify task decomposition, delegation, and synthesis
 *   - Test error handling and timeout scenarios
 *   - Validate checkpointing and observability
 *
 * @exports     Integration test suite for agent orchestration
 * @imports     vitest, mock implementations, agent modules
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SupervisorAgent } from '../supervisor';
import { AgentRegistry } from '../registry';
import { WorkerAgent } from '../worker';
import { CheckpointSaver } from '../checkpoint';
import { observability } from '../observability';
import type { AgentCapability } from '../registry';

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }))
}));

// Mock database
vi.mock('@workspace/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn()
  }
}));

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock OpenTelemetry
vi.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: vi.fn().mockReturnValue({
      startSpan: vi.fn().mockReturnValue({
        spanContext: vi.fn().mockReturnValue({
          spanId: 'test-span-id',
          traceId: 'test-trace-id'
        }),
        setAttributes: vi.fn(),
        setStatus: vi.fn(),
        addEvent: vi.fn(),
        end: vi.fn()
      })
    }),
    setSpan: vi.fn()
  },
  context: {
    active: vi.fn(),
    setSpan: vi.fn()
  },
  SpanStatusCode: {
    OK: 1,
    ERROR: 2
  },
  SpanKind: {
    CLIENT: 1,
    INTERNAL: 2
  }
}));

describe('Agent Orchestration Integration Tests', () => {
  let supervisorAgent: SupervisorAgent;
  let agentRegistry: AgentRegistry;
  let checkpointSaver: CheckpointSaver;
  let mockAgentCapabilities: AgentCapability[];

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock agent capabilities
    mockAgentCapabilities = [
      {
        agentId: 'code-reviewer-1',
        agentName: 'CodeReviewer',
        description: 'Specializes in code review and analysis',
        model: 'gpt-4',
        capabilities: ['code_review', 'code_analysis', 'debugging'],
        tools: ['read_file', 'analyze_code', 'write_report'],
        trustTier: 'trusted',
        enabled: true
      },
      {
        agentId: 'research-bot-1',
        agentName: 'ResearchBot',
        description: 'Specializes in research and information gathering',
        model: 'gpt-4',
        capabilities: ['research', 'data_analysis', 'reporting'],
        tools: ['search_web', 'analyze_data', 'create_report'],
        trustTier: 'trusted',
        enabled: true
      }
    ];

    // Initialize components
    agentRegistry = new AgentRegistry();
    checkpointSaver = new CheckpointSaver();
    supervisorAgent = new SupervisorAgent({
      maxSubtasks: 4,
      maxParallelWorkers: 2,
      taskTimeoutMs: 30000
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Full Orchestration Flow', () => {
    it('should complete a simple supervisor-worker orchestration', async () => {
      const task = 'Review the authentication service code and create a summary report';
      const tenantId = 'test-tenant';

      // Mock agent registry responses
      vi.spyOn(agentRegistry, 'loadAgents').mockResolvedValue(mockAgentCapabilities);
      vi.spyOn(agentRegistry, 'matchCapabilities').mockResolvedValue([
        {
          agent: mockAgentCapabilities[0], // CodeReviewer
          score: 0.9,
          reasoning: 'Strong match for code review task'
        }
      ]);

      // Mock OpenAI responses
      const OpenAI = await import('openai');
      const mockCreate = vi.mocked(OpenAI.default).mock.instances[0].chat.completions.create;

      // Mock task decomposition
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                id: 'subtask-1',
                description: 'Analyze authentication service code structure',
                requirements: ['Identify main components', 'Check for security issues'],
                dependencies: [],
                estimatedComplexity: 'medium',
                suggestedAgentType: 'CodeReviewer',
                priority: 1
              },
              {
                id: 'subtask-2',
                description: 'Create summary report of findings',
                requirements: ['Document security issues', 'Provide recommendations'],
                dependencies: ['subtask-1'],
                estimatedComplexity: 'low',
                suggestedAgentType: 'CodeReviewer',
                priority: 2
              }
            ])
          }
        }]
      });

      // Mock worker execution
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: 'Code analysis complete. Found 3 security issues and 5 optimization opportunities.',
            tool_calls: undefined
          }
        }],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 25
        }
      });

      // Mock synthesis
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              confidence: 0.85,
              summary: 'CodeReviewer analyzed the authentication service and identified security issues',
              response: 'The authentication service code has been reviewed and analyzed. Key findings include: 1) Three security vulnerabilities identified, 2) Five optimization opportunities discovered, 3) Overall code quality is good with room for improvement.'
            })
          }
        }]
      });

      // Mock database operations
      const { db } = await import('@workspace/db');
      vi.mocked(db.insert).mockResolvedValue([{ id: 'agent-run-1' }]);
      vi.mocked(db.update).mockResolvedValue([]);
      vi.mocked(db.select).mockResolvedValue([]);

      // Execute orchestration
      const result = await supervisorAgent.processTask(task, tenantId);

      // Verify results
      expect(result).toBeDefined();
      expect(result.finalResponse).toContain('authentication service');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.metadata.subtaskCount).toBe(2);
      expect(result.metadata.successCount).toBe(2);
      expect(result.metadata.failureCount).toBe(0);

      // Verify orchestration steps
      expect(agentRegistry.loadAgents).toHaveBeenCalledWith(tenantId);
      expect(agentRegistry.matchCapabilities).toHaveBeenCalledWith(
        expect.stringContaining('authentication service'),
        tenantId
      );

      // Verify OpenAI calls
      expect(mockCreate).toHaveBeenCalledTimes(3); // decomposition, worker, synthesis
    });

    it('should handle parallel worker execution', async () => {
      const task = 'Research market trends and analyze competitor data, then create a comprehensive report';
      const tenantId = 'test-tenant';

      // Mock agent registry with multiple agents
      vi.spyOn(agentRegistry, 'loadAgents').mockResolvedValue(mockAgentCapabilities);
      vi.spyOn(agentRegistry, 'matchCapabilities').mockResolvedValue([
        {
          agent: mockAgentCapabilities[1], // ResearchBot
          score: 0.9,
          reasoning: 'Strong match for research task'
        },
        {
          agent: mockAgentCapabilities[0], // CodeReviewer
          score: 0.7,
          reasoning: 'Can help with report formatting'
        }
      ]);

      // Mock OpenAI responses
      const OpenAI = await import('openai');
      const mockCreate = vi.mocked(OpenAI.default).mock.instances[0].chat.completions.create;

      // Mock task decomposition with parallel subtasks
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                id: 'subtask-1',
                description: 'Research market trends',
                requirements: ['Gather market data', 'Identify key trends'],
                dependencies: [],
                estimatedComplexity: 'medium',
                suggestedAgentType: 'ResearchBot',
                priority: 1
              },
              {
                id: 'subtask-2',
                description: 'Analyze competitor data',
                requirements: ['Collect competitor information', 'Perform analysis'],
                dependencies: [],
                estimatedComplexity: 'medium',
                suggestedAgentType: 'ResearchBot',
                priority: 1
              },
              {
                id: 'subtask-3',
                description: 'Create comprehensive report',
                requirements: ['Synthesize findings', 'Format report'],
                dependencies: ['subtask-1', 'subtask-2'],
                estimatedComplexity: 'low',
                suggestedAgentType: 'CodeReviewer',
                priority: 2
              }
            ])
          }
        }]
      });

      // Mock worker executions
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: 'Market trends research complete. Identified 5 key trends.',
            tool_calls: undefined
          }
        }]
      });

      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: 'Competitor analysis complete. Analyzed 10 competitors.',
            tool_calls: undefined
          }
        }]
      });

      // Mock synthesis
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              confidence: 0.9,
              summary: 'Research completed successfully with comprehensive analysis',
              response: 'Comprehensive market analysis completed. Key findings include 5 market trends and analysis of 10 competitors. Report has been synthesized and formatted.'
            })
          }
        }]
      });

      // Mock database operations
      const { db } = await import('@workspace/db');
      vi.mocked(db.insert).mockResolvedValue([{ id: 'agent-run-1' }]);
      vi.mocked(db.update).mockResolvedValue([]);
      vi.mocked(db.select).mockResolvedValue([]);

      // Execute orchestration
      const result = await supervisorAgent.processTask(task, tenantId);

      // Verify parallel execution
      expect(result.metadata.subtaskCount).toBe(3);
      expect(result.metadata.successCount).toBe(3);
      expect(result.confidence).toBeGreaterThan(0.85);

      // Verify OpenAI calls for parallel execution
      expect(mockCreate).toHaveBeenCalledTimes(4); // decomposition, 2 workers, synthesis
    });

    it('should handle worker failures gracefully', async () => {
      const task = 'Process complex data with unreliable external service';
      const tenantId = 'test-tenant';

      // Mock agent registry
      vi.spyOn(agentRegistry, 'loadAgents').mockResolvedValue(mockAgentCapabilities);
      vi.spyOn(agentRegistry, 'matchCapabilities').mockResolvedValue([
        {
          agent: mockAgentCapabilities[0],
          score: 0.8,
          reasoning: 'Agent available for task'
        }
      ]);

      // Mock OpenAI responses
      const OpenAI = await import('openai');
      const mockCreate = vi.mocked(OpenAI.default).mockInstances[0].chat.completions.create;

      // Mock task decomposition
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                id: 'subtask-1',
                description: 'Process data with external service',
                requirements: ['Call external API', 'Process response'],
                dependencies: [],
                estimatedComplexity: 'high',
                suggestedAgentType: 'CodeReviewer',
                priority: 1
              }
            ])
          }
        }]
      });

      // Mock worker failure
      mockCreate.mockRejectedValueOnce(new Error('External service unavailable'));

      // Mock database operations
      const { db } = await import('@workspace/db');
      vi.mocked(db.insert).mockResolvedValue([{ id: 'agent-run-1' }]);
      vi.mocked(db.update).mockResolvedValue([]);
      vi.mocked(db.select).mockResolvedValue([]);

      // Execute orchestration - should handle failure gracefully
      const result = await supervisorAgent.processTask(task, tenantId);

      // Verify failure handling
      expect(result.metadata.failureCount).toBe(1);
      expect(result.metadata.successCount).toBe(0);
      expect(result.finalResponse).toContain('Unable to complete the task');

      // Verify error was logged
      const { logger } = await import('../logger');
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'External service unavailable'
        }),
        expect.stringContaining('Worker task failed')
      );
    });
  });

  describe('Checkpointing Integration', () => {
    it('should save and restore orchestration state', async () => {
      const task = 'Long running complex task';
      const tenantId = 'test-tenant';

      // Mock checkpoint saver
      vi.spyOn(checkpointSaver, 'put').mockResolvedValue();
      vi.spyOn(checkpointSaver, 'get').mockResolvedValue(null);

      // Mock agent registry
      vi.spyOn(agentRegistry, 'loadAgents').mockResolvedValue(mockAgentCapabilities);
      vi.spyOn(agentRegistry, 'matchCapabilities').mockResolvedValue([
        {
          agent: mockAgentCapabilities[0],
          score: 0.8,
          reasoning: 'Agent available'
        }
      ]);

      // Mock OpenAI responses
      const OpenAI = await import('openai');
      const mockCreate = vi.mocked(OpenAI.default).mockInstances[0].chat.completions.create;

      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                id: 'subtask-1',
                description: 'Simple subtask',
                requirements: ['Complete task'],
                dependencies: [],
                estimatedComplexity: 'low',
                suggestedAgentType: 'CodeReviewer',
                priority: 1
              }
            ])
          }
        }]
      });

      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: 'Task completed successfully',
            tool_calls: undefined
          }
        }]
      });

      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              confidence: 0.8,
              summary: 'Task completed',
              response: 'Final response'
            })
          }
        }]
      });

      // Mock database operations
      const { db } = await import('@workspace/db');
      vi.mocked(db.insert).mockResolvedValue([{ id: 'agent-run-1' }]);
      vi.mocked(db.update).mockResolvedValue([]);
      vi.mocked(db.select).mockResolvedValue([]);

      // Execute orchestration with checkpointing enabled
      const result = await supervisorAgent.processTask(task, tenantId);

      // Verify checkpointing was attempted
      expect(checkpointSaver.put).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('Observability Integration', () => {
    it('should create OpenTelemetry spans for orchestration', async () => {
      const task = 'Test task for observability';
      const tenantId = 'test-tenant';

      // Mock observability
      vi.spyOn(observability, 'withAgentSpan').mockImplementation(async (name, attrs, fn) => {
        return await fn({} as any);
      });
      vi.spyOn(observability, 'withLLMSpan').mockImplementation(async (name, attrs, fn) => {
        return await fn({} as any);
      });

      // Mock agent registry
      vi.spyOn(agentRegistry, 'loadAgents').mockResolvedValue(mockAgentCapabilities);
      vi.spyOn(agentRegistry, 'matchCapabilities').mockResolvedValue([
        {
          agent: mockAgentCapabilities[0],
          score: 0.8,
          reasoning: 'Agent available'
        }
      ]);

      // Mock OpenAI responses
      const OpenAI = await import('openai');
      const mockCreate = vi.mocked(OpenAI.default).mockInstances[0].chat.completions.create;

      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                id: 'subtask-1',
                description: 'Simple subtask',
                requirements: ['Complete task'],
                dependencies: [],
                estimatedComplexity: 'low',
                suggestedAgentType: 'CodeReviewer',
                priority: 1
              }
            ])
          }
        }]
      });

      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: 'Task completed',
            tool_calls: undefined
          }
        }]
      });

      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              confidence: 0.8,
              summary: 'Task completed',
              response: 'Final response'
            })
          }
        }]
      });

      // Mock database operations
      const { db } = await import('@workspace/db');
      vi.mocked(db.insert).mockResolvedValue([{ id: 'agent-run-1' }]);
      vi.mocked(db.update).mockResolvedValue([]);
      vi.mocked(db.select).mockResolvedValue([]);

      // Execute orchestration
      await supervisorAgent.processTask(task, tenantId);

      // Verify observability was used
      expect(observability.withAgentSpan).toHaveBeenCalled();
      expect(observability.withLLMSpan).toHaveBeenCalled();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle timeout scenarios', async () => {
      const task = 'Very long running task';
      const tenantId = 'test-tenant';

      // Create supervisor with short timeout
      const shortTimeoutSupervisor = new SupervisorAgent({
        taskTimeoutMs: 100 // 100ms timeout
      });

      // Mock agent registry
      vi.spyOn(agentRegistry, 'loadAgents').mockResolvedValue(mockAgentCapabilities);
      vi.spyOn(agentRegistry, 'matchCapabilities').mockResolvedValue([
        {
          agent: mockAgentCapabilities[0],
          score: 0.8,
          reasoning: 'Agent available'
        }
      ]);

      // Mock OpenAI with delay
      const OpenAI = await import('openai');
      const mockCreate = vi.mocked(OpenAI.default).mock.instances[0].chat.completions.create;

      mockCreate.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 200)) // Delay longer than timeout
      );

      // Execute orchestration - should timeout
      await expect(shortTimeoutSupervisor.processTask(task, tenantId))
        .rejects.toThrow('Task timeout');
    });

    it('should respect parallel worker limits', async () => {
      const task = 'Task with many subtasks';
      const tenantId = 'test-tenant';

      // Create supervisor with limited parallel workers
      const limitedSupervisor = new SupervisorAgent({
        maxParallelWorkers: 1 // Only 1 worker at a time
      });

      // Mock agent registry
      vi.spyOn(agentRegistry, 'loadAgents').mockResolvedValue(mockAgentCapabilities);
      vi.spyOn(agentRegistry, 'matchCapabilities').mockResolvedValue([
        {
          agent: mockAgentCapabilities[0],
          score: 0.8,
          reasoning: 'Agent available'
        }
      ]);

      // Mock OpenAI responses
      const OpenAI = await import('openai');
      const mockCreate = vi.mocked(OpenAI.default).mockInstances[0].chat.completions.create;

      // Mock task decomposition with multiple subtasks
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                id: 'subtask-1',
                description: 'First subtask',
                requirements: ['Complete first'],
                dependencies: [],
                estimatedComplexity: 'low',
                suggestedAgentType: 'CodeReviewer',
                priority: 1
              },
              {
                id: 'subtask-2',
                description: 'Second subtask',
                requirements: ['Complete second'],
                dependencies: [],
                estimatedComplexity: 'low',
                suggestedAgentType: 'CodeReviewer',
                priority: 1
              }
            ])
          }
        }]
      });

      // Mock worker execution with delay
      mockCreate.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            choices: [{
              message: {
                content: 'Subtask completed',
                tool_calls: undefined
              }
            }]
          }), 50)
        )
      );

      // Mock database operations
      const { db } = await import('@workspace/db');
      vi.mocked(db.insert).mockResolvedValue([{ id: 'agent-run-1' }]);
      vi.mocked(db.update).mockResolvedValue([]);
      vi.mocked(db.select).mockResolvedValue([]);

      // Execute orchestration
      const startTime = Date.now();
      await limitedSupervisor.processTask(task, tenantId);
      const executionTime = Date.now() - startTime;

      // Should take longer due to sequential execution
      expect(executionTime).toBeGreaterThan(90); // At least 2 * 50ms for sequential execution
    });
  });
});
