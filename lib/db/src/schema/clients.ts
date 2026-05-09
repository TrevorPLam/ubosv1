/**
 * @file        lib/db/src/schema/clients.ts
 * @module      Database / Schema / Clients
 * @purpose     Client and contact details schema for CRM functionality
 *
 * @ai_instructions
 *   - This file defines tables for clients and their contact information.
 *   - Contact details are normalized into separate tables for better data integrity.
 *   - All tables include tenant_id for multi-tenant isolation.
 *   - Follow existing patterns from other schema files in this directory.
 *
 * @exports     clients, client_emails, client_phones, client_websites, client_social_profiles, client_addresses tables
 * @imports     drizzle-orm/pg-core, drizzle-zod, zod, ./helpers
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
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenantColumn, rlsPolicies, indexHelpers } from "./helpers";

// Enums for client data
export const clientStatusEnum = pgEnum("client_status", ["active", "inactive", "at-risk", "new"]);
export const genderEnum = pgEnum("gender", ["male", "female", "non-binary", "prefer-not-to-say"]);
export const salutationEnum = pgEnum("salutation", ["mr", "mrs", "ms", "dr", "prof", "mx", "none"]);
export const emailTypeEnum = pgEnum("email_type", ["personal", "work", "other"]);
export const phoneTypeEnum = pgEnum("phone_type", ["mobile", "home", "work", "other"]);
export const addressTypeEnum = pgEnum("address_type", ["home", "work", "mailing", "business"]);

// Clients table - Core client information
export const clientsTable = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Name fields
  salutation: salutationEnum("salutation"),
  first_name: text("first_name").notNull(),
  middle_name: text("middle_name"),
  last_name: text("last_name").notNull(),
  suffix: text("suffix"),
  preferred_name: text("preferred_name"),
  
  // Personal details
  date_of_birth: timestamp("date_of_birth"),
  gender: genderEnum("gender"),
  preferred_language: text("preferred_language").default("en"),
  
  // Professional details
  company: text("company"),
  job_title: text("job_title"),
  
  // Status and metadata
  status: clientStatusEnum("status").default("new").notNull(),
  source: text("source"),
  crm_contact_id: uuid("crm_contact_id"), // Reference to CRM contact if converted
  client_owner: text("client_owner"),
  notes: text("notes"),
  last_activity_at: timestamp("last_activity_at"),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes for performance
  tenantIdx: index("idx_clients_tenant").on(table.tenant_id),
  nameIdx: index("idx_clients_name").on(table.tenant_id, table.first_name, table.last_name),
  statusIdx: index("idx_clients_status").on(table.tenant_id, table.status),
  crmContactIdx: index("idx_clients_crm_contact").on(table.crm_contact_id),
  companyIdx: index("idx_clients_company").on(table.tenant_id, table.company),
}));

// Client emails table - Normalized email storage
export const clientEmailsTable = pgTable("client_emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  client_id: uuid("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  
  email: text("email").notNull(),
  type: emailTypeEnum("type").default("personal").notNull(),
  is_primary: boolean("is_primary").default(false).notNull(),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes
  tenantIdx: index("idx_client_emails_tenant").on(table.tenant_id),
  clientIdx: index("idx_client_emails_client").on(table.tenant_id, table.client_id),
  emailIdx: index("idx_client_emails_email").on(table.tenant_id, table.email),
  primaryIdx: index("idx_client_emails_primary").on(table.tenant_id, table.client_id, table.is_primary),
}));

// Client phones table - Normalized phone storage
export const clientPhonesTable = pgTable("client_phones", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  client_id: uuid("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  
  phone: text("phone").notNull(),
  type: phoneTypeEnum("type").default("mobile").notNull(),
  is_primary: boolean("is_primary").default(false).notNull(),
  country_code: text("country_code").default("+1"),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes
  tenantIdx: index("idx_client_phones_tenant").on(table.tenant_id),
  clientIdx: index("idx_client_phones_client").on(table.tenant_id, table.client_id),
  phoneIdx: index("idx_client_phones_phone").on(table.tenant_id, table.phone),
  primaryIdx: index("idx_client_phones_primary").on(table.tenant_id, table.client_id, table.is_primary),
}));

// Client websites table
export const clientWebsitesTable = pgTable("client_websites", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  client_id: uuid("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  
  url: text("url").notNull(),
  title: text("title"),
  is_primary: boolean("is_primary").default(false).notNull(),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes
  tenantIdx: index("idx_client_websites_tenant").on(table.tenant_id),
  clientIdx: index("idx_client_websites_client").on(table.tenant_id, table.client_id),
  primaryIdx: index("idx_client_websites_primary").on(table.tenant_id, table.client_id, table.is_primary),
}));

// Client social profiles table
export const clientSocialProfilesTable = pgTable("client_social_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  client_id: uuid("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  
  platform: text("platform").notNull(), // e.g., "linkedin", "twitter", "facebook"
  profile_url: text("profile_url").notNull(),
  username: text("username"),
  is_primary: boolean("is_primary").default(false).notNull(),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes
  tenantIdx: index("idx_client_social_tenant").on(table.tenant_id),
  clientIdx: index("idx_client_social_client").on(table.tenant_id, table.client_id),
  platformIdx: index("idx_client_social_platform").on(table.tenant_id, table.platform),
  primaryIdx: index("idx_client_social_primary").on(table.tenant_id, table.client_id, table.is_primary),
}));

// Client addresses table
export const clientAddressesTable = pgTable("client_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  client_id: uuid("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  
  type: addressTypeEnum("type").default("home").notNull(),
  street_line_1: text("street_line_1").notNull(),
  street_line_2: text("street_line_2"),
  city: text("city").notNull(),
  state_province: text("state_province"),
  postal_code: text("postal_code").notNull(),
  country: text("country").notNull(),
  is_primary: boolean("is_primary").default(false).notNull(),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes
  tenantIdx: index("idx_client_addresses_tenant").on(table.tenant_id),
  clientIdx: index("idx_client_addresses_client").on(table.tenant_id, table.client_id),
  typeIdx: index("idx_client_addresses_type").on(table.tenant_id, table.client_id, table.type),
  primaryIdx: index("idx_client_addresses_primary").on(table.tenant_id, table.client_id, table.is_primary),
}));

// Types
export type Client = typeof clientsTable.$inferSelect;
export type InsertClient = typeof clientsTable.$inferInsert;

export type ClientEmail = typeof clientEmailsTable.$inferSelect;
export type InsertClientEmail = typeof clientEmailsTable.$inferInsert;

export type ClientPhone = typeof clientPhonesTable.$inferSelect;
export type InsertClientPhone = typeof clientPhonesTable.$inferInsert;

export type ClientWebsite = typeof clientWebsitesTable.$inferSelect;
export type InsertClientWebsite = typeof clientWebsitesTable.$inferInsert;

export type ClientSocialProfile = typeof clientSocialProfilesTable.$inferSelect;
export type InsertClientSocialProfile = typeof clientSocialProfilesTable.$inferInsert;

export type ClientAddress = typeof clientAddressesTable.$inferSelect;
export type InsertClientAddress = typeof clientAddressesTable.$inferInsert;

// Zod schemas for validation
export const insertClientSchema = createInsertSchema(clientsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertClientEmailSchema = createInsertSchema(clientEmailsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertClientPhoneSchema = createInsertSchema(clientPhonesTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertClientWebsiteSchema = createInsertSchema(clientWebsitesTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertClientSocialProfileSchema = createInsertSchema(clientSocialProfilesTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertClientAddressSchema = createInsertSchema(clientAddressesTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// RLS policies for all client tables
export const clientRlsPolicies = {
  clients: [
    rlsPolicies.enableForceRls("clients"),
    rlsPolicies.tenantIsolationPolicy("clients"),
  ],
  client_emails: [
    rlsPolicies.enableForceRls("client_emails"),
    rlsPolicies.tenantIsolationPolicy("client_emails"),
  ],
  client_phones: [
    rlsPolicies.enableForceRls("client_phones"),
    rlsPolicies.tenantIsolationPolicy("client_phones"),
  ],
  client_websites: [
    rlsPolicies.enableForceRls("client_websites"),
    rlsPolicies.tenantIsolationPolicy("client_websites"),
  ],
  client_social_profiles: [
    rlsPolicies.enableForceRls("client_social_profiles"),
    rlsPolicies.tenantIsolationPolicy("client_social_profiles"),
  ],
  client_addresses: [
    rlsPolicies.enableForceRls("client_addresses"),
    rlsPolicies.tenantIsolationPolicy("client_addresses"),
  ],
};
