/**
 * @file        artifacts/api-server/src/lib/agents/registry.ts
 * @module      Agents / Registry
 * @purpose     Agent registry for loading definitions and capability matching
 *
 * @ai_instructions
 *   - Load agent definitions from database with caching
 *   - Implement capability matching based on agent descriptions and tools
 *   - Support dynamic agent registration and discovery
 *   - Use semantic similarity for capability matching
 *   - Handle multi-tenant agent isolation
 *
 * @exports     AgentRegistry class with loadAgents, matchCapabilities methods
 * @imports     @workspace/db, @workspace/db/schema, node:events
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { EventEmitter } from "node:events";
import { db } from "@workspace/db";
import { 
  agentsTable, 
  mcpServerBindingsTable,
  mcpServers,
  mcpTools,
  type Agent,
  type McpServerBinding,
  type MCPTool
} from "@workspace/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { logger } from "../logger";
import { createEmbedder } from "../rag/embedder";

// Agent capability definition
export interface AgentCapability {
  agentId: string;
  agentName: string;
  description: string;
  model: string;
  capabilities: string[];
  tools: string[];
  trustTier: string;
  enabled: boolean;
}

// Capability matching result
export interface CapabilityMatch {
  agent: AgentCapability;
  score: number;
  reasoning: string;
}

// Registry configuration
export interface RegistryConfig {
  cacheTimeoutMs?: number;
  maxCacheSize?: number;
  enableSemanticMatching?: boolean;
}

export class AgentRegistry extends EventEmitter {
  private cache: Map<string, AgentCapability[]> = new Map();
  private cacheTimestamp: Map<string, number> = new Map();
  private embedder = createEmbedder();
  private config: Required<RegistryConfig>;

  constructor(config: RegistryConfig = {}) {
    super();
    this.config = {
      cacheTimeoutMs: config.cacheTimeoutMs || 5 * 60 * 1000, // 5 minutes
      maxCacheSize: config.maxCacheSize || 1000,
      enableSemanticMatching: config.enableSemanticMatching ?? true
    };
  }

  /**
   * Load all agents for a tenant with their capabilities
   */
  async loadAgents(tenantId: string): Promise<AgentCapability[]> {
    const cacheKey = `agents:${tenantId}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      logger.debug({ tenantId }, 'Loading agents from cache');
      return this.cache.get(cacheKey)!;
    }

    logger.info({ tenantId }, 'Loading agents from database');

    try {
      // Load agents with their MCP bindings and tools
      const agents = await db
        .select({
          agent: agentsTable,
          bindings: mcpServerBindingsTable,
        })
        .from(agentsTable)
        .leftJoin(
          mcpServerBindingsTable,
          and(
            eq(mcpServerBindingsTable.agentId, agentsTable.id),
            eq(mcpServerBindingsTable.enabled, true)
          )
        )
        .where(eq(agentsTable.tenantId, tenantId));

      // Group bindings by agent
      const agentMap = new Map<string, Array<{ agent: Agent; bindings: McpServerBinding | null }>>();
      agents.forEach(row => {
        if (!agentMap.has(row.agent.id)) {
          agentMap.set(row.agent.id, []);
        }
        agentMap.get(row.agent.id)!.push(row);
      });

      // Build capability list for each agent
      const capabilities: AgentCapability[] = [];
      
      for (const [agentId, rows] of agentMap) {
        const agent = rows[0].agent;
        const bindings = rows
          .map(r => r.bindings)
          .filter(Boolean) as McpServerBinding[];

        // Get available tools for this agent
        const tools = await this.getAgentTools(agentId, tenantId);
        
        // Extract capabilities from system prompt and tools
        const capabilitiesList = this.extractCapabilities(agent.systemPrompt, tools);

        const capability: AgentCapability = {
          agentId: agent.id,
          agentName: agent.name,
          description: agent.systemPrompt,
          model: agent.model,
          capabilities: capabilitiesList,
          tools: tools.map(t => t.name),
          trustTier: this.getHighestTrustTier(bindings),
          enabled: agent.status !== 'error'
        };

        capabilities.push(capability);
      }

      // Cache the results
      this.cache.set(cacheKey, capabilities);
      this.cacheTimestamp.set(cacheKey, Date.now());
      
      // Emit event for monitoring
      this.emit('agentsLoaded', { tenantId, count: capabilities.length });

      logger.info({ 
        tenantId, 
        agentCount: capabilities.length,
        totalTools: capabilities.reduce((sum, cap) => sum + cap.tools.length, 0)
      }, 'Successfully loaded agents');

      return capabilities;

    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId 
      }, 'Failed to load agents');
      throw error;
    }
  }

  /**
   * Match agents to a given task description
   */
  async matchCapabilities(
    taskDescription: string, 
    tenantId: string,
    options: {
      topK?: number;
      minScore?: number;
      includeDisabled?: boolean;
    } = {}
  ): Promise<CapabilityMatch[]> {
    const { topK = 5, minScore = 0.3, includeDisabled = false } = options;

    logger.debug({ 
      taskDescription: taskDescription.substring(0, 100),
      tenantId,
      topK,
      minScore
    }, 'Matching agent capabilities');

    try {
      const agents = await this.loadAgents(tenantId);
      
      // Filter out disabled agents unless requested
      const eligibleAgents = includeDisabled 
        ? agents 
        : agents.filter(agent => agent.enabled);

      if (eligibleAgents.length === 0) {
        logger.warn({ tenantId }, 'No eligible agents found for capability matching');
        return [];
      }

      let matches: CapabilityMatch[];

      if (this.config.enableSemanticMatching) {
        matches = await this.semanticMatching(taskDescription, eligibleAgents);
      } else {
        matches = await this.keywordMatching(taskDescription, eligibleAgents);
      }

      // Filter by minimum score and sort
      const filteredMatches = matches
        .filter(match => match.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      logger.info({ 
        tenantId,
        taskDescription: taskDescription.substring(0, 50),
        matchCount: filteredMatches.length,
        topScore: filteredMatches[0]?.score || 0
      }, 'Capability matching completed');

      return filteredMatches;

    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        taskDescription: taskDescription.substring(0, 100),
        tenantId
      }, 'Capability matching failed');
      throw error;
    }
  }

  /**
   * Get best matching agent for a task
   */
  async getBestAgent(
    taskDescription: string, 
    tenantId: string,
    options: { includeDisabled?: boolean } = {}
  ): Promise<CapabilityMatch | null> {
    const matches = await this.matchCapabilities(taskDescription, tenantId, { 
      topK: 1, 
      ...options 
    });
    
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Get tools available to a specific agent
   */
  private async getAgentTools(agentId: string, tenantId: string): Promise<MCPTool[]> {
    const bindings = await db
      .select({
        mcpServer: mcpServers,
        binding: mcpServerBindingsTable,
      })
      .from(mcpServerBindingsTable)
      .innerJoin(mcpServers, eq(mcpServers.id, mcpServerBindingsTable.mcpServerId))
      .where(
        and(
          eq(mcpServerBindingsTable.agentId, agentId),
          eq(mcpServerBindingsTable.tenantId, tenantId),
          eq(mcpServerBindingsTable.enabled, true)
        )
      );

    const tools: MCPTool[] = [];
    
    for (const binding of bindings) {
      const serverTools = await db
        .select()
        .from(mcpTools)
        .where(eq(mcpTools.serverId, binding.mcpServer.id));

      // Filter tools based on binding allow/deny lists
      const filteredTools = serverTools.filter(tool => {
        const allowed = binding.binding.allowedTools?.length === 0 || 
                       binding.binding.allowedTools?.includes(tool.name);
        const denied = binding.binding.deniedTools?.includes(tool.name);
        return allowed && !denied;
      });

      tools.push(...filteredTools);
    }

    return tools;
  }

  /**
   * Extract capabilities from agent system prompt and tools
   */
  private extractCapabilities(systemPrompt: string, tools: MCPTool[]): string[] {
    const capabilities = new Set<string>();

    // Extract from system prompt
    const promptCapabilities = [
      'code_review', 'code_generation', 'data_analysis', 'research', 
      'writing', 'documentation', 'testing', 'debugging', 'planning',
      'communication', 'file_operations', 'api_calls', 'database_queries'
    ];

    promptCapabilities.forEach(capability => {
      if (systemPrompt.toLowerCase().includes(capability.replace('_', ' '))) {
        capabilities.add(capability);
      }
    });

    // Extract from tool descriptions
    tools.forEach(tool => {
      if (tool.description) {
        const toolDesc = tool.description.toLowerCase();
        
        if (toolDesc.includes('file') || toolDesc.includes('read') || toolDesc.includes('write')) {
          capabilities.add('file_operations');
        }
        if (toolDesc.includes('api') || toolDesc.includes('http') || toolDesc.includes('request')) {
          capabilities.add('api_calls');
        }
        if (toolDesc.includes('database') || toolDesc.includes('sql') || toolDesc.includes('query')) {
          capabilities.add('database_queries');
        }
        if (toolDesc.includes('code') || toolDesc.includes('programming') || toolDesc.includes('development')) {
          capabilities.add('code_generation');
        }
      }
    });

    return Array.from(capabilities);
  }

  /**
   * Get highest trust tier from agent bindings
   */
  private getHighestTrustTier(bindings: McpServerBinding[]): string {
    if (bindings.length === 0) return 'untrusted';
    
    const trustOrder = ['untrusted', 'basic', 'trusted', 'privileged'];
    return bindings
      .map(b => b.trustTier)
      .reduce((highest, current) => {
        return trustOrder.indexOf(current) > trustOrder.indexOf(highest) ? current : highest;
      }, 'untrusted');
  }

  /**
   * Semantic matching using embeddings
   */
  private async semanticMatching(
    taskDescription: string, 
    agents: AgentCapability[]
  ): Promise<CapabilityMatch[]> {
    // Generate embedding for task description
    const taskEmbedding = await this.embedder.embedChunk(taskDescription);
    
    const matches: CapabilityMatch[] = [];

    for (const agent of agents) {
      // Create agent description for embedding
      const agentText = `${agent.agentName} ${agent.description} ${agent.capabilities.join(' ')} ${agent.tools.join(' ')}`;
      
      // Generate embedding for agent
      const agentEmbedding = await this.embedder.embedChunk(agentText);
      
      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(taskEmbedding.embedding, agentEmbedding.embedding);
      
      // Generate reasoning
      const reasoning = this.generateReasoning(taskDescription, agent, similarity);
      
      matches.push({
        agent,
        score: similarity,
        reasoning
      });
    }

    return Promise.resolve(matches);
  }

  /**
   * Keyword-based matching as fallback
   */
  private keywordMatching(
    taskDescription: string, 
    agents: AgentCapability[]
  ): Promise<CapabilityMatch[]> {
    const taskKeywords = taskDescription.toLowerCase().split(/\s+/);
    
    const matches = agents.map(agent => {
      const agentText = `${agent.agentName} ${agent.description} ${agent.capabilities.join(' ')} ${agent.tools.join(' ')}`.toLowerCase();
      
      // Calculate keyword overlap score
      const overlap = taskKeywords.filter(keyword => agentText.includes(keyword)).length;
      const score = overlap / Math.max(taskKeywords.length, 1);
      
      const reasoning = `Keyword overlap: ${overlap}/${taskKeywords.length} keywords matched`;
      
      return {
        agent,
        score,
        reasoning
      };
    });

    return Promise.resolve(matches);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate reasoning for match score
   */
  private generateReasoning(taskDescription: string, agent: AgentCapability, score: number): string {
    const reasons: string[] = [];
    
    if (score > 0.8) {
      reasons.push('Strong semantic match');
    } else if (score > 0.6) {
      reasons.push('Good semantic match');
    } else if (score > 0.4) {
      reasons.push('Moderate semantic match');
    } else {
      reasons.push('Weak semantic match');
    }

    // Add capability-specific reasoning
    const taskLower = taskDescription.toLowerCase();
    const matchingCapabilities = agent.capabilities.filter(cap => 
      taskLower.includes(cap.replace('_', ' '))
    );
    
    if (matchingCapabilities.length > 0) {
      reasons.push(`Matches capabilities: ${matchingCapabilities.join(', ')}`);
    }

    return reasons.join('; ');
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamp.get(key);
    if (!timestamp) return false;
    
    const isValid = Date.now() - timestamp < this.config.cacheTimeoutMs;
    
    if (!isValid) {
      this.cache.delete(key);
      this.cacheTimestamp.delete(key);
    }
    
    return isValid;
  }

  /**
   * Clear cache for a tenant or all tenants
   */
  clearCache(tenantId?: string): void {
    if (tenantId) {
      const key = `agents:${tenantId}`;
      this.cache.delete(key);
      this.cacheTimestamp.delete(key);
    } else {
      this.cache.clear();
      this.cacheTimestamp.clear();
    }
    
    logger.info({ tenantId }, 'Agent registry cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: Array<{ key: string; age: number; agentCount: number }> } {
    const entries = Array.from(this.cache.entries()).map(([key, agents]) => ({
      key,
      age: Date.now() - (this.cacheTimestamp.get(key) || 0),
      agentCount: agents.length
    }));

    return {
      size: this.cache.size,
      entries
    };
  }
}

/**
 * Create and configure agent registry
 */
export function createAgentRegistry(config?: RegistryConfig): AgentRegistry {
  return new AgentRegistry(config);
}

/**
 * Global registry instance
 */
export const agentRegistry = createAgentRegistry();
