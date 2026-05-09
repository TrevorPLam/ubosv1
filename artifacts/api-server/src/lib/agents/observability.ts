/**
 * @file        artifacts/api-server/src/lib/agents/observability.ts
 * @module      Agents / Observability
 * @purpose     OpenTelemetry instrumentation for LLM calls and tool invocations
 *
 * @ai_instructions
 *   - Implement OpenTelemetry spans for all LLM calls and tool invocations
 *   - Follow gen_ai semantic conventions for AI/ML operations
 *   - Include proper attributes for model names, token usage, and execution time
 *   - Support span hierarchies for supervisor-worker orchestration
 *   - Handle errors and exceptions properly with span status
 *
 * @exports     Observability utilities for agent operations
 * @imports     @opentelemetry/api, @opentelemetry/sdk-node
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { trace, Span, SpanStatusCode, SpanKind, context, Context, Attributes } from '@opentelemetry/api';
import { logger } from '../logger';

// Semantic convention attributes following gen_ai specification
export interface GenAIAttributes {
  'gen_ai.system': string;
  'gen_ai.request.model': string;
  'gen_ai.request.max_tokens'?: number;
  'gen_ai.request.temperature'?: number;
  'gen_ai.request.top_p'?: number;
  'gen_ai.request.messages_count'?: number;
  'gen_ai.response.model'?: string;
  'gen_ai.response.finish_reason'?: string;
  'gen_ai.usage.prompt_tokens'?: number;
  'gen_ai.usage.completion_tokens'?: number;
  'gen_ai.usage.total_tokens'?: number;
  'gen_ai.response.id'?: string;
  'gen_ai.response.created'?: number;
}

// Tool invocation attributes
export interface ToolAttributes {
  'tool.name': string;
  'tool.description'?: string;
  'tool.parameters'?: string;
  'tool.result.success': boolean;
  'tool.result.execution_time_ms'?: number;
  'tool.result.error'?: string;
}

// Agent orchestration attributes
export interface AgentAttributes {
  'agent.name': string;
  'agent.type': string;
  'agent.capabilities'?: string;
  'agent.task.id'?: string;
  'agent.task.description'?: string;
  'agent.task.complexity'?: string;
  'agent.orchestration.id'?: string;
  'agent.orchestration.step'?: string;
}

/**
 * Observability wrapper for agent operations
 */
export class AgentObservability {
  private tracer = trace.getTracer('agent-orchestration', '1.0.0');

  /**
   * Create a span for LLM completion
   */
  createLLMSpan(
    operationName: string,
    attributes: GenAIAttributes,
    parentSpan?: Span
  ): Span {
    const parentContext = parentSpan ? trace.setSpan(context.active(), parentSpan) : context.active();
    const span = this.tracer.startSpan(
      `gen_ai.${operationName}`,
      {
        kind: SpanKind.CLIENT,
        attributes: attributes as unknown as Attributes
      },
      parentContext
    );

    logger.debug({ 
      operationName, 
      spanId: span.spanContext().spanId,
      traceId: span.spanContext().traceId
    }, 'Created LLM span');

    return span;
  }

  /**
   * Create a span for tool invocation
   */
  createToolSpan(
    toolName: string,
    attributes: ToolAttributes,
    parentSpan?: Span
  ): Span {
    const span = this.tracer.startSpan(
      `tool.${toolName}`,
      {
        kind: SpanKind.INTERNAL,
        attributes: attributes as Attributes,
        parentSpan: parentSpan ? context.setSpan(context.active(), parentSpan) : undefined
      }
    );

    logger.debug({ 
      toolName, 
      spanId: span.spanContext().spanId,
      traceId: span.spanContext().traceId
    }, 'Created tool span');

    return span;
  }

  /**
   * Create a span for agent orchestration
   */
  createAgentSpan(
    operationName: string,
    attributes: AgentAttributes,
    parentSpan?: Span
  ): Span {
    const span = this.tracer.startSpan(
      `agent.${operationName}`,
      {
        kind: SpanKind.INTERNAL,
        attributes: attributes as Attributes,
        parentSpan: parentSpan ? context.setSpan(context.active(), parentSpan) : undefined
      }
    );

    logger.debug({ 
      operationName, 
      agentName: attributes['agent.name'],
      spanId: span.spanContext().spanId,
      traceId: span.spanContext().traceId
    }, 'Created agent span');

    return span;
  }

  /**
   * Wrap an LLM call with instrumentation
   */
  async withLLMSpan<T>(
    operationName: string,
    attributes: GenAIAttributes,
    fn: (span: Span) => Promise<T>,
    parentSpan?: Span
  ): Promise<T> {
    const span = this.createLLMSpan(operationName, attributes, parentSpan);
    const startTime = Date.now();

    try {
      const result = await fn(span);
      
      // Update span with success
      span.setStatus({ code: SpanStatusCode.OK });
      span.setAttributes({
        'gen_ai.response.time_ms': Date.now() - startTime
      });

      logger.debug({ 
        operationName,
        executionTime: Date.now() - startTime,
        spanId: span.spanContext().spanId
      }, 'LLM operation completed successfully');

      return result;

    } catch (error) {
      // Update span with error
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span.setAttributes({
        'gen_ai.response.time_ms': Date.now() - startTime,
        'gen_ai.response.error': error instanceof Error ? error.message : 'Unknown error'
      });

      logger.error({ 
        operationName,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        spanId: span.spanContext().spanId
      }, 'LLM operation failed');

      throw error;

    } finally {
      span.end();
    }
  }

  /**
   * Wrap a tool call with instrumentation
   */
  async withToolSpan<T>(
    toolName: string,
    attributes: ToolAttributes,
    fn: (span: Span) => Promise<T>,
    parentSpan?: Span
  ): Promise<T> {
    const span = this.createToolSpan(toolName, attributes, parentSpan);
    const startTime = Date.now();

    try {
      const result = await fn(span);
      
      // Update span with success
      span.setStatus({ code: SpanStatusCode.OK });
      span.setAttributes({
        'tool.result.execution_time_ms': Date.now() - startTime,
        'tool.result.success': true
      });

      logger.debug({ 
        toolName,
        executionTime: Date.now() - startTime,
        spanId: span.spanContext().spanId
      }, 'Tool operation completed successfully');

      return result;

    } catch (error) {
      // Update span with error
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span.setAttributes({
        'tool.result.execution_time_ms': Date.now() - startTime,
        'tool.result.success': false,
        'tool.result.error': error instanceof Error ? error.message : 'Unknown error'
      });

      logger.error({ 
        toolName,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        spanId: span.spanContext().spanId
      }, 'Tool operation failed');

      throw error;

    } finally {
      span.end();
    }
  }

  /**
   * Wrap an agent operation with instrumentation
   */
  async withAgentSpan<T>(
    operationName: string,
    attributes: AgentAttributes,
    fn: (span: Span) => Promise<T>,
    parentSpan?: Span
  ): Promise<T> {
    const span = this.createAgentSpan(operationName, attributes, parentSpan);
    const startTime = Date.now();

    try {
      const result = await fn(span);
      
      // Update span with success
      span.setStatus({ code: SpanStatusCode.OK });
      span.setAttributes({
        'agent.operation.time_ms': Date.now() - startTime,
        'agent.operation.success': true
      });

      logger.debug({ 
        operationName,
        agentName: attributes['agent.name'],
        executionTime: Date.now() - startTime,
        spanId: span.spanContext().spanId
      }, 'Agent operation completed successfully');

      return result;

    } catch (error) {
      // Update span with error
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span.setAttributes({
        'agent.operation.time_ms': Date.now() - startTime,
        'agent.operation.success': false,
        'agent.operation.error': error instanceof Error ? error.message : 'Unknown error'
      });

      logger.error({ 
        operationName,
        agentName: attributes['agent.name'],
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        spanId: span.spanContext().spanId
      }, 'Agent operation failed');

      throw error;

    } finally {
      span.end();
    }
  }

  /**
   * Get current active span
   */
  getActiveSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }

  /**
   * Add event to current span
   */
  addSpanEvent(name: string, attributes?: Record<string, unknown>): void {
    const span = this.getActiveSpan();
    if (span) {
      span.addEvent(name, attributes as Attributes);
      logger.debug({ eventName: name, spanId: span.spanContext().spanId }, 'Added span event');
    }
  }

  /**
   * Set attributes on current span
   */
  setSpanAttributes(attributes: Record<string, unknown>): void {
    const span = this.getActiveSpan();
    if (span) {
      span.setAttributes(attributes as Attributes);
      logger.debug({ 
        attributeCount: Object.keys(attributes).length,
        spanId: span.spanContext().spanId 
      }, 'Set span attributes');
    }
  }
}

/**
 * Global observability instance
 */
export const observability = new AgentObservability();

/**
 * Helper functions for common operations
 */

/**
 * Instrument OpenAI chat completion
 */
export function instrumentChatCompletion(
  model: string,
  messages: Array<any>,
  options: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  } = {},
  parentSpan?: Span
) {
  const attributes: GenAIAttributes = {
    'gen_ai.system': 'openai',
    'gen_ai.request.model': model,
    'gen_ai.request.temperature': options.temperature,
    'gen_ai.request.max_tokens': options.maxTokens,
    'gen_ai.request.top_p': options.topP,
    'gen_ai.request.messages_count': messages.length
  };

  return observability.withLLMSpan(
    'chat_completion',
    attributes,
    async (span) => {
      // The actual OpenAI call would be made here
      // This is a wrapper that instruments the call
      span.setAttributes({
        'gen_ai.request.messages': JSON.stringify(messages.slice(0, 3)) // First 3 messages for debugging
      });

      return await context.with(
        context.setSpan(context.active(), span),
        async () => {
          // Call would be made here
          // Return placeholder for now
          return null;
        }
      );
    },
    parentSpan
  );
}

/**
 * Instrument tool invocation
 */
export function instrumentToolCall(
  toolName: string,
  parameters: Record<string, unknown>,
  parentSpan?: Span
) {
  const attributes: ToolAttributes = {
    'tool.name': toolName,
    'tool.parameters': JSON.stringify(parameters),
    'tool.result.success': false // Will be updated after execution
  };

  return observability.withToolSpan(
    toolName,
    attributes,
    async (span) => {
      // The actual tool call would be made here
      span.setAttributes({
        'tool.parameters': JSON.stringify(parameters)
      });

      return await context.with(
        context.setSpan(context.active(), span),
        async () => {
          // Tool call would be made here
          // Return placeholder for now
          return null;
        }
      );
    },
    parentSpan
  );
}

/**
 * Instrument agent task execution
 */
export function instrumentAgentTask(
  agentName: string,
  agentType: string,
  taskDescription: string,
  parentSpan?: Span
) {
  const attributes: AgentAttributes = {
    'agent.name': agentName,
    'agent.type': agentType,
    'agent.task.description': taskDescription.substring(0, 200) // Truncate for span
  };

  return observability.withAgentSpan(
    'execute_task',
    attributes,
    async (span) => {
      return await context.with(
        context.setSpan(context.active(), span),
        async () => {
          // Task execution would happen here
          // Return placeholder for now
          return null;
        }
      );
    },
    parentSpan
  );
}
