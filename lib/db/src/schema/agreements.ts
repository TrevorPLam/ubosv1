/**
 * @file        lib/db/src/schema/agreements.ts
 * @module      Database / Schema / Agreements
 * @purpose     Agreement management schema with versioning and e-signature tracking
 *
 * @ai_instructions
 *   - This file defines tables for agreements, their versions, and signature requests.
 *   - Agreement versions are immutable with version numbers.
 *   - Signature requests track external e-signature provider status.
 *   - All tables include tenant_id for multi-tenant isolation.
 *   - Follow existing patterns from other schema files in this directory.
 *
 * @exports     agreements, agreement_versions, signature_requests tables with types and schemas
 * @imports     drizzle-orm/pg-core, drizzle-zod, zod, ./helpers, ./clients
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { 
  pgTable, 
  text, 
  timestamp, 
  uuid, 
  pgEnum,
  index,
  integer,
  decimal
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenantColumn, rlsPolicies } from "./helpers";
import { clientsTable } from "./clients";

// Enums for agreement data
export const agreementStatusEnum = pgEnum("agreement_status", [
  "draft", 
  "sent", 
  "viewed", 
  "signed", 
  "expired"
]);
export const signatureStatusEnum = pgEnum("signature_status", [
  "pending", 
  "completed", 
  "declined"
]);

// Agreements table - Main agreement records
export const agreementsTable = pgTable("agreements", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Relationship
  client_id: uuid("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  
  // Agreement details
  title: text("title").notNull(),
  status: agreementStatusEnum("status").default("draft").notNull(),
  value: decimal("value", { precision: 12, scale: 2 }),
  
  // Engagement tracking
  sent_at: timestamp("sent_at"),
  opened_count: integer("opened_count").default(0),
  engagement_score: integer("engagement_score").default(0), // 0-100 score based on interactions
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes for performance
  tenantIdx: index("idx_agreements_tenant").on(table.tenant_id),
  clientIdx: index("idx_agreements_client").on(table.tenant_id, table.client_id),
  statusIdx: index("idx_agreements_status").on(table.tenant_id, table.status),
  sentAtIdx: index("idx_agreements_sent_at").on(table.tenant_id, table.sent_at),
  valueIdx: index("idx_agreements_value").on(table.tenant_id, table.value),
  engagementIdx: index("idx_agreements_engagement").on(table.tenant_id, table.engagement_score),
}));

// Agreement versions table - Immutable version history
export const agreementVersionsTable = pgTable("agreement_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Relationship
  agreement_id: uuid("agreement_id").notNull().references(() => agreementsTable.id, { onDelete: "cascade" }),
  
  // Version information
  version_number: integer("version_number").notNull(),
  content: text("content"), // Full text content or JSON structure
  storage_ref: text("storage_ref"), // Reference to external storage (S3, etc.)
  
  // Metadata
  created_by: text("created_by").notNull(), // User who created this version
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes for performance
  tenantIdx: index("idx_agreement_versions_tenant").on(table.tenant_id),
  agreementIdx: index("idx_agreement_versions_agreement").on(table.tenant_id, table.agreement_id),
  versionIdx: index("idx_agreement_versions_version").on(table.tenant_id, table.agreement_id, table.version_number),
  createdByIdx: index("idx_agreement_versions_created_by").on(table.tenant_id, table.created_by),
}));

// Signature requests table - E-signature tracking
export const signatureRequestsTable = pgTable("signature_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Relationship
  agreement_version_id: uuid("agreement_version_id").notNull().references(() => agreementVersionsTable.id, { onDelete: "cascade" }),
  
  // Signature details
  signer_email: text("signer_email").notNull(),
  status: signatureStatusEnum("status").default("pending").notNull(),
  
  // External provider integration
  external_envelope_id: text("external_envelope_id"), // ID from DocuSign, HelloSign, etc.
  
  // Timestamps
  requested_at: timestamp("requested_at").defaultNow().notNull(),
  signed_at: timestamp("signed_at"),
}, (table) => ({
  // Indexes for performance
  tenantIdx: index("idx_signature_requests_tenant").on(table.tenant_id),
  agreementVersionIdx: index("idx_signature_requests_agreement_version").on(table.tenant_id, table.agreement_version_id),
  signerEmailIdx: index("idx_signature_requests_signer_email").on(table.tenant_id, table.signer_email),
  statusIdx: index("idx_signature_requests_status").on(table.tenant_id, table.status),
  externalIdIdx: index("idx_signature_requests_external_id").on(table.tenant_id, table.external_envelope_id),
  requestedAtIdx: index("idx_signature_requests_requested_at").on(table.tenant_id, table.requested_at),
}));

// Types
export type Agreement = typeof agreementsTable.$inferSelect;
export type InsertAgreement = typeof agreementsTable.$inferInsert;

export type AgreementVersion = typeof agreementVersionsTable.$inferSelect;
export type InsertAgreementVersion = typeof agreementVersionsTable.$inferInsert;

export type SignatureRequest = typeof signatureRequestsTable.$inferSelect;
export type InsertSignatureRequest = typeof signatureRequestsTable.$inferInsert;

// Zod schemas for validation
export const insertAgreementSchema = createInsertSchema(agreementsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertAgreementVersionSchema = createInsertSchema(agreementVersionsTable).omit({
  id: true,
  created_at: true,
});

export const insertSignatureRequestSchema = createInsertSchema(signatureRequestsTable).omit({
  id: true,
  requested_at: true,
  signed_at: true,
});

// RLS policies for agreement tables
export const agreementRlsPolicies = {
  agreements: [
    rlsPolicies.enableForceRls("agreements"),
    rlsPolicies.tenantIsolationPolicy("agreements"),
  ],
  agreement_versions: [
    rlsPolicies.enableForceRls("agreement_versions"),
    rlsPolicies.tenantIsolationPolicy("agreement_versions"),
  ],
  signature_requests: [
    rlsPolicies.enableForceRls("signature_requests"),
    rlsPolicies.tenantIsolationPolicy("signature_requests"),
  ],
};
