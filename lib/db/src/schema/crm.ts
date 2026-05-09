/**
 * @file        lib/db/src/schema/crm.ts
 * @module      Database / Schema / CRM
 * @purpose     CRM contacts and opportunities schema for lead and deal management
 *
 * @ai_instructions
 *   - This file defines tables for CRM contacts and sales opportunities.
 *   - Contacts can be converted to clients (reference to clients table).
 *   - Opportunities represent sales deals with pipeline stages.
 *   - All tables include tenant_id for multi-tenant isolation.
 *   - Follow existing patterns from other schema files in this directory.
 *
 * @exports     contacts, opportunities tables with types and schemas
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

// Enums for CRM data
export const contactStatusEnum = pgEnum("contact_status", ["hot", "warm", "cold"]);
export const opportunityStageEnum = pgEnum("opportunity_stage", [
  "prospecting", 
  "qualification", 
  "proposal", 
  "negotiation", 
  "closed-won", 
  "closed-lost"
]);

// Contacts table - CRM contacts (leads that can be converted to clients)
export const contactsTable = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Basic contact information
  name: text("name").notNull(),
  email: text("email"),
  company: text("company"),
  phone: text("phone"),
  
  // Lead scoring and status
  lead_score: integer("lead_score").default(0),
  status: contactStatusEnum("status").default("cold").notNull(),
  tags: text("tags").array(), // Array of tags for categorization
  
  // Optional client relationship - can be converted to a client
  client_id: uuid("client_id").references(() => clientsTable.id, { onDelete: "set null" }),
  
  // Activity tracking
  last_activity_at: timestamp("last_activity_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes for performance
  tenantIdx: index("idx_contacts_tenant").on(table.tenant_id),
  nameIdx: index("idx_contacts_name").on(table.tenant_id, table.name),
  emailIdx: index("idx_contacts_email").on(table.tenant_id, table.email),
  statusIdx: index("idx_contacts_status").on(table.tenant_id, table.status),
  clientIdx: index("idx_contacts_client").on(table.client_id),
  companyIdx: index("idx_contacts_company").on(table.tenant_id, table.company),
  leadScoreIdx: index("idx_contacts_lead_score").on(table.tenant_id, table.lead_score),
}));

// Opportunities table - Sales deals and pipeline
export const opportunitiesTable = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Relationships
  client_id: uuid("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  contact_id: uuid("contact_id").references(() => contactsTable.id, { onDelete: "set null" }),
  
  // Deal information
  name: text("name").notNull(),
  value: decimal("value", { precision: 12, scale: 2 }),
  stage: opportunityStageEnum("stage").default("prospecting").notNull(),
  win_probability: integer("win_probability").default(0), // 0-100 percentage
  
  // Timeline
  expected_close_date: timestamp("expected_close_date"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes for performance
  tenantIdx: index("idx_opportunities_tenant").on(table.tenant_id),
  clientIdx: index("idx_opportunities_client").on(table.tenant_id, table.client_id),
  contactIdx: index("idx_opportunities_contact").on(table.tenant_id, table.contact_id),
  stageIdx: index("idx_opportunities_stage").on(table.tenant_id, table.stage),
  closeDateIdx: index("idx_opportunities_close_date").on(table.tenant_id, table.expected_close_date),
  valueIdx: index("idx_opportunities_value").on(table.tenant_id, table.value),
  probabilityIdx: index("idx_opportunities_probability").on(table.tenant_id, table.win_probability),
}));

// Types
export type Contact = typeof contactsTable.$inferSelect;
export type InsertContact = typeof contactsTable.$inferInsert;

export type Opportunity = typeof opportunitiesTable.$inferSelect;
export type InsertOpportunity = typeof opportunitiesTable.$inferInsert;

// Zod schemas for validation
export const insertContactSchema = createInsertSchema(contactsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertOpportunitySchema = createInsertSchema(opportunitiesTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// RLS policies for CRM tables
export const crmRlsPolicies = {
  contacts: [
    rlsPolicies.enableForceRls("contacts"),
    rlsPolicies.tenantIsolationPolicy("contacts"),
  ],
  opportunities: [
    rlsPolicies.enableForceRls("opportunities"),
    rlsPolicies.tenantIsolationPolicy("opportunities"),
  ],
};
