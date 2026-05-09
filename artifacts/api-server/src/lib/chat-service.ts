/**
 * @file        artifacts/api-server/src/lib/chat-service.ts
 * @module      API Server / Services / Chat
 * @purpose     Business logic for chat operations, message persistence, and versioning
 *
 * @ai_instructions
 *   - Use Drizzle ORM for database operations
 *   - Implement proper tenant isolation
 *   - Handle message versioning for edits
 *   - Include proper error handling and validation
 *   - Follow existing service patterns from the codebase
 *
 * @exports     chatService with methods for thread/message management
 * @imports     drizzle-orm, database schema, error handling
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { eq, and, desc, asc, count } from "drizzle-orm";
import { db } from "@workspace/db";
import { 
  chatThreadsTable, 
  messagesTable, 
  messageVersionsTable,
  feedbackTable,
  summariesTable,
  citationsTable,
  type ChatThread,
  type InsertChatThread,
  type Message,
  type InsertMessage,
  type MessageVersion,
  type InsertMessageVersion,
  type Feedback,
  type InsertFeedback,
  type Summary,
  type InsertSummary
} from "@workspace/db";
import { AppError, ErrorTypes } from "../middlewares/error-handler";
import { createSummaryJob, createFeedbackJob, processFeedbackImmediate } from "./jobs/chat-jobs";

interface ListThreadsOptions {
  page: number;
  limit: number;
  projectId?: string;
  isActive?: boolean;
  tenantId: string;
}

interface ThreadDetailOptions {
  includeMessages?: boolean;
  includeSummary?: boolean;
}

class ChatService {
  /**
   * Create a new chat thread
   */
  async createThread(
    data: Partial<InsertChatThread>,
    tenantId: string,
    userId: string
  ): Promise<ChatThread> {
    const threadData: InsertChatThread = {
      tenantId,
      title: data.title || "New Chat",
      projectId: data.projectId || null,
      groundingMode: data.groundingMode || "none",
      isActive: true,
      metadata: data.metadata || null,
    };

    try {
      const [thread] = await db
        .insert(chatThreadsTable)
        .values(threadData)
        .returning();

      return thread;
    } catch (error) {
      throw ErrorTypes.InternalError("Failed to create thread", error);
    }
  }

  /**
   * List threads for a tenant with pagination and filtering
   */
  async listThreads(options: ListThreadsOptions): Promise<{
    threads: ChatThread[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit, projectId, isActive, tenantId } = options;
    const offset = (page - 1) * limit;

    try {
      // Build where conditions
      const conditions = [eq(chatThreadsTable.tenantId, tenantId)];
      
      if (projectId) {
        conditions.push(eq(chatThreadsTable.projectId, projectId));
      }
      
      if (isActive !== undefined) {
        conditions.push(eq(chatThreadsTable.isActive, isActive));
      }

      // Get total count
      const [{ total }] = await db
        .select({ total: count() })
        .from(chatThreadsTable)
        .where(and(...conditions));

      // Get threads
      const threads = await db
        .select()
        .from(chatThreadsTable)
        .where(and(...conditions))
        .orderBy(desc(chatThreadsTable.updatedAt))
        .limit(limit)
        .offset(offset);

      return {
        threads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw ErrorTypes.InternalError("Failed to list threads", error);
    }
  }

  /**
   * Get thread details with messages and summary
   */
  async getThreadDetail(
    threadId: string,
    tenantId: string,
    options: ThreadDetailOptions = {}
  ): Promise<{
    thread: ChatThread;
    messages?: Message[];
    summary?: Summary;
  }> {
    const { includeMessages = true, includeSummary = true } = options;

    try {
      // Get thread
      const [thread] = await db
        .select()
        .from(chatThreadsTable)
        .where(
          and(
            eq(chatThreadsTable.id, threadId),
            eq(chatThreadsTable.tenantId, tenantId)
          )
        );

      if (!thread) {
        throw ErrorTypes.NotFound("Thread");
      }

      const result: any = { thread };

      // Get messages if requested
      if (includeMessages) {
        const messages = await db
          .select()
          .from(messagesTable)
          .where(eq(messagesTable.threadId, threadId))
          .orderBy(asc(messagesTable.createdAt));

        result.messages = messages;
      }

      // Get summary if requested and thread has one
      if (includeSummary && thread.summaryId) {
        const [summary] = await db
          .select()
          .from(summariesTable)
          .where(eq(summariesTable.id, thread.summaryId));

        result.summary = summary;
      }

      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorTypes.InternalError("Failed to get thread detail", error);
    }
  }

  /**
   * Update thread metadata
   */
  async updateThread(
    threadId: string,
    data: Partial<InsertChatThread>,
    tenantId: string
  ): Promise<ChatThread> {
    try {
      const [thread] = await db
        .update(chatThreadsTable)
        .set({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(chatThreadsTable.id, threadId),
            eq(chatThreadsTable.tenantId, tenantId)
          )
        )
        .returning();

      if (!thread) {
        throw ErrorTypes.NotFound("Thread");
      }

      return thread;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorTypes.InternalError("Failed to update thread", error);
    }
  }

  /**
   * Soft-delete a thread (mark as inactive)
   */
  async deleteThread(threadId: string, tenantId: string): Promise<void> {
    try {
      const result = await db
        .update(chatThreadsTable)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(chatThreadsTable.id, threadId),
            eq(chatThreadsTable.tenantId, tenantId)
          )
        );

      if (result.rowCount === 0) {
        throw ErrorTypes.NotFound("Thread");
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorTypes.InternalError("Failed to delete thread", error);
    }
  }

  /**
   * Send a message to a thread
   */
  async sendMessage(
    threadId: string,
    data: Partial<InsertMessage>,
    tenantId: string,
    userId: string
  ): Promise<Message> {
    try {
      // Verify thread exists and belongs to tenant
      const [thread] = await db
        .select()
        .from(chatThreadsTable)
        .where(
          and(
            eq(chatThreadsTable.id, threadId),
            eq(chatThreadsTable.tenantId, tenantId)
          )
        );

      if (!thread) {
        throw ErrorTypes.NotFound("Thread");
      }

      const messageData: InsertMessage = {
        threadId,
        tenantId,
        role: "user",
        content: data.content || "",
        groundingMode: data.groundingMode || thread.groundingMode,
        metadata: data.metadata || null,
      };

      const [message] = await db
        .insert(messagesTable)
        .values(messageData)
        .returning();

      // Update thread message count and timestamp
      await db
        .update(chatThreadsTable)
        .set({
          messageCount: thread.messageCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(chatThreadsTable.id, threadId));

      return message;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorTypes.InternalError("Failed to send message", error);
    }
  }

  /**
   * Edit a message (creates a new version)
   */
  async editMessage(
    messageId: string,
    data: { content: string; editReason?: string },
    tenantId: string,
    userId: string
  ): Promise<Message> {
    try {
      // Get original message
      const [originalMessage] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.id, messageId));

      if (!originalMessage) {
        throw ErrorTypes.NotFound("Message");
      }

      // Verify tenant access
      const [thread] = await db
        .select()
        .from(chatThreadsTable)
        .where(eq(chatThreadsTable.id, originalMessage.threadId));

      if (!thread || thread.tenantId !== tenantId) {
        throw ErrorTypes.NotFound("Message");
      }

      // Only user messages can be edited
      if (originalMessage.role !== "user") {
        throw ErrorTypes.Forbidden("Only user messages can be edited");
      }

      // Create message version
      const latestVersion = await db
        .select({ versionNumber: messageVersionsTable.versionNumber })
        .from(messageVersionsTable)
        .where(eq(messageVersionsTable.messageId, messageId))
        .orderBy(desc(messageVersionsTable.versionNumber))
        .limit(1);

      const versionNumber = (latestVersion[0]?.versionNumber || 0) + 1;

      await db.transaction(async (tx) => {
        // Create version record
        await tx.insert(messageVersionsTable).values({
          messageId,
          tenantId,
          content: originalMessage.content,
          isCurrent: false,
          versionNumber,
          editReason: data.editReason,
          editedBy: userId,
        });

        // Update message
        await tx
          .update(messagesTable)
          .set({
            content: data.content,
            isEdited: true,
            editedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(messagesTable.id, messageId));
      });

      // Return updated message
      const [updatedMessage] = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.id, messageId));

      return updatedMessage!;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorTypes.InternalError("Failed to edit message", error);
    }
  }

  /**
   * Submit feedback on a message
   */
  async submitFeedback(
    messageId: string,
    data: Partial<InsertFeedback>,
    tenantId: string,
    userId: string
  ): Promise<Feedback> {
    try {
      // Verify message exists and tenant has access
      const [message] = await db
        .select({
          messageId: messagesTable.id,
          threadId: messagesTable.threadId,
          tenantId: chatThreadsTable.tenantId,
        })
        .from(messagesTable)
        .innerJoin(chatThreadsTable, eq(messagesTable.threadId, chatThreadsTable.id))
        .where(eq(messagesTable.id, messageId));

      if (!message || message.tenantId !== tenantId) {
        throw ErrorTypes.NotFound("Message");
      }

      const feedbackData: InsertFeedback = {
        messageId,
        tenantId,
        userId,
        rating: data.rating!,
        category: data.category!,
        comment: data.comment || null,
        context: data.context || null,
        isHelpful: data.isHelpful || null,
      };

      const [feedback] = await db
        .insert(feedbackTable)
        .values(feedbackData)
        .returning();

      // Process feedback immediately for analytics
      // In a real implementation, this could also be queued as a background job
      await processFeedbackImmediate(feedback.id, tenantId);

      return feedback;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorTypes.InternalError("Failed to submit feedback", error);
    }
  }

  /**
   * Generate or regenerate thread summary
   */
  async generateSummary(
    threadId: string,
    forceRegenerate: boolean,
    tenantId: string
  ): Promise<{ jobId: string; status: string; estimatedCompletion?: string }> {
    try {
      // Verify thread exists and belongs to tenant
      const [thread] = await db
        .select()
        .from(chatThreadsTable)
        .where(
          and(
            eq(chatThreadsTable.id, threadId),
            eq(chatThreadsTable.tenantId, tenantId)
          )
        );

      if (!thread) {
        throw ErrorTypes.NotFound("Thread");
      }

      // Create background job for summary generation
      return await createSummaryJob(threadId, forceRegenerate, tenantId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorTypes.InternalError("Failed to generate summary", error);
    }
  }

  /**
   * Update grounding mode for a thread
   */
  async updateGroundingMode(
    threadId: string,
    groundingMode: "none" | "web" | "knowledge_base" | "document",
    tenantId: string
  ): Promise<ChatThread> {
    try {
      const [thread] = await db
        .update(chatThreadsTable)
        .set({
          groundingMode,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(chatThreadsTable.id, threadId),
            eq(chatThreadsTable.tenantId, tenantId)
          )
        )
        .returning();

      if (!thread) {
        throw ErrorTypes.NotFound("Thread");
      }

      return thread;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw ErrorTypes.InternalError("Failed to update grounding mode", error);
    }
  }
}

export const chatService = new ChatService();
