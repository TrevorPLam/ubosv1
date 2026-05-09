/**
 * @file        lib/db/src/schema/email.ts
 * @module      Database / Schema / Email
 * @purpose     Email accounts, messages, folders, and drafts schema
 *
 * @ai_instructions
 *   - Define email_accounts, email_messages, email_folders, and email_drafts tables
 *   - Use pgEnum for provider and folder types
 *   - Include tenant_id for multi-tenant isolation
 *   - Add proper indexes for performance
 *   - Use encrypted storage for OAuth tokens
 *
 * @exports     Email tables, insert schemas, and types
 * @depends_on  helpers.ts (tenant column, RLS helpers)
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { 
  pgTable, 
  text, 
  uuid, 
  timestamp, 
  boolean, 
  integer, 
  jsonb,
  pgEnum,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { 
  tenantColumn
} from "./helpers";

// Enums for email providers and folder types
export const emailProviderEnum = pgEnum("email_provider", [
  "gmail",
  "outlook", 
  "imap",
  "yahoo",
  "apple"
]);

export const emailFolderTypeEnum = pgEnum("email_folder_type", [
  "inbox",
  "sent", 
  "drafts",
  "archive",
  "trash",
  "custom"
]);

export const emailSyncStatusEnum = pgEnum("email_sync_status", [
  "active",
  "error",
  "syncing",
  "disabled"
]);

// Email accounts table - stores connected email provider accounts
export const emailAccounts = pgTable("email_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantColumn,
  userId: uuid("user_id").notNull(), // Reference to users table (via Clerk)
  provider: emailProviderEnum("provider").notNull(),
  emailAddress: text("email_address").notNull(),
  displayName: text("display_name").notNull(),
  oauthToken: text("oauth_token").notNull(), // Encrypted OAuth refresh token
  syncStatus: emailSyncStatusEnum("sync_status").default("active"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  errorMessage: text("error_message"), // Last sync error if any
  isActive: boolean("is_active").default(true),
  settings: jsonb("settings"), // Provider-specific settings
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  // Indexes for performance
  tenantUserIdx: index("idx_email_accounts_tenant_user").on(table.tenantId, table.userId),
  emailIdx: index("idx_email_accounts_email").on(table.emailAddress),
  providerIdx: index("idx_email_accounts_provider").on(table.provider)
  // RLS policies will be applied via migration
}));

// Email folders table - stores folder/label information per account
export const emailFolders = pgTable("email_folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantColumn,
  accountId: uuid("account_id").notNull().references(() => emailAccounts.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  type: emailFolderTypeEnum("type").notNull(),
  providerFolderId: text("provider_folder_id"), // ID from provider (Gmail label ID, etc.)
  unreadCount: integer("unread_count").default(0),
  totalCount: integer("total_count").default(0),
  isDefault: boolean("is_default").default(false), // For default folders like inbox, sent
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  // Indexes
  accountIdx: index("idx_email_folders_account").on(table.accountId),
  accountTypeIdx: index("idx_email_folders_account_type").on(table.accountId, table.type)
  // RLS policies will be applied via migration
}));

// Email messages table - stores email metadata and content
export const emailMessages = pgTable("email_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantColumn,
  accountId: uuid("account_id").notNull().references(() => emailAccounts.id, { onDelete: 'cascade' }),
  folderId: uuid("folder_id").references(() => emailFolders.id, { onDelete: 'set null' }),
  messageIdHeader: text("message_id_header").notNull(), // Unique ID from provider
  threadId: text("thread_id"), // For conversation threading
  fromAddress: text("from_address").notNull(),
  fromName: text("from_name"),
  toAddress: text("to_address").notNull(), // JSON array of recipients
  ccAddress: text("cc_address"), // JSON array of CC recipients
  bccAddress: text("bcc_address"), // JSON array of BCC recipients
  subject: text("subject"),
  bodyPreview: text("body_preview").notNull(), // First ~255 chars for list views
  bodyFull: text("body_full"), // Full message body (lazy loaded)
  bodyHtml: text("body_html"), // HTML version if available
  isRead: boolean("is_read").default(false),
  isStarred: boolean("is_starred").default(false),
  hasAttachments: boolean("has_attachments").default(false),
  attachments: jsonb("attachments"), // Array of attachment metadata
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  providerMessageId: text("provider_message_id"), // Original ID from provider
  labels: jsonb("labels"), // Array of label/category IDs
  priority: integer("priority").default(0), // For sorting/flagging importance
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  // Critical indexes for performance
  accountIdx: index("idx_email_messages_account").on(table.accountId),
  folderIdx: index("idx_email_messages_folder").on(table.folderId),
  accountFolderIdx: index("idx_email_messages_account_folder").on(table.accountId, table.folderId),
  accountReceivedIdx: index("idx_email_messages_account_received").on(table.accountId, table.receivedAt.desc()),
  messageIdIdx: index("idx_email_messages_message_id").on(table.messageIdHeader),
  threadIdx: index("idx_email_messages_thread").on(table.threadId),
  unreadIdx: index("idx_email_messages_unread").on(table.isRead),
  starredIdx: index("idx_email_messages_starred").on(table.isStarred),
  // Composite index for common queries
  accountFolderReadIdx: index("idx_email_messages_account_folder_read").on(table.accountId, table.folderId, table.isRead)
  // RLS policies will be applied via migration
}));

// Email drafts table - stores draft messages
export const emailDrafts = pgTable("email_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: tenantColumn,
  accountId: uuid("account_id").notNull().references(() => emailAccounts.id, { onDelete: 'cascade' }),
  toAddress: text("to_address"), // JSON array of recipients
  ccAddress: text("cc_address"), // JSON array of CC recipients
  bccAddress: text("bcc_address"), // JSON array of BCC recipients
  subject: text("subject"),
  body: text("body"),
  bodyHtml: text("body_html"),
  attachments: jsonb("attachments"), // Array of attachment metadata
  isReplyTo: uuid("is_reply_to").references(() => emailMessages.id), // If this is a reply
  isForwardOf: uuid("is_forward_of").references(() => emailMessages.id), // If this is a forward
  lastSavedAt: timestamp("last_saved_at", { withTimezone: true }).defaultNow(),
  autoSaveEnabled: boolean("auto_save_enabled").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  // Indexes
  accountIdx: index("idx_email_drafts_account").on(table.accountId),
  accountSavedIdx: index("idx_email_drafts_account_saved").on(table.accountId, table.lastSavedAt.desc())
  // RLS policies will be applied via migration
}));

// Type exports - using Drizzle type inference
export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = typeof emailAccounts.$inferInsert;

export type EmailFolder = typeof emailFolders.$inferSelect;
export type InsertEmailFolder = typeof emailFolders.$inferInsert;

export type EmailMessage = typeof emailMessages.$inferSelect;
export type InsertEmailMessage = typeof emailMessages.$inferInsert;

export type EmailDraft = typeof emailDrafts.$inferSelect;
export type InsertEmailDraft = typeof emailDrafts.$inferInsert;
