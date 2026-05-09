/**
 * Simple test to verify agent and approval schema compilation
 * This file can be used to verify the schema types are working correctly
 */

import {
  agentsTable,
  agentRunsTable,
  toolCallsTable,
  mcpServerBindingsTable,
  approvalRequestsTable,
  approvalDecisionsTable,
  insertAgentSchema,
  insertAgentRunSchema,
  insertToolCallSchema,
  insertMcpServerBindingSchema,
  insertApprovalRequestSchema,
  insertApprovalDecisionSchema,
  type Agent,
  type AgentRun,
  type ToolCall,
  type McpServerBinding,
  type ApprovalRequest,
  type ApprovalDecision
} from './schema';

// Test that types are properly exported
const testAgent: Agent = {
  id: 'test-id',
  tenantId: 'test-tenant-id',
  name: 'Test Agent',
  model: 'gpt-4',
  systemPrompt: 'You are a helpful assistant',
  status: 'idle',
  memoryUsageMb: 0,
  tokenCount: 0,
  lastHeartbeatAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const testInsertAgent = insertAgentSchema.parse({
  tenantId: 'test-tenant-id',
  name: 'Test Agent',
  model: 'gpt-4',
  systemPrompt: 'You are a helpful assistant',
  status: 'idle',
  memoryUsageMb: 0,
  tokenCount: 0
});

console.log('Agent schema test passed');
console.log('Agent tables:', { agentsTable, agentRunsTable, toolCallsTable, mcpServerBindingsTable });
console.log('Approval tables:', { approvalRequestsTable, approvalDecisionsTable });
console.log('Test agent:', testAgent);
console.log('Test insert agent:', testInsertAgent);
