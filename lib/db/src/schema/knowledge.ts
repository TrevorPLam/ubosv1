/**
 * @file        lib/db/src/schema/knowledge.ts
 * @module      Database / Schema / Knowledge
 * @purpose     Knowledge management schema for SOPs, wikis, training, and certifications
 *
 * @ai_instructions
 *   - Follow multi-tenant patterns using tenantColumn from helpers.ts
 *   - Apply RLS policies for tenant isolation
 *   - Use pgEnum for status and category fields with documented transitions
 *   - Include proper indexes for performance with RLS
 *   - Follow existing schema patterns from work.ts and other schema files
 *   - Implement soft deletes with deleted_at pattern
 *   - Add created_at and updated_at to every table
 *   - Use immutable version history pattern for knowledge entries
 *
 * @exports     knowledge_entries, knowledge_versions, certification_records tables and types
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

// Knowledge entry category enum
export const knowledgeCategoryEnum = pgEnum("knowledge_category", [
  "sop",          // Standard Operating Procedures
  "wiki",         // Documentation and guides
  "training",     // Training materials
  "certification", // Certification requirements
  "policy",       // Company policies
  "process",      // Process documentation
  "template",     // Templates and forms
  "faq",          // Frequently asked questions
  "best_practice", // Best practices
  "other"
]);

// Knowledge entry status enum with documented state transitions
// Valid transitions: draft -> needs-review -> published -> current
// current -> needs-review (for updates), any status -> draft (for major rewrites)
export const knowledgeStatusEnum = pgEnum("knowledge_status", [
  "draft",
  "needs-review",
  "published",
  "current"
]);

// Certification status enum
export const certificationStatusEnum = pgEnum("certification_status", [
  "compliant",
  "at-risk",
  "overdue",
  "expired",
  "pending"
]);

// Knowledge entries table - main knowledge content
export const knowledgeEntries = pgTable("knowledge_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  title: text("title").notNull(),
  content: text("content").notNull(), // Rich text content (Markdown, HTML, etc.)
  category: knowledgeCategoryEnum("category").notNull(),
  status: knowledgeStatusEnum("status").notNull().default("draft"),
  role: text("role"), // Target role/position this applies to
  department: text("department"), // Department this applies to
  tags: text("tags").array(), // Array of tags for categorization and search
  author_id: uuid("author_id").notNull(), // Will reference users table when implemented
  reviewer_id: uuid("reviewer_id"), // Optional reviewer for quality control
  review_due_at: timestamp("review_due_at"), // When review is due
  last_reviewed_at: timestamp("last_reviewed_at"), // When it was last reviewed
  effective_date: timestamp("effective_date"), // When this becomes effective
  expiry_date: timestamp("expiry_date"), // When this expires (for time-sensitive content)
  version_number: integer("version_number").notNull().default(1), // Current version number
  parent_entry_id: uuid("parent_entry_id"), // For hierarchical knowledge organization
  is_template: boolean("is_template").notNull().default(false), // Whether this is a template
  view_count: integer("view_count").notNull().default(0), // Usage tracking
  last_accessed_at: timestamp("last_accessed_at"), // For analytics
  search_vector: text("search_vector"), // Will be populated with tsvector for full-text search
  metadata: text("metadata"), // JSON string for additional metadata
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  deleted_at: timestamp("deleted_at") // Soft delete
}, (table) => ({
  // Composite indexes for common query patterns
  tenantStatusIdx: index("idx_knowledge_entries_tenant_status").on(table.tenant_id, table.status),
  tenantCategoryIdx: index("idx_knowledge_entries_tenant_category").on(table.tenant_id, table.category),
  tenantAuthorIdx: index("idx_knowledge_entries_tenant_author").on(table.tenant_id, table.author_id),
  tenantDepartmentIdx: index("idx_knowledge_entries_tenant_department").on(table.tenant_id, table.department),
  tenantRoleIdx: index("idx_knowledge_entries_tenant_role").on(table.tenant_id, table.role),
  // Index for hierarchical relationships
  parentIdx: index("idx_knowledge_entries_parent").on(table.parent_entry_id),
  // Index for expiration tracking
  expiryDateIdx: index("idx_knowledge_entries_expiry_date").on(table.expiry_date),
  reviewDueIdx: index("idx_knowledge_entries_review_due").on(table.review_due_at),
  // Full-text search index (will be enhanced in later task with tsvector)
  titleSearchIdx: index("idx_knowledge_entries_title_search").on(table.title),
  contentSearchIdx: index("idx_knowledge_entries_content_search").on(table.content)
}));

// Knowledge versions table - immutable version history
export const knowledgeVersions = pgTable("knowledge_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  knowledge_entry_id: uuid("knowledge_entry_id").notNull().references(() => knowledgeEntries.id, { onDelete: "cascade" }),
  version_number: integer("version_number").notNull(),
  content: text("content").notNull(), // Complete content snapshot for this version
  edited_by: uuid("edited_by").notNull(), // Will reference users table when implemented
  change_summary: text("change_summary"), // Summary of changes in this version
  review_status: text("review_status").notNull().default("pending"), // pending, approved, rejected
  reviewed_by: uuid("reviewed_by"), // Who reviewed this version
  review_notes: text("review_notes"), // Reviewer's notes
  created_at: timestamp("created_at").notNull().defaultNow()
}, (table) => ({
  // Index for fetching versions by knowledge entry
  entryIdx: index("idx_knowledge_versions_entry").on(table.knowledge_entry_id),
  // Index for version ordering within entry
  entryVersionIdx: index("idx_knowledge_versions_entry_version").on(table.knowledge_entry_id, table.version_number),
  // Index for finding versions by editor
  editedByIdx: index("idx_knowledge_versions_edited_by").on(table.edited_by),
  // Unique constraint on entry + version number
  uniqueEntryVersion: unique("unique_knowledge_entry_version").on(table.knowledge_entry_id, table.version_number)
}));

// Certification records table - employee certification tracking
export const certificationRecords = pgTable("certification_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  employee_id: uuid("employee_id").notNull(), // Will reference users table when implemented
  certification_name: text("certification_name").notNull(),
  issuing_body: text("issuing_body").notNull(), // Organization that issued the certification
  credential_id: text("credential_id"), // Unique identifier from issuing body
  certification_level: text("certification_level"), // e.g., "Foundation", "Practitioner", "Expert"
  issued_at: timestamp("issued_at").notNull(),
  expires_at: timestamp("expires_at"), // When certification expires (null for lifetime certifications)
  status: certificationStatusEnum("status").notNull().default("pending"),
  verification_url: text("verification_url"), // URL to verify certification
  verification_code: text("verification_code"), // Code for verification
  certificate_file_id: uuid("certificate_file_id"), // Link to certificate document in documents table
  training_completed_at: timestamp("training_completed_at"), // When training was completed
  next_renewal_due: timestamp("next_renewal_due"), // When renewal is due
  renewal_reminder_sent: boolean("renewal_reminder_sent").notNull().default(false),
  notes: text("notes"), // Additional notes about the certification
  cost: integer("cost"), // Cost in cents (for budget tracking)
  currency: text("currency").notNull().default("USD"), // Currency code for cost
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
}, (table) => ({
  // Composite indexes for common query patterns
  tenantEmployeeIdx: index("idx_certification_records_tenant_employee").on(table.tenant_id, table.employee_id),
  tenantStatusIdx: index("idx_certification_records_tenant_status").on(table.tenant_id, table.status),
  // Index for expiration tracking
  expiresAtIdx: index("idx_certification_records_expires_at").on(table.expires_at),
  renewalDueIdx: index("idx_certification_records_next_renewal_due").on(table.next_renewal_due),
  // Index for certification name searches
  nameIdx: index("idx_certification_records_name").on(table.certification_name),
  issuingBodyIdx: index("idx_certification_records_issuing_body").on(table.issuing_body),
  // Unique constraint to prevent duplicate certifications for same employee
  uniqueEmployeeCertification: unique("unique_employee_certification").on(table.employee_id, table.certification_name, table.issuing_body)
}));

// Insert schemas with validation
export const insertKnowledgeEntrySchema = createInsertSchema(knowledgeEntries).omit({ 
  id: true, 
  created_at: true, 
  updated_at: true, 
  deleted_at: true,
  version_number: true // Version number is managed automatically
});

export const insertKnowledgeVersionSchema = createInsertSchema(knowledgeVersions).omit({ 
  id: true, 
  created_at: true 
});

export const insertCertificationRecordSchema = createInsertSchema(certificationRecords).omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

// Type inference
export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;
export type InsertKnowledgeEntry = typeof knowledgeEntries.$inferInsert;
export type KnowledgeVersion = typeof knowledgeVersions.$inferSelect;
export type InsertKnowledgeVersion = typeof knowledgeVersions.$inferInsert;
export type CertificationRecord = typeof certificationRecords.$inferSelect;
export type InsertCertificationRecord = typeof certificationRecords.$inferInsert;
