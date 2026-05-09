/**
 * @file        artifacts/api-server/src/lib/email-service.ts
 * @module      Services / Email
 * @purpose     Email business logic and provider abstraction
 *
 * @ai_instructions
 *   - Implement email business logic with mock providers initially
 *   - Support multiple email providers (Gmail, Outlook, IMAP)
 *   - Handle OAuth token management and encryption
 *   - Provide pagination and search functionality
 *   - Include proper error handling and logging
 *
 * @exports     EmailService class with all email operations
 * @depends_on  Database schema, email providers
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { eq, and, desc, asc, ilike, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { 
  emailAccounts, 
  emailMessages, 
  emailFolders, 
  emailDrafts,
  type EmailAccount,
  type EmailMessage,
  type EmailDraft,
  type InsertEmailAccount,
  type InsertEmailMessage,
  type InsertEmailDraft
} from "@workspace/db";

// Mock email provider interfaces
interface EmailProvider {
  authenticate(token: string): Promise<boolean>;
  fetchMessages(accountId: string, options: MessageFetchOptions): Promise<EmailMessage[]>;
  sendMessage(accountId: string, message: SendMessageRequest): Promise<EmailMessage>;
  syncFolders(accountId: string): Promise<EmailFolder[]>;
}

interface MessageFetchOptions {
  folder?: string;
  page?: number;
  limit?: number;
  search?: string;
  unreadOnly?: boolean;
}

interface SendMessageRequest {
  toAddress: Array<{ email: string; name?: string }>;
  ccAddress?: Array<{ email: string; name?: string }>;
  bccAddress?: Array<{ email: string; name?: string }>;
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments?: Array<{ name: string; content: Buffer; contentType: string }>;
}

interface EmailFolder {
  id: string;
  name: string;
  type: string;
  unreadCount: number;
  totalCount: number;
}

// Mock provider implementations
class MockGmailProvider implements EmailProvider {
  async authenticate(token: string): Promise<boolean> {
    // Mock authentication - in production would validate with Google OAuth
    return token.length > 10;
  }

  async fetchMessages(accountId: string, options: MessageFetchOptions): Promise<EmailMessage[]> {
    // Mock data - in production would call Gmail API
    const mockMessages: EmailMessage[] = [
      {
        id: "msg-1",
        tenantId: "",
        accountId,
        folderId: null,
        messageIdHeader: "gmail-msg-1",
        threadId: "thread-1",
        fromAddress: "sender@example.com",
        fromName: "John Doe",
        toAddress: JSON.stringify([{ email: "user@example.com", name: "User" }]),
        ccAddress: null,
        bccAddress: null,
        subject: "Test Message",
        bodyPreview: "This is a test message...",
        bodyFull: "This is a test message with full content.",
        bodyHtml: "<p>This is a test message with full content.</p>",
        isRead: false,
        isStarred: false,
        hasAttachments: false,
        attachments: [],
        receivedAt: new Date(),
        sentAt: new Date(),
        providerMessageId: "gmail-provider-1",
        labels: [],
        priority: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Apply filters
    let filtered = mockMessages;
    
    if (options.search) {
      filtered = filtered.filter(msg => 
        (msg.subject?.toLowerCase().includes(options.search!.toLowerCase()) || false) ||
        msg.fromAddress.toLowerCase().includes(options.search!.toLowerCase())
      );
    }

    if (options.unreadOnly) {
      filtered = filtered.filter(msg => !msg.isRead);
    }

    // Apply pagination
    const page = options.page || 1;
    const limit = options.limit || 20;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return paginated;
  }

  async sendMessage(accountId: string, message: SendMessageRequest): Promise<EmailMessage> {
    // Mock sending - in production would use Gmail API
    const newMessage: EmailMessage = {
      id: "sent-" + Date.now(),
      tenantId: "",
      accountId,
      folderId: null,
      messageIdHeader: "sent-" + Date.now(),
      threadId: "thread-" + Date.now(),
      fromAddress: "user@example.com",
      fromName: "User",
      toAddress: JSON.stringify(message.toAddress),
      ccAddress: message.ccAddress ? JSON.stringify(message.ccAddress) : null,
      bccAddress: message.bccAddress ? JSON.stringify(message.bccAddress) : null,
      subject: message.subject,
      bodyPreview: message.body.substring(0, 255),
      bodyFull: message.body,
      bodyHtml: message.bodyHtml,
      isRead: true,
      isStarred: false,
      hasAttachments: (message.attachments?.length || 0) > 0,
      attachments: message.attachments?.map(att => ({
        name: att.name,
        size: att.content.length,
        contentType: att.contentType
      })) || [],
      receivedAt: new Date(),
      sentAt: new Date(),
      providerMessageId: "gmail-sent-" + Date.now(),
      labels: [],
      priority: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return newMessage;
  }

  async syncFolders(accountId: string): Promise<EmailFolder[]> {
    // Mock folder sync - in production would use Gmail API
    return [
      {
        id: "inbox",
        name: "Inbox",
        type: "inbox",
        unreadCount: 5,
        totalCount: 100
      },
      {
        id: "sent",
        name: "Sent",
        type: "sent",
        unreadCount: 0,
        totalCount: 50
      },
      {
        id: "drafts",
        name: "Drafts",
        type: "drafts",
        unreadCount: 0,
        totalCount: 3
      }
    ];
  }
}

class MockOutlookProvider implements EmailProvider {
  async authenticate(token: string): Promise<boolean> {
    // Mock authentication - in production would validate with Microsoft OAuth
    return token.length > 10;
  }

  async fetchMessages(accountId: string, options: MessageFetchOptions): Promise<EmailMessage[]> {
    // Similar mock implementation to Gmail
    return [];
  }

  async sendMessage(accountId: string, message: SendMessageRequest): Promise<EmailMessage> {
    // Mock implementation
    throw new Error("Outlook provider not fully implemented");
  }

  async syncFolders(accountId: string): Promise<EmailFolder[]> {
    // Mock implementation
    return [];
  }
}

export class EmailService {
  private providers: Map<string, EmailProvider>;

  constructor() {
    this.providers = new Map([
      ["gmail", new MockGmailProvider()],
      ["outlook", new MockOutlookProvider()],
      ["imap", new MockGmailProvider()], // Reuse Gmail mock for IMAP
      ["yahoo", new MockGmailProvider()], // Reuse Gmail mock for Yahoo
      ["apple", new MockGmailProvider()] // Reuse Gmail mock for Apple
    ]);
  }

  /**
   * List email accounts for a user
   */
  async listAccounts(userId: string, tenantId: string): Promise<EmailAccount[]> {
    const accounts = await db
      .select()
      .from(emailAccounts)
      .where(
        and(
          eq(emailAccounts.userId, userId),
          eq(emailAccounts.tenantId, tenantId),
          eq(emailAccounts.isActive, true)
        )
      );

    return accounts;
  }

  /**
   * Create a new email account
   */
  async createAccount(data: InsertEmailAccount & { userId: string; tenantId: string }): Promise<EmailAccount> {
    // Validate OAuth token with provider
    const provider = this.providers.get(data.provider);
    if (!provider) {
      throw new Error(`Unsupported email provider: ${data.provider}`);
    }

    const isValid = await provider.authenticate(data.oauthToken);
    if (!isValid) {
      throw new Error("Invalid OAuth token");
    }

    // Create account in database
    const [account] = await db
      .insert(emailAccounts)
      .values({
        ...data,
        syncStatus: "active",
        lastSyncedAt: new Date()
      })
      .returning();

    // Sync folders
    try {
      const folders = await provider.syncFolders(account.id);
      await this.syncFoldersToDatabase(account.id, folders);
    } catch (error) {
      console.error("Failed to sync folders:", error);
    }

    return account;
  }

  /**
   * List email messages for an account
   */
  async listMessages(
    accountId: string,
    userId: string,
    tenantId: string,
    options: {
      folder?: string;
      page?: number;
      limit?: number;
      search?: string;
      unreadOnly?: boolean;
    }
  ): Promise<{ messages: EmailMessage[]; pagination: any }> {
    // Verify account ownership
    const account = await this.verifyAccountOwnership(accountId, userId, tenantId);

    // Fetch messages from database first
    const dbMessages = await db
      .select()
      .from(emailMessages)
      .where(
        and(
          eq(emailMessages.accountId, accountId),
          eq(emailMessages.tenantId, tenantId)
        )
      )
      .orderBy(desc(emailMessages.receivedAt))
      .limit(options.limit || 20)
      .offset(((options.page || 1) - 1) * (options.limit || 20));

    // If no messages in database, try to fetch from provider
    if (dbMessages.length === 0) {
      const provider = this.providers.get(account.provider);
      if (!provider) {
        throw new Error(`Provider not found: ${account.provider}`);
      }

      const providerMessages = await provider.fetchMessages(accountId, options);
      
      // Store messages in database
      for (const message of providerMessages) {
        message.tenantId = tenantId;
        await db.insert(emailMessages).values(message).onConflictDoNothing();
      }

      const total = providerMessages.length;
      return {
        messages: providerMessages,
        pagination: {
          page: options.page || 1,
          limit: options.limit || 20,
          total
        }
      };
    }

    // Apply filters to database messages
    let filtered = dbMessages;
    
    if (options.search) {
      filtered = filtered.filter(msg => 
        msg.subject?.toLowerCase().includes(options.search!.toLowerCase()) ||
        msg.fromAddress.toLowerCase().includes(options.search!.toLowerCase())
      );
    }

    if (options.unreadOnly) {
      filtered = filtered.filter(msg => !msg.isRead);
    }

    const total = filtered.length;
    const page = options.page || 1;
    const limit = options.limit || 20;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      messages: paginated,
      pagination: {
        page,
        limit,
        total
      }
    };
  }

  /**
   * Send an email
   */
  async sendEmail(
    accountId: string,
    userId: string,
    tenantId: string,
    data: SendMessageRequest
  ): Promise<EmailMessage> {
    // Verify account ownership
    const account = await this.verifyAccountOwnership(accountId, userId, tenantId);

    const provider = this.providers.get(account.provider);
    if (!provider) {
      throw new Error(`Provider not found: ${account.provider}`);
    }

    const message = await provider.sendMessage(accountId, data);
    
    // Store sent message in database
    message.tenantId = tenantId;
    const [savedMessage] = await db
      .insert(emailMessages)
      .values(message)
      .returning();

    return savedMessage;
  }

  /**
   * List email drafts
   */
  async listDrafts(
    userId: string,
    tenantId: string,
    options: {
      accountId?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ drafts: EmailDraft[]; pagination: any }> {
    const query = db
      .select()
      .from(emailDrafts)
      .where(
        and(
          eq(emailDrafts.tenantId, tenantId)
        )
      )
      .orderBy(desc(emailDrafts.lastSavedAt));

    if (options.accountId) {
      query.where(eq(emailDrafts.accountId, options.accountId));
    }

    const drafts = await query
      .limit(options.limit || 20)
      .offset(((options.page || 1) - 1) * (options.limit || 20));

    return {
      drafts,
      pagination: {
        page: options.page || 1,
        limit: options.limit || 20,
        total: drafts.length
      }
    };
  }

  /**
   * Create an email draft
   */
  async createDraft(data: InsertEmailDraft & { userId: string; tenantId: string }): Promise<EmailDraft> {
    const [draft] = await db
      .insert(emailDrafts)
      .values({
        ...data,
        lastSavedAt: new Date(),
        autoSaveEnabled: true
      })
      .returning();

    return draft;
  }

  /**
   * Update an email draft
   */
  async updateDraft(
    draftId: string,
    userId: string,
    tenantId: string,
    updates: Partial<InsertEmailDraft>
  ): Promise<EmailDraft> {
    const [draft] = await db
      .update(emailDrafts)
      .set({
        ...updates,
        lastSavedAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(emailDrafts.id, draftId),
          eq(emailDrafts.tenantId, tenantId)
        )
      )
      .returning();

    if (!draft) {
      throw new Error("Draft not found");
    }

    return draft;
  }

  /**
   * Toggle star status of a message
   */
  async toggleStar(
    messageId: string,
    userId: string,
    tenantId: string,
    starred: boolean
  ): Promise<EmailMessage> {
    const [message] = await db
      .update(emailMessages)
      .set({ 
        isStarred: starred,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(emailMessages.id, messageId),
          eq(emailMessages.tenantId, tenantId)
        )
      )
      .returning();

    if (!message) {
      throw new Error("Message not found");
    }

    return message;
  }

  /**
   * Verify account ownership
   */
  private async verifyAccountOwnership(
    accountId: string,
    userId: string,
    tenantId: string
  ): Promise<EmailAccount> {
    const account = await db
      .select()
      .from(emailAccounts)
      .where(
        and(
          eq(emailAccounts.id, accountId),
          eq(emailAccounts.userId, userId),
          eq(emailAccounts.tenantId, tenantId),
          eq(emailAccounts.isActive, true)
        )
      )
      .limit(1);

    if (account.length === 0) {
      throw new Error("Account not found or access denied");
    }

    return account[0];
  }

  /**
   * Sync folders to database
   */
  private async syncFoldersToDatabase(accountId: string, folders: EmailFolder[]): Promise<void> {
    for (const folder of folders) {
      await db
        .insert(emailFolders)
        .values({
          accountId,
          name: folder.name,
          type: folder.type as any,
          unreadCount: folder.unreadCount,
          totalCount: folder.totalCount,
          isDefault: ["inbox", "sent", "drafts"].includes(folder.type)
        })
        .onConflictDoNothing();
    }
  }
}
