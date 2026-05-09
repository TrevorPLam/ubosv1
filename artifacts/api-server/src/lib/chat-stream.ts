/**
 * @file        artifacts/api-server/src/lib/chat-stream.ts
 * @module      API Server / Services / Chat Streaming
 * @purpose     Server-Sent Events (SSE) streaming for real-time chat responses
 *
 * @ai_instructions
 *   - Implement proper SSE connection management
 *   - Handle client disconnections gracefully
 *   - Support token streaming from LLM providers
 *   - Include proper error handling and cleanup
 *   - Follow SSE best practices with proper event formatting
 *
 * @exports     chatStreamService with SSE streaming capabilities
 * @imports     express, database, error handling
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Response } from "express";
import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import { db } from "@workspace/db";
import { messagesTable, chatThreadsTable } from "@workspace/db";
import { AppError, ErrorTypes } from "../middlewares/error-handler";
import { isEnabled, FEATURE_FLAGS, type FeatureFlagContext } from "./feature-flags";

interface StreamClient {
  id: string;
  response: Response;
  threadId: string;
  messageId: string;
  tenantId: string;
  userId: string;
  connectedAt: Date;
}

interface StreamEvent {
  id?: number;
  event: string;
  data: any;
}

class ChatStreamService {
  private clients = new Map<string, StreamClient>();
  private eventCounter = 0;

  /**
   * Add a new SSE client connection
   */
  async addClient(
    clientId: string,
    res: Response,
    threadId: string,
    messageId: string,
    tenantId: string,
    userId: string
  ): Promise<void> {
    // Check if AI chat streaming is enabled
    const context: FeatureFlagContext = {
      tenantId,
      userId,
    };
    
    const streamingEnabled = await isEnabled(FEATURE_FLAGS.AI_CHAT_STREAMING, context);
    if (!streamingEnabled) {
      throw new AppError(
        'AI chat streaming is currently disabled',
        503,
        ErrorTypes.ServiceUnavailable
      );
    }
    const client: StreamClient = {
      id: clientId,
      response: res,
      threadId,
      messageId,
      tenantId,
      userId,
      connectedAt: new Date(),
    };

    this.clients.set(clientId, client);

    // Send connection confirmation
    this.sendToClient(clientId, "connected", {
      clientId,
      threadId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Remove a client connection
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        // End the response if not already ended
        if (!client.response.destroyed) {
          client.response.end();
        }
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    this.clients.delete(clientId);
  }

  /**
   * Send an event to a specific client
   */
  sendToClient(clientId: string, event: string, data: any): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    const eventId = ++this.eventCounter;
    const message = this.formatMessage(eventId, event, data);

    try {
      client.response.write(message);
      return true;
    } catch (error) {
      // Client disconnected, remove them
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Stream assistant response for a message
   */
  async streamResponse(
    clientId: string,
    threadId: string,
    messageId: string,
    tenantId: string,
    userId: string,
    res: Response
  ): Promise<void> {
    try {
      // Verify message exists and user has access
      const [message] = await db
        .select({
          messageId: messagesTable.id,
          threadId: messagesTable.threadId,
          role: messagesTable.role,
          content: messagesTable.content,
          tenantId: chatThreadsTable.tenantId,
        })
        .from(messagesTable)
        .innerJoin(chatThreadsTable, eq(messagesTable.threadId, chatThreadsTable.id))
        .where(
          and(
            eq(messagesTable.id, messageId),
            eq(messagesTable.threadId, threadId),
            eq(chatThreadsTable.tenantId, tenantId)
          )
        );

      if (!message) {
        this.sendToClient(clientId, "error", {
          error: "Message not found",
          code: "NOT_FOUND",
        });
        return;
      }

      if (message.role !== "user") {
        this.sendToClient(clientId, "error", {
          error: "Can only respond to user messages",
          code: "INVALID_MESSAGE_TYPE",
        });
        return;
      }

      // Add client to connection pool
      this.addClient(clientId, res, threadId, messageId, tenantId, userId);

      // Start streaming response
      await this.generateAndStreamResponse(clientId, message);

      // Send final event
      this.sendToClient(clientId, "done", {
        messageId: randomUUID(), // Will be updated when message is saved
        timestamp: new Date().toISOString(),
      });

      // Remove client after completion
      setTimeout(() => {
        this.removeClient(clientId);
      }, 1000);
    } catch (error) {
      this.sendToClient(clientId, "error", {
        error: "Streaming failed",
        code: "STREAM_ERROR",
        details: error instanceof Error ? error.message : String(error),
      });
      this.removeClient(clientId);
    }
  }

  /**
   * Generate and stream AI response
   */
  private async generateAndStreamResponse(
    clientId: string,
    userMessage: any
  ): Promise<void> {
    // Mock streaming response for now
    // In a real implementation, this would integrate with OpenAI/Anthropic APIs
    const mockResponse = "This is a mock AI response. In a real implementation, this would be generated by an LLM provider and streamed token by token.";
    
    // Simulate token streaming
    const tokens = mockResponse.split(" ");
    let accumulatedResponse = "";

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i] + (i < tokens.length - 1 ? " " : "");
      accumulatedResponse += token;

      // Send token event
      this.sendToClient(clientId, "token", {
        token,
        accumulated: accumulatedResponse,
        index: i,
        total: tokens.length,
      });

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Save the complete assistant message to database
    try {
      const [assistantMessage] = await db
        .insert(messagesTable)
        .values({
          threadId: userMessage.threadId,
          tenantId: userMessage.tenantId,
          role: "assistant",
          content: accumulatedResponse,
          groundingMode: "none", // Would be determined by context
          metadata: {
            generatedAt: new Date().toISOString(),
            model: "mock-model",
            tokenCount: tokens.length,
          },
        })
        .returning();

      // Send message saved event
      this.sendToClient(clientId, "message_saved", {
        messageId: assistantMessage.id,
        content: accumulatedResponse,
        timestamp: assistantMessage.createdAt,
      });
    } catch (error) {
      this.sendToClient(clientId, "error", {
        error: "Failed to save message",
        code: "SAVE_ERROR",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Format SSE message according to specification
   */
  private formatMessage(id: number, event: string, data: any): string {
    const lines = [
      `id: ${id}`,
      `event: ${event}`,
      `data: ${JSON.stringify(data)}`,
      "", // Empty line to end the event
      "", // Additional empty line for proper SSE format
    ];
    return lines.join("\n");
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    connectionsByThread: Record<string, number>;
    averageConnectionTime: number;
  } {
    const connectionsByThread: Record<string, number> = {};
    let totalConnectionTime = 0;

    for (const client of this.clients.values()) {
      connectionsByThread[client.threadId] = (connectionsByThread[client.threadId] || 0) + 1;
      totalConnectionTime += Date.now() - client.connectedAt.getTime();
    }

    return {
      totalConnections: this.clients.size,
      connectionsByThread,
      averageConnectionTime: this.clients.size > 0 ? totalConnectionTime / this.clients.size : 0,
    };
  }

  /**
   * Broadcast an event to all clients in a thread
   */
  broadcastToThread(threadId: string, event: string, data: any): number {
    let sentCount = 0;
    for (const [clientId, client] of this.clients) {
      if (client.threadId === threadId) {
        if (this.sendToClient(clientId, event, data)) {
          sentCount++;
        }
      }
    }
    return sentCount;
  }

  /**
   * Clean up inactive connections
   */
  cleanupInactiveConnections(): number {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    let cleaned = 0;

    for (const [clientId, client] of this.clients) {
      if (now - client.connectedAt.getTime() > timeout) {
        this.removeClient(clientId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

export const chatStreamService = new ChatStreamService();

// Periodic cleanup of inactive connections
setInterval(() => {
  const cleaned = chatStreamService.cleanupInactiveConnections();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} inactive SSE connections`);
  }
}, 60000); // Check every minute
