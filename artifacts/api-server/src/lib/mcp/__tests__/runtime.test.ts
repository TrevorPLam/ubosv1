/**
 * @file        artifacts/api-server/src/lib/mcp/__tests__/runtime.test.ts
 * @module      MCP Runtime Tests
 * @purpose     Integration tests for MCP server runtime and security controls
 *
 * @ai_instructions
 *   - Test all major MCP runtime functions
 *   - Verify security controls are properly applied
 *   - Test error handling and edge cases
 *   - Use mock implementations for external dependencies
 *   - Follow Jest testing patterns
 *
 * @exports     Integration test suite for MCP runtime
 * @imports     jest, @workspace/db, mcp runtime and security modules
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { db } from "@workspace/db";
import { mcpServers, mcpTools } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { MCPRuntime, mcpRuntime } from "../runtime";
import { 
  URLValidator, 
  InputSanitizer, 
  RateLimiter, 
  AuditLogger,
  MCPSecurityMiddleware,
  SECURITY_CONFIG 
} from "../security";

// Mock database
jest.mock("@workspace/db", () => ({
  db: {
    query: {
      mcpServers: {
        findFirst: jest.fn(),
      },
      mcpTools: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    },
    update: jest.fn(),
    insert: jest.fn(),
  },
}));

// Mock logger
jest.mock("../logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock crypto.randomUUID
jest.mock("node:crypto", () => ({
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue("mocked-hash-12345678"),
  }),
}));

const mockDb = jest.mocked(db);

describe("MCP Runtime Integration Tests", () => {
  let runtime: MCPRuntime;
  const testTenantId = "00000000-0000-0000-0000-000000000001";
  const testServerId = "12345678-1234-1234-1234-123456789012";

  beforeEach(() => {
    runtime = new MCPRuntime();
    jest.clearAllMocks();
    RateLimiter.resetRateLimit(testServerId);
  });

  afterEach(async () => {
    await runtime.shutdown();
  });

  describe("Server Registration", () => {
    it("should successfully register an HTTP MCP server", async () => {
      const serverConfig = {
        id: testServerId,
        name: "Test HTTP Server",
        transportType: "http" as const,
        endpointUrl: "https://api.example.com/mcp",
        trustTier: "restricted" as const,
        enableDnsRebindingProtection: true,
        hostHeaderValidation: true,
      };

      // Mock database responses
      (mockDb.query.mcpServers.findFirst as jest.Mock).mockResolvedValue(null);
      (mockDb.update as jest.Mock).mockResolvedValue(undefined);
      (mockDb.insert as jest.Mock).mockResolvedValue(undefined);

      const result = await runtime.registerServer(serverConfig);

      expect(result).toBe(true);
      expect(mockDb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          set: expect.objectContaining({
            status: "active",
            lastHealthCheckAt: expect.any(Date),
          }),
        })
      );
    });

    it("should register a stdio MCP server with command", async () => {
      const serverConfig = {
        id: testServerId,
        name: "Test Stdio Server",
        transportType: "stdio" as const,
        command: "node",
        args: ["server.js"],
        env: { NODE_ENV: "test" },
        trustTier: "trusted" as const,
        enableDnsRebindingProtection: false,
        hostHeaderValidation: false,
      };

      (mockDb.query.mcpServers.findFirst as jest.Mock).mockResolvedValue(null);
      (mockDb.update as jest.Mock).mockResolvedValue(undefined);
      (mockDb.insert as jest.Mock).mockResolvedValue(undefined);

      const result = await runtime.registerServer(serverConfig);

      expect(result).toBe(true);
      expect(mockDb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          set: expect.objectContaining({
            status: "active",
          }),
        })
      );
    });

    it("should handle server registration failure gracefully", async () => {
      const invalidConfig = {
        id: testServerId,
        name: "Invalid Server",
        transportType: "http" as const,
        endpointUrl: "invalid-url",
        trustTier: "restricted" as const,
        enableDnsRebindingProtection: true,
        hostHeaderValidation: true,
      };

      (mockDb.query.mcpServers.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await runtime.registerServer(invalidConfig);

      expect(result).toBe(false);
      expect(mockDb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          set: expect.objectContaining({
            status: "error",
            errorMessage: expect.stringContaining("URL validation failed"),
          }),
        })
      );
    });

    it("should not register server that already exists and is active", async () => {
      const serverConfig = {
        id: testServerId,
        name: "Existing Server",
        transportType: "http" as const,
        endpointUrl: "https://api.example.com/mcp",
        trustTier: "restricted" as const,
        enableDnsRebindingProtection: true,
        hostHeaderValidation: true,
      };

      // Mock existing active server
      (mockDb.query.mcpServers.findFirst as jest.Mock).mockResolvedValue({
        id: testServerId,
        status: "active",
      });

      const result = await runtime.registerServer(serverConfig);

      expect(result).toBe(true);
      expect(mockDb.update).not.toHaveBeenCalled();
    });
  });

  describe("Tool Listing", () => {
    it("should list available tools from a server", async () => {
      const mockTools = [
        {
          id: "tool-1",
          name: "read_file",
          description: "Read a file from disk",
          inputSchema: { type: "object", properties: { path: { type: "string" } } },
          status: "available",
        },
        {
          id: "tool-2", 
          name: "write_file",
          description: "Write content to a file",
          inputSchema: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } } },
          status: "available",
        },
      ];

      (mockDb.query.mcpTools.findMany as jest.Mock).mockResolvedValue(mockTools);

      const tools = await runtime.listTools(testServerId);

      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe("read_file");
      expect(mockDb.query.mcpTools.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Function),
        })
      );
    });

    it("should throw error when no active connection exists", async () => {
      await expect(runtime.listTools("non-existent-server")).rejects.toThrow(
        "No active connection found for server non-existent-server"
      );
    });
  });

  describe("Tool Invocation", () => {
    const mockToolCall = {
      serverId: testServerId,
      toolName: "read_file",
      arguments: { path: "/tmp/test.txt" },
    };

    beforeEach(() => {
      // Mock server and tool lookup
      (mockDb.query.mcpTools.findFirst as jest.Mock).mockResolvedValue({
        id: "tool-1",
        name: "read_file",
        callCount: "0",
      });
      (mockDb.query.mcpServers.findFirst as jest.Mock).mockResolvedValue({
        id: testServerId,
        trustTier: "restricted",
      });
      (mockDb.update as jest.Mock).mockResolvedValue(undefined);
    });

    it("should successfully invoke a tool", async () => {
      // Mock connection exists
      const connection = {
        client: {
          callTool: jest.fn().mockResolvedValue({ content: "file content" }),
        },
        transport: {},
        serverId: testServerId,
      };
      
      // Add connection to runtime
      (runtime as any).connections.set(testServerId, connection);

      const result = await runtime.invokeTool(mockToolCall);

      expect(result.success).toBe(true);
      expect(result.result).toBe("file content");
      expect(result.trustTier).toBe("restricted");
      expect(mockDb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          set: expect.objectContaining({
            callCount: "1",
            lastCalledAt: expect.any(Date),
          }),
        })
      );
    });

    it("should handle tool execution failure", async () => {
      const connection = {
        client: {
          callTool: jest.fn().mockRejectedValue(new Error("Tool execution failed")),
        },
        transport: {},
        serverId: testServerId,
      };
      
      (runtime as any).connections.set(testServerId, connection);

      const result = await runtime.invokeTool(mockToolCall);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Tool execution failed");
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it("should respect rate limits for restricted servers", async () => {
      // Mock rate limiter to reject after limit
      jest.spyOn(RateLimiter, "checkRateLimit").mockResolvedValue(false);

      const connection = {
        client: {
          callTool: jest.fn(),
        },
        transport: {},
        serverId: testServerId,
      };
      
      (runtime as any).connections.set(testServerId, connection);

      const result = await runtime.invokeTool(mockToolCall);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Rate limit exceeded");
    });
  });

  describe("Server Disconnection", () => {
    it("should disconnect from a server and clean up resources", async () => {
      const connection = {
        client: {
          close: jest.fn().mockResolvedValue(undefined),
        },
        transport: {},
        serverId: testServerId,
      };
      
      (runtime as any).connections.set(testServerId, connection);
      (mockDb.update as jest.Mock).mockResolvedValue(undefined);

      await runtime.disconnectServer(testServerId);

      expect(connection.client.close).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalledWith(
        expect.objectContaining({
          set: { status: "inactive" },
        })
      );
    });

    it("should handle disconnection of non-existent server gracefully", async () => {
      await expect(runtime.disconnectServer("non-existent")).resolves.not.toThrow();
    });
  });

  describe("Runtime Shutdown", () => {
    it("should disconnect from all servers during shutdown", async () => {
      const connection1 = {
        client: { close: jest.fn().mockResolvedValue(undefined) },
        transport: {},
        serverId: "server-1",
      };
      const connection2 = {
        client: { close: jest.fn().mockResolvedValue(undefined) },
        transport: {},
        serverId: "server-2",
      };
      
      (runtime as any).connections.set("server-1", connection1);
      (runtime as any).connections.set("server-2", connection2);
      (mockDb.update as jest.Mock).mockResolvedValue(undefined);

      await runtime.shutdown();

      expect(connection1.client.close).toHaveBeenCalled();
      expect(connection2.client.close).toHaveBeenCalled();
      expect((runtime as any).connections.size).toBe(0);
    });
  });
});

describe("MCP Security Tests", () => {
  describe("URL Validation", () => {
    it("should validate secure HTTPS URLs", async () => {
      await expect(URLValidator.validateUrl("https://api.example.com/mcp")).resolves.not.toThrow();
    });

    it("should block private IP addresses", async () => {
      await expect(URLValidator.validateUrl("http://192.168.1.1/mcp")).rejects.toThrow(
        "SSRF protection: blocked private IP address"
      );
    });

    it("should block localhost unless explicitly allowed", async () => {
      await expect(URLValidator.validateUrl("http://localhost:8080/mcp")).rejects.toThrow(
        "SSRF protection: blocked private IP address"
      );

      await expect(URLValidator.validateUrl("http://localhost:8080/mcp", true)).resolves.not.toThrow();
    });

    it("should reject unsupported protocols", async () => {
      await expect(URLValidator.validateUrl("ftp://example.com/mcp")).rejects.toThrow(
        "Unsupported protocol: ftp:"
      );
    });

    it("should reject URLs exceeding maximum length", async () => {
      const longUrl = "https://example.com/" + "a".repeat(SECURITY_CONFIG.MAX_URL_LENGTH);
      await expect(URLValidator.validateUrl(longUrl)).rejects.toThrow(
        "URL exceeds maximum length"
      );
    });
  });

  describe("Input Sanitization", () => {
    it("should sanitize tool arguments", () => {
      const maliciousArgs = {
        "path\x00": "../../../etc/passwd",
        "content\r\n": "malicious content",
        "normal": "safe content",
        "number": 42,
        "boolean": true,
        "array": ["item1", "item2\x08"],
        "nested": {
          "key\x7F": "value",
          "safe": "data"
        }
      };

      const sanitized = InputSanitizer.sanitizeArguments(maliciousArgs);

      expect(sanitized).toEqual({
        "path": "../../../etc/passwd",
        "content": "malicious content",
        "normal": "safe content",
        "number": 42,
        "boolean": true,
        "array": ["item1", "item2"],
        "nested": {
          "key": "value",
          "safe": "data"
        }
      });
    });

    it("should remove unsupported data types", () => {
      const args = {
        "string": "safe",
        "function": () => {}, // Should be removed
        "symbol": Symbol("test"), // Should be removed
        "null": null,
        "undefined": undefined, // Should be removed
      };

      const sanitized = InputSanitizer.sanitizeArguments(args);

      expect(sanitized).toEqual({
        "string": "safe",
        "null": null,
      });
    });
  });

  describe("Rate Limiting", () => {
    it("should allow calls within rate limit", async () => {
      const result1 = await RateLimiter.checkRateLimit(testServerId, "trusted");
      const result2 = await RateLimiter.checkRateLimit(testServerId, "trusted");

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it("should block calls exceeding rate limit for restricted servers", async () => {
      // Exhaust the rate limit (60 calls per minute for restricted)
      for (let i = 0; i < 60; i++) {
        await RateLimiter.checkRateLimit(testServerId, "restricted");
      }

      const result = await RateLimiter.checkRateLimit(testServerId, "restricted");
      expect(result).toBe(false);
    });

    it("should have higher limits for trusted servers", async () => {
      // Exhaust restricted limit
      for (let i = 0; i < 60; i++) {
        await RateLimiter.checkRateLimit(testServerId, "restricted");
      }

      const restrictedResult = await RateLimiter.checkRateLimit(testServerId, "restricted");
      const trustedResult = await RateLimiter.checkRateLimit(testServerId + "-trusted", "trusted");

      expect(restrictedResult).toBe(false);
      expect(trustedResult).toBe(true);
    });
  });

  describe("Audit Logging", () => {
    it("should log successful tool executions", async () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation();
      
      await AuditLogger.logToolExecution({
        serverId: testServerId,
        toolName: "test_tool",
        arguments: { input: "test" },
        result: "success",
        executionTime: 1000,
        trustTier: "restricted",
        tenantId: testTenantId,
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "tool_execution",
          serverId: testServerId,
          toolName: "test_tool",
          success: true,
          executionTime: 1000,
          trustTier: "restricted",
          tenantId: testTenantId,
        })
      );

      logSpy.mockRestore();
    });

    it("should log failed tool executions", async () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation();
      
      await AuditLogger.logToolExecution({
        serverId: testServerId,
        toolName: "test_tool",
        arguments: { input: "test" },
        error: "Tool failed",
        executionTime: 500,
        trustTier: "restricted",
        tenantId: testTenantId,
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: "tool_execution",
          success: false,
          error: "Tool failed",
        })
      );

      logSpy.mockRestore();
    });

    it("should hash arguments for privacy", async () => {
      const logSpy = jest.spyOn(console, "log").mockImplementation();
      
      await AuditLogger.logToolExecution({
        serverId: testServerId,
        toolName: "test_tool",
        arguments: { sensitive: "data", token: "secret" },
        result: "success",
        executionTime: 1000,
        trustTier: "restricted",
        tenantId: testTenantId,
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          argumentsHash: "mocked-hash-12345678", // Should be hashed, not plain text
        })
      );

      logSpy.mockRestore();
    });
  });

  describe("Security Middleware", () => {
    it("should validate tool call requests", async () => {
      const validCall = {
        serverId: testServerId,
        toolName: "test_tool",
        arguments: { input: "test" },
      };

      (mockDb.query.mcpServers.findFirst as jest.Mock).mockResolvedValue({
        id: testServerId,
        trustTier: "restricted",
      });

      jest.spyOn(RateLimiter, "checkRateLimit").mockResolvedValue(true);

      const result = await MCPSecurityMiddleware.validateToolCall(validCall, testTenantId);

      expect(result.serverId).toBe(testServerId);
      expect(result.toolName).toBe("test_tool");
      expect(result.arguments).toEqual({ input: "test" });
    });

    it("should reject requests for non-existent servers", async () => {
      const invalidCall = {
        serverId: "non-existent",
        toolName: "test_tool",
        arguments: {},
      };

      (mockDb.query.mcpServers.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        MCPSecurityMiddleware.validateToolCall(invalidCall, testTenantId)
      ).rejects.toThrow("Server not found or access denied");
    });

    it("should validate server configurations", async () => {
      const validConfig = {
        endpointUrl: "https://api.example.com/mcp",
        command: "node",
        args: ["server.js"],
        env: { NODE_ENV: "test" },
      };

      jest.spyOn(URLValidator, "validateUrl").mockResolvedValue(undefined);

      const result = await MCPSecurityMiddleware.validateServerConfig(validConfig, testTenantId);

      expect(result.endpointUrl).toBe("https://api.example.com/mcp");
      expect(result.command).toBe("node");
    });
  });
});
