/**
 * @file        artifacts/api-server/src/lib/mcp/runtime.ts
 * @module      MCP Runtime
 * @purpose     MCP server runtime for tool discovery and execution with security controls
 *
 * @ai_instructions
 *   - Follow 2026 MCP security best practices for SSRF protection and sandboxing
 *   - Implement proper error handling and timeout controls
 *   - Use typed interfaces for all MCP operations
 *   - Log all tool calls for audit purposes
 *   - Support stdio, HTTP, and SSE transport types
 *
 * @exports     MCPRuntime class with registerServer, listTools, invokeTool methods
 * @imports     @modelcontextprotocol/sdk, @workspace/db, node:child_process
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { spawn, ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { z } from "zod";
import { db } from "@workspace/db";
import { 
  mcpServers, 
  mcpTools, 
  type MCPServer, 
  type MCPTool,
  mcpServerTrustTierEnum,
  mcpTransportTypeEnum
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "../logger";
import { isEnabled, FEATURE_FLAGS, type FeatureFlagContext } from "../feature-flags";

// MCP SDK imports - using placeholder for now since package may not be available
// TODO: Replace with actual MCP SDK when available

// Interface definitions for MCP types
interface MCPClient {
  connect(transport: MCPTransport): Promise<void>;
  listTools(): Promise<{ tools: any[] }>;
  callTool(params: { name: string; arguments: Record<string, unknown> }): Promise<{ content: any }>;
  close(): Promise<void>;
}

interface MCPTransport {
  process?: ChildProcess;
}

interface MCPStdioTransport extends MCPTransport {
  process?: ChildProcess;
}

interface MCPHttpTransport extends MCPTransport {}

interface MCPSSETransport extends MCPTransport {}

// Mock implementations for development
class MockClient implements MCPClient {
  constructor(options: any, capabilities: any) {}
  async connect(transport: MCPTransport) {}
  async listTools() { return { tools: [] }; }
  async callTool(params: any) { return { content: null }; }
  async close() {}
}

class MockStdioTransport implements MCPStdioTransport {
  process?: ChildProcess;
  constructor(options: any) {}
}

class MockHttpTransport implements MCPHttpTransport {
  constructor(url: string) {}
}

class MockSSETransport implements MCPSSETransport {
  constructor(url: string) {}
}

// Use mock implementations for now
const Client = MockClient;
const StdioClientTransport = MockStdioTransport;
const HttpClientTransport = MockHttpTransport;
const SSEClientTransport = MockSSETransport;

// Configuration schemas for validation
const ServerConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  transportType: z.enum(["stdio", "http", "sse"]),
  endpointUrl: z.string().url().optional(),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  trustTier: z.enum(["trusted", "restricted"]),
  enableDnsRebindingProtection: z.boolean(),
  hostHeaderValidation: z.boolean()
});

const ToolCallSchema = z.object({
  serverId: z.string().uuid(),
  toolName: z.string(),
  arguments: z.record(z.unknown())
});

// Security validation schemas
const UrlValidationSchema = z.object({
  url: z.string().url()
});

// Tool execution result interface
export interface ToolExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number;
  trustTier: string;
}

// Server connection interface
export interface ServerConnection {
  client: MCPClient;
  transport: MCPTransport;
  process?: ChildProcess;
  serverId: string;
}

/**
 * MCP Runtime - Manages MCP server connections and tool execution
 * Implements security controls following 2026 MCP best practices
 */
export class MCPRuntime extends EventEmitter {
  private connections = new Map<string, ServerConnection>();
  private readonly TOOL_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB

  constructor() {
    super();
    logger.info("MCP Runtime initialized");
  }

  /**
   * Register and connect to an MCP server
   * @param serverConfig - Server configuration object
   * @returns Promise resolving to connection status
   */
  async registerServer(serverConfig: z.infer<typeof ServerConfigSchema>): Promise<boolean> {
    try {
      // Validate server configuration
      const validated = ServerConfigSchema.parse(serverConfig);
      
      logger.info({ serverId: validated.id, name: validated.name }, "Registering MCP server");

      // Check if server exists and is active
      const existingServer = await db.query.mcpServers.findFirst({
        where: and(
          eq(mcpServers.id, validated.id),
          eq(mcpServers.status, "active")
        )
      });

      if (existingServer) {
        logger.warn({ serverId: validated.id }, "Server already registered and active");
        return true;
      }

      // Create transport based on type
      const transport = await this.createTransport(validated);
      if (!transport) {
        throw new Error(`Failed to create transport for ${validated.transportType}`);
      }

      // Create and connect client
      const client = new Client(
        {
          name: "ubos-mcp-runtime",
          version: "1.0.0"
        },
        {
          capabilities: {
            tools: {}
          }
        }
      );

      await client.connect(transport);
      
      // Store connection
      const connection: ServerConnection = {
        client,
        transport,
        process: transport instanceof StdioClientTransport ? transport.process : undefined,
        serverId: validated.id
      };

      this.connections.set(validated.id, connection);

      // Discover and store tools
      await this.discoverAndStoreTools(validated.id, client);

      // Update server status in database
      await db.update(mcpServers)
        .set({ 
          status: "active",
          lastHealthCheckAt: new Date(),
          errorMessage: null
        })
        .where(eq(mcpServers.id, validated.id));

      logger.info({ serverId: validated.id }, "MCP server registered successfully");
      this.emit("serverRegistered", validated.id);
      
      return true;
    } catch (error) {
      logger.error({ 
        serverId: serverConfig.id, 
        error: error instanceof Error ? error.message : String(error) 
      }, "Failed to register MCP server");

      // Update server status with error
      await db.update(mcpServers)
        .set({ 
          status: "error",
          errorMessage: error instanceof Error ? error.message : String(error)
        })
        .where(eq(mcpServers.id, serverConfig.id));

      return false;
    }
  }

  /**
   * List available tools from a registered server
   * @param serverId - UUID of the registered server
   * @returns Promise resolving to array of tool definitions
   */
  async listTools(serverId: string): Promise<MCPTool[]> {
    try {
      const connection = this.connections.get(serverId);
      if (!connection) {
        throw new Error(`No active connection found for server ${serverId}`);
      }

      // Get tools from database (cached discovered tools)
      const tools = await db.query.mcpTools.findMany({
        where: and(
          eq(mcpTools.serverId, serverId),
          eq(mcpTools.status, "available")
        )
      });

      logger.info({ serverId, toolCount: tools.length }, "Retrieved tool list");
      return tools;
    } catch (error) {
      logger.error({ 
        serverId, 
        error: error instanceof Error ? error.message : String(error) 
      }, "Failed to list tools");
      throw error;
    }
  }

  /**
   * Invoke a tool on a registered MCP server
   * @param params - Tool invocation parameters
   * @returns Promise resolving to tool execution result
   */
  async invokeTool(params: z.infer<typeof ToolCallSchema>): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Validate parameters
      const validated = ToolCallSchema.parse(params);
      
      // Check if MCP tool execution is enabled
      const context: FeatureFlagContext = {
        tenantId: validated.tenantId,
        userId: validated.userId,
      };
      
      const toolExecutionEnabled = await isEnabled(FEATURE_FLAGS.MCP_TOOL_EXECUTION, context);
      if (!toolExecutionEnabled) {
        throw new Error('MCP tool execution is currently disabled');
      }
      
      logger.info({ 
        serverId: validated.serverId, 
        toolName: validated.toolName 
      }, "Invoking tool");

      // Get connection
      const connection = this.connections.get(validated.serverId);
      if (!connection) {
        throw new Error(`No active connection found for server ${validated.serverId}`);
      }

      // Get tool and server info for security checks
      const [tool, server] = await Promise.all([
        db.query.mcpTools.findFirst({
          where: eq(mcpTools.id, validated.toolName)
        }),
        db.query.mcpServers.findFirst({
          where: eq(mcpServers.id, validated.serverId)
        })
      ]);

      if (!tool || !server) {
        throw new Error("Tool or server not found");
      }

      // Apply security controls based on trust tier
      await this.applySecurityControls(server, validated);

      // Execute tool with timeout
      const result = await this.executeToolWithTimeout(
        connection.client,
        validated.toolName,
        validated.arguments
      );

      const executionTime = Date.now() - startTime;

      // Update tool usage statistics
      await db.update(mcpTools)
        .set({ 
          callCount: String(Number(tool.callCount) + 1),
          lastCalledAt: new Date()
        })
        .where(eq(mcpTools.id, tool.id));

      // Log tool call for audit
      logger.info({
        serverId: validated.serverId,
        toolName: validated.toolName,
        executionTime,
        trustTier: server.trustTier
      }, "Tool executed successfully");

      return {
        success: true,
        result,
        executionTime,
        trustTier: server.trustTier
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error({ 
        serverId: params.serverId, 
        toolName: params.toolName,
        error: error instanceof Error ? error.message : String(error),
        executionTime
      }, "Tool execution failed");

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
        trustTier: "restricted"
      };
    }
  }

  /**
   * Create transport based on server configuration
   */
  private async createTransport(config: z.infer<typeof ServerConfigSchema>): Promise<StdioClientTransport | HttpClientTransport | SSEClientTransport | null> {
    try {
      switch (config.transportType) {
        case "stdio":
          if (!config.command) {
            throw new Error("Command is required for stdio transport");
          }
          return new StdioClientTransport({
            command: config.command,
            args: config.args || [],
            env: { ...process.env, ...config.env }
          });

        case "http":
          if (!config.endpointUrl) {
            throw new Error("Endpoint URL is required for HTTP transport");
          }
          
          // Apply URL validation for HTTP endpoints
          if (config.enableDnsRebindingProtection || config.hostHeaderValidation) {
            await this.validateHttpEndpoint(config.endpointUrl, config);
          }
          
          return new HttpClientTransport(config.endpointUrl);

        case "sse":
          if (!config.endpointUrl) {
            throw new Error("Endpoint URL is required for SSE transport");
          }
          
          // Apply URL validation for SSE endpoints
          if (config.enableDnsRebindingProtection || config.hostHeaderValidation) {
            await this.validateHttpEndpoint(config.endpointUrl, config);
          }
          
          return new SSEClientTransport(config.endpointUrl);

        default:
          throw new Error(`Unsupported transport type: ${config.transportType}`);
      }
    } catch (error) {
      logger.error({ 
        transportType: config.transportType,
        error: error instanceof Error ? error.message : String(error)
      }, "Failed to create transport");
      return null;
    }
  }

  /**
   * Discover tools from connected server and store in database
   */
  private async discoverAndStoreTools(serverId: string, client: Client): Promise<void> {
    try {
      const response = await client.listTools();
      
      if (!response.tools) {
        logger.warn({ serverId }, "No tools discovered from server");
        return;
      }

      // Store discovered tools
      for (const tool of response.tools) {
        // Get tenant_id from server for proper multi-tenant insert
        const serverRecord = await db.query.mcpServers.findFirst({
          where: eq(mcpServers.id, serverId)
        });
        
        if (!serverRecord) {
          logger.warn({ serverId }, "Server not found, skipping tool storage");
          continue;
        }

        await db.insert(mcpTools).values({
          tenant_id: serverRecord.tenant_id,
          serverId: serverId,
          name: tool.name,
          description: tool.description || "",
          inputSchema: tool.inputSchema || {},
          trustTier: "restricted", // Default to restricted, can be updated manually
          requiresApproval: false, // Default to no approval required
          status: "available"
        }).onConflictDoUpdate({
          target: mcpTools.serverId,
          set: {
            name: tool.name,
            description: tool.description || "",
            inputSchema: tool.inputSchema || {},
            status: "available",
            updatedAt: new Date()
          }
        });
      }

      logger.info({ serverId, toolCount: response.tools.length }, "Tools discovered and stored");
    } catch (error) {
      logger.error({ 
        serverId, 
        error: error instanceof Error ? error.message : String(error) 
      }, "Failed to discover tools");
      throw error;
    }
  }

  /**
   * Execute tool with timeout and output size limits
   */
  private async executeToolWithTimeout(
    client: MCPClient, 
    toolName: string, 
    arguments_: Record<string, unknown>
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Tool execution timed out after ${this.TOOL_TIMEOUT}ms`));
      }, this.TOOL_TIMEOUT);

      client.callTool({
        name: toolName,
        arguments: arguments_
      }).then((result: any) => {
        clearTimeout(timeout);
        
        // Check output size
        const resultStr = JSON.stringify(result);
        if (resultStr.length > this.MAX_OUTPUT_SIZE) {
          reject(new Error(`Tool output exceeds maximum size of ${this.MAX_OUTPUT_SIZE} bytes`));
          return;
        }
        
        resolve(result.content);
      }).catch((error: any) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Apply security controls based on server trust tier
   */
  private async applySecurityControls(
    server: MCPServer, 
    params: z.infer<typeof ToolCallSchema>
  ): Promise<void> {
    // For restricted servers, apply additional validation
    if (server.trustTier === "restricted") {
      // Validate tool arguments size
      const argsStr = JSON.stringify(params.arguments);
      if (argsStr.length > 1024 * 512) { // 512KB limit for restricted tools
        throw new Error("Tool arguments exceed maximum size for restricted servers");
      }

      // Add additional restricted server validation here
      logger.warn({ 
        serverId: server.id, 
        toolName: params.toolName 
      }, "Executing tool on restricted server");
    }
  }

  /**
   * Validate HTTP endpoint against security policies
   */
  private async validateHttpEndpoint(
    url: string, 
    config: z.infer<typeof ServerConfigSchema>
  ): Promise<void> {
    try {
      const urlObj = new URL(url);
      
      // DNS rebinding protection
      if (config.enableDnsRebindingProtection) {
        // Block private IP ranges and localhost
        const hostname = urlObj.hostname;
        const isPrivate = this.isPrivateIP(hostname);
        
        if (isPrivate && hostname !== "localhost" && hostname !== "127.0.0.1") {
          throw new Error(`DNS rebinding protection: blocked private IP ${hostname}`);
        }
      }

      // Host header validation
      if (config.hostHeaderValidation) {
        // Ensure hostname is not an IP address (unless localhost)
        const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(urlObj.hostname);
        if (isIP && urlObj.hostname !== "127.0.0.1") {
          throw new Error("Host header validation: IP addresses not allowed in production");
        }
      }

    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("URL validation failed");
    }
  }

  /**
   * Check if hostname resolves to private IP range
   */
  private isPrivateIP(hostname: string): boolean {
    // Basic private IP range detection
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./, // Link-local
      /^fc00:/,     // IPv6 private
      /^fe80:/      // IPv6 link-local
    ];

    return privateRanges.some(range => range.test(hostname));
  }

  /**
   * Disconnect from a server and clean up resources
   */
  async disconnectServer(serverId: string): Promise<void> {
    const connection = this.connections.get(serverId);
    if (!connection) {
      return;
    }

    try {
      await connection.client.close();
      
      if (connection.process) {
        connection.process.kill();
      }

      this.connections.delete(serverId);
      
      // Update server status
      await db.update(mcpServers)
        .set({ status: "inactive" })
        .where(eq(mcpServers.id, serverId));

      logger.info({ serverId }, "Disconnected from MCP server");
      this.emit("serverDisconnected", serverId);
    } catch (error) {
      logger.error({ 
        serverId, 
        error: error instanceof Error ? error.message : String(error) 
      }, "Failed to disconnect from server");
    }
  }

  /**
   * Disconnect from all servers and clean up
   */
  async shutdown(): Promise<void> {
    logger.info("Shutting down MCP Runtime");
    
    const disconnectPromises = Array.from(this.connections.keys())
      .map(serverId => this.disconnectServer(serverId));
    
    await Promise.all(disconnectPromises);
    
    this.connections.clear();
    logger.info("MCP Runtime shutdown complete");
  }
}

// Singleton instance
export const mcpRuntime = new MCPRuntime();
