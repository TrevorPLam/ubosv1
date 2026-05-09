/**
 * @file        lib/db/src/schema/documents.ts
 * @module      Database / Schema / Documents
 * @purpose     Document management schema for files, versions, storage, and entity linking
 *
 * @ai_instructions
 *   - Follow multi-tenant patterns using tenantColumn from helpers.ts
 *   - Apply RLS policies for tenant isolation
 *   - Use pgEnum for status, type, and access level fields with documented transitions
 *   - Include proper indexes for performance with RLS
 *   - Follow existing schema patterns from work.ts and other schema files
 *   - Implement soft deletes with deleted_at pattern
 *   - Add created_at and updated_at to every table
 *   - Use polymorphic entity linking pattern for entity_documents
 *
 * @exports     documents, document_versions, storage_references, entity_documents tables and types
 * @imports     drizzle-orm/pg-core, drizzle-zod, zod, ./helpers
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { 
  pgTable, 
  text, 
  uuid, 
  timestamp, 
  integer, 
  pgEnum,
  index,
  boolean,
  unique
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenantColumn } from "./helpers";

// Document type enum
export const documentTypeEnum = pgEnum("document_type", [
  "pdf",
  "spreadsheet", 
  "doc",
  "image",
  "code",
  "presentation",
  "video",
  "audio",
  "archive",
  "other"
]);

// Document status enum with documented state transitions
// Valid transitions: draft -> pending -> approved, draft -> requires_signature -> approved
// approved -> expired, any status -> draft (for re-editing)
export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "pending",
  "approved",
  "requires_signature",
  "expired"
]);

// Access level enum for document permissions
export const documentAccessLevelEnum = pgEnum("document_access_level", [
  "private",
  "team",
  "public"
]);

// Documents table - main document metadata
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  name: text("name").notNull(),
  type: documentTypeEnum("type").notNull(),
  status: documentStatusEnum("status").notNull().default("draft"),
  access_level: documentAccessLevelEnum("access_level").notNull().default("private"),
  owner_id: uuid("owner_id").notNull(), // Will reference users table when implemented
  folder: text("folder"), // Hierarchical folder path, e.g., "contracts/2024/Q1"
  starred: boolean("starred").notNull().default(false),
  description: text("description"), // Optional document description
  tags: text("tags").array(), // Array of tags for categorization
  metadata: text("metadata"), // JSON string for additional metadata
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  deleted_at: timestamp("deleted_at") // Soft delete
}, (table) => ({
  // Composite indexes for common query patterns
  tenantStatusIdx: index("idx_documents_tenant_status").on(table.tenant_id, table.status),
  tenantTypeIdx: index("idx_documents_tenant_type").on(table.tenant_id, table.type),
  tenantOwnerIdx: index("idx_documents_tenant_owner").on(table.tenant_id, table.owner_id),
  tenantAccessIdx: index("idx_documents_tenant_access").on(table.tenant_id, table.access_level),
  tenantFolderIdx: index("idx_documents_tenant_folder").on(table.tenant_id, table.folder),
  starredIdx: index("idx_documents_starred").on(table.starred),
  // Full-text search index (will be enhanced in later task with tsvector)
  nameSearchIdx: index("idx_documents_name_search").on(table.name)
}));

// Document versions table - immutable version history
export const documentVersions = pgTable("document_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  document_id: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  version_number: integer("version_number").notNull(),
  storage_reference_id: uuid("storage_reference_id").notNull().references(() => storageReferences.id, { onDelete: "restrict" }),
  created_by: uuid("created_by").notNull(), // Will reference users table when implemented
  change_description: text("change_description"), // Description of changes in this version
  checksum: text("checksum"), // File checksum for integrity verification
  created_at: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  // Index for fetching versions by document
  documentIdx: index("idx_document_versions_document").on(table.document_id),
  // Index for version ordering within document
  documentVersionIdx: index("idx_document_versions_document_version").on(table.document_id, table.version_number),
  // Unique constraint on document + version number
  uniqueDocumentVersion: unique("unique_document_version").on(table.document_id, table.version_number)
}));

// Storage references table - S3/R2 object location metadata
export const storageReferences = pgTable("storage_references", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  bucket: text("bucket").notNull(), // S3/R2 bucket name
  key: text("key").notNull(), // Object key within bucket
  original_filename: text("original_filename").notNull(),
  mime_type: text("mime_type").notNull(),
  size_bytes: integer("size_bytes").notNull(),
  checksum: text("checksum"), // SHA-256 or similar checksum
  upload_completed_at: timestamp("upload_completed_at"), // When upload was confirmed complete
  last_accessed_at: timestamp("last_accessed_at"), // For tracking usage
  expires_at: timestamp("expires_at"), // For temporary files
  created_at: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  // Index for bucket + key queries (common for S3 operations)
  bucketKeyIdx: index("idx_storage_references_bucket_key").on(table.bucket, table.key),
  // Tenant index for RLS
  tenantIdx: index("idx_storage_references_tenant").on(table.tenant_id),
  // Index for expiration cleanup
  expiresAtIdx: index("idx_storage_references_expires_at").on(table.expires_at),
  // Unique constraint on bucket + key (S3 objects are unique within bucket)
  uniqueBucketKey: unique("unique_storage_bucket_key").on(table.bucket, table.key)
}));

// Entity documents polymorphic table - links documents to any entity
export const entityDocuments = pgTable("entity_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  document_id: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  entity_type: text("entity_type").notNull(), // e.g., "client", "project", "task", "employee", "agreement"
  entity_id: uuid("entity_id").notNull(), // ID of the linked entity
  linked_by: uuid("linked_by").notNull(), // Who created this link
  link_type: text("link_type").notNull().default("attachment"), // e.g., "attachment", "reference", "supporting_doc"
  description: text("description"), // Optional description of the relationship
  linked_at: timestamp("linked_at").notNull().defaultNow()
}, (table) => ({
  // Index for finding documents linked to specific entities
  entityIdx: index("idx_entity_documents_entity").on(table.entity_type, table.entity_id),
  // Index for finding all entities linked to a document
  documentIdx: index("idx_entity_documents_document").on(table.document_id),
  // Index for finding links by who created them
  linkedByIdx: index("idx_entity_documents_linked_by").on(table.linked_by),
  // Unique constraint to prevent duplicate links
  uniqueEntityDocument: unique("unique_entity_document").on(table.document_id, table.entity_type, table.entity_id)
}));

// Insert schemas with validation
export const insertDocumentSchema = createInsertSchema(documents).omit({ 
  id: true, 
  created_at: true, 
  updated_at: true, 
  deleted_at: true 
});

export const insertDocumentVersionSchema = createInsertSchema(documentVersions).omit({ 
  id: true, 
  created_at: true 
});

export const insertStorageReferenceSchema = createInsertSchema(storageReferences).omit({ 
  id: true, 
  created_at: true 
});

export const insertEntityDocumentSchema = createInsertSchema(entityDocuments).omit({ 
  id: true, 
  linked_at: true 
});

// Type inference
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = typeof documentVersions.$inferInsert;
export type StorageReference = typeof storageReferences.$inferSelect;
export type InsertStorageReference = typeof storageReferences.$inferInsert;
export type EntityDocument = typeof entityDocuments.$inferSelect;
export type InsertEntityDocument = typeof entityDocuments.$inferInsert;
