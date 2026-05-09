/**
 * @file        lib/db/src/schema/finance.ts
 * @module      Database / Schema / Finance
 * @purpose     Finance and accounting schema for double-entry bookkeeping
 *
 * @ai_instructions
 *   - Follow multi-tenant patterns using tenantColumn from helpers.ts
 *   - Apply RLS policies for tenant isolation
 *   - Use pgEnum for status fields with documented state transitions
 *   - Include proper indexes for performance with RLS
 *   - Implement double-entry accounting with balanced journal entries
 *   - Use numeric(15,2) for all financial amounts per 2026 best practices
 *   - Follow immutable ledger pattern - no deletion of posted entries
 *
 * @exports     accounts, transactions, invoices, bills, journal_entries, journal_entry_lines, budgets, goals tables
 * @imports     drizzle-orm/pg-core, drizzle-zod, zod, ./helpers
 *
 * @copyright   SPDX-FileCopyrightText: 2026 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { 
  pgTable, 
  text, 
  uuid, 
  timestamp, 
  pgEnum,
  index,
  decimal,
  boolean,
  unique
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenantColumn, rlsPolicies, indexHelpers } from "./helpers";

// Account types for Chart of Accounts
export const accountTypeEnum = pgEnum("account_type", [
  "asset",
  "liability", 
  "equity",
  "income",
  "expense"
]);

// Transaction source types
export const transactionSourceEnum = pgEnum("transaction_source", [
  "manual",
  "imported",
  "invoice",
  "bill",
  "journal"
]);

// Invoice status enum
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent", 
  "paid",
  "overdue",
  "cancelled"
]);

// Bill status enum
export const billStatusEnum = pgEnum("bill_status", [
  "draft",
  "pending-approval",
  "scheduled", 
  "paid",
  "overdue"
]);

// Journal entry status enum
export const journalEntryStatusEnum = pgEnum("journal_entry_status", [
  "draft",
  "posted"
]);

// Budget category enum
export const budgetCategoryEnum = pgEnum("budget_category", [
  "operations",
  "marketing",
  "sales",
  "rd",
  "admin",
  "capex",
  "other"
]);

// Chart of Accounts table
export const accountsTable = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Account identification
  code: text("code").notNull().unique(), // Account code (e.g., "1000", "4000")
  name: text("name").notNull(),
  type: accountTypeEnum("type").notNull(),
  subtype: text("subtype"), // Sub-type for more granular classification
  
  // Account status
  is_active: boolean("is_active").default(true).notNull(),
  
  // Metadata
  description: text("description"),
  parent_account_id: uuid("parent_account_id"),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for RLS and common queries
  tenantIdx: index("idx_accounts_tenant").on(table.tenant_id),
  codeIdx: index("idx_accounts_code").on(table.tenant_id, table.code),
  typeIdx: index("idx_accounts_type").on(table.tenant_id, table.type),
  activeIdx: index("idx_accounts_active").on(table.tenant_id, table.is_active),
  parentIdx: index("idx_accounts_parent").on(table.parent_account_id),
}));

// Transactions table - Individual financial transactions
export const transactionsTable = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Account reference
  account_id: uuid("account_id").notNull().references(() => accountsTable.id, { onDelete: "restrict" }),
  
  // Transaction details
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: text("category"),
  date: timestamp("date", { mode: "string" }).notNull(),
  
  // Transaction metadata
  is_reconciled: boolean("is_reconciled").default(false).notNull(),
  source: transactionSourceEnum("source").default("manual").notNull(),
  counterparty: text("counterparty"), // Who the transaction is with
  reference: text("reference"), // External reference number
  
  // Links to other financial records
  invoice_id: uuid("invoice_id"),
  bill_id: uuid("bill_id"),
  journal_entry_line_id: uuid("journal_entry_line_id"),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for RLS and common queries
  tenantIdx: index("idx_transactions_tenant").on(table.tenant_id),
  accountIdx: index("idx_transactions_account").on(table.tenant_id, table.account_id),
  dateIdx: index("idx_transactions_date").on(table.tenant_id, table.date),
  categoryIdx: index("idx_transactions_category").on(table.tenant_id, table.category),
  reconciledIdx: index("idx_transactions_reconciled").on(table.tenant_id, table.is_reconciled),
  sourceIdx: index("idx_transactions_source").on(table.tenant_id, table.source),
  invoiceIdx: index("idx_transactions_invoice").on(table.invoice_id),
  billIdx: index("idx_transactions_bill").on(table.bill_id),
}));

// Minimal vendors table for bill references (since full vendor schema isn't created yet)
export const vendorsTable = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Basic vendor info
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  
  // Vendor metadata
  tax_id: text("tax_id"),
  payment_terms: text("payment_terms"),
  notes: text("notes"),
  is_active: boolean("is_active").default(true).notNull(),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for RLS and common queries
  tenantIdx: index("idx_vendors_tenant").on(table.tenant_id),
  nameIdx: index("idx_vendors_name").on(table.tenant_id, table.name),
  activeIdx: index("idx_vendors_active").on(table.tenant_id, table.is_active),
}));

// Invoices table
export const invoicesTable = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Client reference
  client_id: uuid("client_id").notNull().references(() => accountsTable.id, { onDelete: "restrict" }),
  
  // Invoice details
  invoice_number: text("invoice_number").notNull().unique(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  status: invoiceStatusEnum("status").default("draft").notNull(),
  
  // Dates
  issued_at: timestamp("issued_at", { mode: "string" }).notNull(),
  due_at: timestamp("due_at", { mode: "string" }).notNull(),
  paid_at: timestamp("paid_at", { mode: "string" }),
  
  // Invoice metadata
  description: text("description"),
  terms: text("terms"),
  notes: text("notes"),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for RLS and common queries
  tenantIdx: index("idx_invoices_tenant").on(table.tenant_id),
  clientIdx: index("idx_invoices_client").on(table.tenant_id, table.client_id),
  numberIdx: index("idx_invoices_number").on(table.tenant_id, table.invoice_number),
  statusIdx: index("idx_invoices_status").on(table.tenant_id, table.status),
  dueIdx: index("idx_invoices_due").on(table.tenant_id, table.due_at),
}));

// Bills table
export const billsTable = pgTable("bills", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Vendor reference
  vendor_id: uuid("vendor_id").notNull().references(() => vendorsTable.id, { onDelete: "restrict" }),
  
  // Bill details
  bill_number: text("bill_number").notNull().unique(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  status: billStatusEnum("status").default("draft").notNull(),
  
  // Dates
  due_at: timestamp("due_at", { mode: "string" }).notNull(),
  
  // Bill metadata
  description: text("description"),
  category: text("category"),
  notes: text("notes"),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for RLS and common queries
  tenantIdx: index("idx_bills_tenant").on(table.tenant_id),
  vendorIdx: index("idx_bills_vendor").on(table.tenant_id, table.vendor_id),
  numberIdx: index("idx_bills_number").on(table.tenant_id, table.bill_number),
  statusIdx: index("idx_bills_status").on(table.tenant_id, table.status),
  dueIdx: index("idx_bills_due").on(table.tenant_id, table.due_at),
  categoryIdx: index("idx_bills_category").on(table.tenant_id, table.category),
}));

// Journal entries table - Header for double-entry transactions
export const journalEntriesTable = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Journal entry details
  description: text("description").notNull(),
  reference: text("reference"),
  status: journalEntryStatusEnum("status").default("draft").notNull(),
  date: timestamp("date", { mode: "string" }).notNull(),
  
  // Journal entry metadata
  created_by: text("created_by").notNull(),
  approved_by: text("approved_by"),
  posted_at: timestamp("posted_at", { mode: "string" }),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for RLS and common queries
  tenantIdx: index("idx_journal_entries_tenant").on(table.tenant_id),
  statusIdx: index("idx_journal_entries_status").on(table.tenant_id, table.status),
  dateIdx: index("idx_journal_entries_date").on(table.tenant_id, table.date),
  referenceIdx: index("idx_journal_entries_reference").on(table.tenant_id, table.reference),
}));

// Journal entry lines table - Line items for double-entry bookkeeping
export const journalEntryLinesTable = pgTable("journal_entry_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // References
  journal_entry_id: uuid("journal_entry_id").notNull().references(() => journalEntriesTable.id, { onDelete: "cascade" }),
  account_id: uuid("account_id").notNull().references(() => accountsTable.id, { onDelete: "restrict" }),
  
  // Double-entry amounts - exactly one of debit or credit must be non-zero
  debit: decimal("debit", { precision: 15, scale: 2 }).default("0.00").notNull(),
  credit: decimal("credit", { precision: 15, scale: 2 }).default("0.00").notNull(),
  
  // Line details
  description: text("description"),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for RLS and common queries
  journalEntryIdx: index("idx_journal_entry_lines_entry").on(table.journal_entry_id),
  accountIdx: index("idx_journal_entry_lines_account").on(table.account_id),
  debitIdx: index("idx_journal_entry_lines_debit").on(table.debit),
  creditIdx: index("idx_journal_entry_lines_credit").on(table.credit),
  
  // Unique constraint to prevent duplicate lines for same entry/account
  uniqueEntryAccount: unique("unique_journal_entry_line").on(table.journal_entry_id, table.account_id),
}));

// Budgets table
export const budgetsTable = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Budget details
  category: budgetCategoryEnum("category").notNull(),
  budgeted_amount: decimal("budgeted_amount", { precision: 15, scale: 2 }).notNull(),
  
  // Budget period
  period_start: timestamp("period_start", { mode: "string" }).notNull(),
  period_end: timestamp("period_end", { mode: "string" }).notNull(),
  
  // Budget metadata
  description: text("description"),
  notes: text("notes"),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for RLS and common queries
  tenantIdx: index("idx_budgets_tenant").on(table.tenant_id),
  categoryIdx: index("idx_budgets_category").on(table.tenant_id, table.category),
  periodIdx: index("idx_budgets_period").on(table.tenant_id, table.period_start, table.period_end),
}));

// Goals table
export const goalsTable = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  // Goal details
  name: text("name").notNull(),
  target_amount: decimal("target_amount", { precision: 15, scale: 2 }).notNull(),
  current_amount: decimal("current_amount", { precision: 15, scale: 2 }).default("0.00").notNull(),
  
  // Goal dates
  target_date: timestamp("target_date", { mode: "string" }),
  
  // Goal metadata
  description: text("description"),
  category: text("category"),
  is_active: boolean("is_active").default(true).notNull(),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for RLS and common queries
  tenantIdx: index("idx_goals_tenant").on(table.tenant_id),
  activeIdx: index("idx_goals_active").on(table.tenant_id, table.is_active),
  categoryIdx: index("idx_goals_category").on(table.tenant_id, table.category),
  targetDateIdx: index("idx_goals_target_date").on(table.tenant_id, table.target_date),
}));

// Types
export type Account = typeof accountsTable.$inferSelect;
export type InsertAccount = typeof accountsTable.$inferInsert;

export type Transaction = typeof transactionsTable.$inferSelect;
export type InsertTransaction = typeof transactionsTable.$inferInsert;

export type Vendor = typeof vendorsTable.$inferSelect;
export type InsertVendor = typeof vendorsTable.$inferInsert;

export type Invoice = typeof invoicesTable.$inferSelect;
export type InsertInvoice = typeof invoicesTable.$inferInsert;

export type Bill = typeof billsTable.$inferSelect;
export type InsertBill = typeof billsTable.$inferInsert;

export type JournalEntry = typeof journalEntriesTable.$inferSelect;
export type InsertJournalEntry = typeof journalEntriesTable.$inferInsert;

export type JournalEntryLine = typeof journalEntryLinesTable.$inferSelect;
export type InsertJournalEntryLine = typeof journalEntryLinesTable.$inferInsert;

export type Budget = typeof budgetsTable.$inferSelect;
export type InsertBudget = typeof budgetsTable.$inferInsert;

export type Goal = typeof goalsTable.$inferSelect;
export type InsertGoal = typeof goalsTable.$inferInsert;

// Zod schemas for validation
export const insertAccountSchema = createInsertSchema(accountsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertVendorSchema = createInsertSchema(vendorsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertBillSchema = createInsertSchema(billsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntriesTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertJournalEntryLineSchema = createInsertSchema(journalEntryLinesTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertBudgetSchema = createInsertSchema(budgetsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertGoalSchema = createInsertSchema(goalsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Additional validation schemas
export const journalEntryLineValidationSchema = z.object({
  description: z.string().optional(),
  account_id: z.string().uuid(),
  debit: z.string().optional(),
  credit: z.string().optional(),
});

export const journalEntryBalanceSchema = z.object({
  journal_entry_id: z.string().uuid(),
  lines: z.array(journalEntryLineValidationSchema).min(2), // At least 2 lines for double-entry
}).refine(
  (data) => {
    // Calculate total debits and credits
    const totalDebits = data.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const totalCredits = data.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    
    // Must balance to zero (debits must equal credits)
    return Math.abs(totalDebits - totalCredits) < 0.01; // Allow for rounding
  },
  {
    message: "Journal entry must balance - total debits must equal total credits",
  }
).refine(
  (data) => {
    // Each line must have either debit or credit, but not both
    return data.lines.every(line => {
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);
      return (debit > 0 && credit === 0) || (credit > 0 && debit === 0);
    });
  },
  {
    message: "Each journal entry line must have either a debit or credit amount, but not both",
  }
);

// RLS policies for all finance tables
export const financeRlsPolicies = {
  accounts: [
    rlsPolicies.enableForceRls("accounts"),
    rlsPolicies.tenantIsolationPolicy("accounts"),
  ],
  transactions: [
    rlsPolicies.enableForceRls("transactions"),
    rlsPolicies.tenantIsolationPolicy("transactions"),
  ],
  vendors: [
    rlsPolicies.enableForceRls("vendors"),
    rlsPolicies.tenantIsolationPolicy("vendors"),
  ],
  invoices: [
    rlsPolicies.enableForceRls("invoices"),
    rlsPolicies.tenantIsolationPolicy("invoices"),
  ],
  bills: [
    rlsPolicies.enableForceRls("bills"),
    rlsPolicies.tenantIsolationPolicy("bills"),
  ],
  journal_entries: [
    rlsPolicies.enableForceRls("journal_entries"),
    rlsPolicies.tenantIsolationPolicy("journal_entries"),
  ],
  journal_entry_lines: [
    rlsPolicies.enableForceRls("journal_entry_lines"),
    rlsPolicies.tenantIsolationPolicy("journal_entry_lines"),
  ],
  budgets: [
    rlsPolicies.enableForceRls("budgets"),
    rlsPolicies.tenantIsolationPolicy("budgets"),
  ],
  goals: [
    rlsPolicies.enableForceRls("goals"),
    rlsPolicies.tenantIsolationPolicy("goals"),
  ],
};
