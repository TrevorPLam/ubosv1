/**
 * @file        lib/db/src/schema/assets.ts
 * @module      Database / Schema / Assets
 * @purpose     Asset management schema for tracking company equipment, inventory, and depreciation
 *
 * @ai_instructions
 *   - This file defines tables for assets, categories, depreciation, and maintenance.
 *   - Follow existing patterns from other schema files in this directory.
 *   - All tables include tenant_id for multi-tenant isolation and RLS policies.
 *   - Use appropriate enums for status, condition, and industry fields.
 *
 * @exports     assets, asset_categories, depreciation_schedules, maintenance_records tables
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
  boolean,
  decimal,
  integer
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tenantColumn, rlsPolicies, indexHelpers } from "./helpers";

// Enums for asset data
export const assetStatusEnum = pgEnum("asset_status", ["active", "low_stock", "expiring", "maintenance", "inactive", "critical"]);
export const assetConditionEnum = pgEnum("asset_condition", ["excellent", "good", "fair", "poor"]);
export const industryTypeEnum = pgEnum("industry_type", ["digital", "food", "product", "equipment", "real_estate", "fleet"]);

// Asset categories table - Categorization for organization
export const assetCategoriesTable = pgTable("asset_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  
  name: text("name").notNull(),
  description: text("description"),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes
  tenantIdx: index("idx_asset_categories_tenant").on(table.tenant_id),
  nameIdx: index("idx_asset_categories_name").on(table.tenant_id, table.name),
}));

// Assets table - Core asset information
export const assetsTable = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenant_id: tenantColumn,
  category_id: uuid("category_id").references(() => assetCategoriesTable.id, { onDelete: "set null" }),
  
  // Basic identification
  name: text("name").notNull(),
  sku: text("sku").unique(),
  serial_number: text("serial_number").unique(),
  
  // Classification
  industry: industryTypeEnum("industry").notNull(),
  
  // Quantity and measurements
  quantity: integer("quantity").default(1).notNull(),
  unit: text("unit").default("each").notNull(),
  
  // Financial information
  purchase_cost: decimal("purchase_cost", { precision: 12, scale: 2 }).notNull(),
  current_value: decimal("current_value", { precision: 12, scale: 2 }),
  depreciation_rate_pct: decimal("depreciation_rate_pct", { precision: 5, scale: 2 }),
  reorder_point: integer("reorder_point"),
  
  // Status and condition
  status: assetStatusEnum("status").default("active").notNull(),
  condition: assetConditionEnum("condition").default("good").notNull(),
  
  // Location and supplier
  location: text("location"),
  supplier: text("supplier"),
  
  // Additional information
  notes: text("notes"),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes for performance
  tenantIdx: index("idx_assets_tenant").on(table.tenant_id),
  statusIdx: index("idx_assets_status").on(table.tenant_id, table.status),
  industryIdx: index("idx_assets_industry").on(table.tenant_id, table.industry),
  categoryIdx: index("idx_assets_category").on(table.tenant_id, table.category_id),
  skuIdx: index("idx_assets_sku").on(table.tenant_id, table.sku),
  serialIdx: index("idx_assets_serial").on(table.tenant_id, table.serial_number),
  supplierIdx: index("idx_assets_supplier").on(table.tenant_id, table.supplier),
  locationIdx: index("idx_assets_location").on(table.tenant_id, table.location),
}));

// Depreciation schedules table - Track asset depreciation over time
export const depreciationSchedulesTable = pgTable("depreciation_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  asset_id: uuid("asset_id").notNull().references(() => assetsTable.id, { onDelete: "cascade" }),
  
  period: timestamp("period").notNull(), // The period this depreciation applies to
  depreciation_amount: decimal("depreciation_amount", { precision: 12, scale: 2 }).notNull(),
  accumulated_depreciation: decimal("accumulated_depreciation", { precision: 12, scale: 2 }).notNull(),
  book_value: decimal("book_value", { precision: 12, scale: 2 }).notNull(),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes
  assetIdx: index("idx_depreciation_asset").on(table.asset_id),
  periodIdx: index("idx_depreciation_period").on(table.asset_id, table.period),
}));

// Maintenance records table - Track maintenance and repair history
export const maintenanceRecordsTable = pgTable("maintenance_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  asset_id: uuid("asset_id").notNull().references(() => assetsTable.id, { onDelete: "cascade" }),
  
  description: text("description").notNull(),
  performed_by: text("performed_by").notNull(),
  performed_at: timestamp("performed_at").notNull(),
  next_due_at: timestamp("next_due_at"),
  cost: decimal("cost", { precision: 12, scale: 2 }),
  notes: text("notes"),
  
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes
  assetIdx: index("idx_maintenance_asset").on(table.asset_id),
  performedAtIdx: index("idx_maintenance_performed_at").on(table.asset_id, table.performed_at),
  nextDueIdx: index("idx_maintenance_next_due").on(table.next_due_at),
}));

// Zod schemas for validation
export const insertAssetCategorySchema = createInsertSchema(assetCategoriesTable).omit({
  id: true,
  tenant_id: true,
  created_at: true,
  updated_at: true,
});

export const insertAssetSchema = createInsertSchema(assetsTable).omit({
  id: true,
  tenant_id: true,
  created_at: true,
  updated_at: true,
});

export const insertDepreciationScheduleSchema = createInsertSchema(depreciationSchedulesTable).omit({
  id: true,
  created_at: true,
});

export const insertMaintenanceRecordSchema = createInsertSchema(maintenanceRecordsTable).omit({
  id: true,
  created_at: true,
});

// RLS policies for all asset tables
export const assetRlsPolicies = {
  asset_categories: [
    rlsPolicies.enableForceRls("asset_categories"),
    rlsPolicies.tenantIsolationPolicy("asset_categories"),
  ],
  assets: [
    rlsPolicies.enableForceRls("assets"),
    rlsPolicies.tenantIsolationPolicy("assets"),
  ],
  depreciation_schedules: [
    rlsPolicies.enableForceRls("depreciation_schedules"),
    rlsPolicies.tenantIsolationPolicy("depreciation_schedules"),
  ],
  maintenance_records: [
    rlsPolicies.enableForceRls("maintenance_records"),
    rlsPolicies.tenantIsolationPolicy("maintenance_records"),
  ],
};

// Type exports
export type AssetCategory = typeof assetCategoriesTable.$inferSelect;
export type NewAssetCategory = typeof assetCategoriesTable.$inferInsert;
export type Asset = typeof assetsTable.$inferSelect;
export type NewAsset = typeof assetsTable.$inferInsert;
export type DepreciationSchedule = typeof depreciationSchedulesTable.$inferSelect;
export type NewDepreciationSchedule = typeof depreciationSchedulesTable.$inferInsert;
export type MaintenanceRecord = typeof maintenanceRecordsTable.$inferSelect;
export type NewMaintenanceRecord = typeof maintenanceRecordsTable.$inferInsert;
