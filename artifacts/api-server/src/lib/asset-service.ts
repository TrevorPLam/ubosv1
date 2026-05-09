/**
 * @file        artifacts/api-server/src/lib/asset-service.ts
 * @module      API Server / Services / Asset Service
 * @purpose     Business logic for asset management operations
 *
 * @ai_instructions
 *   - Implement CRUD operations for assets with proper tenant isolation
 *   - Handle asset categories, depreciation schedules, and maintenance records
 *   - Support pagination, filtering, and search functionality
 *   - Include server-side depreciation calculation
 *   - Follow repository pattern with database abstraction
 *   - Include proper error handling and validation
 *
 * @exports     Asset service with all business methods
 * @imports     Database, schemas, utilities
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { db } from '@workspace/db';
import { 
  assetsTable, 
  assetCategoriesTable, 
  depreciationSchedulesTable, 
  maintenanceRecordsTable,
  Asset,
  NewAsset,
  AssetCategory,
  NewAssetCategory,
  DepreciationSchedule,
  NewDepreciationSchedule,
  MaintenanceRecord,
  NewMaintenanceRecord
} from '@workspace/db/schema';
import { eq, and, ilike, desc, asc, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface AssetListOptions {
  page: number;
  limit: number;
  industry?: string;
  status?: string;
  categoryId?: string;
  search?: string;
  tenantId: string;
}

export interface CreateAssetOptions extends Omit<NewAsset, 'id' | 'createdAt' | 'updatedAt'> {
  tenantId: string;
}

export interface UpdateAssetOptions extends Partial<Omit<NewAsset, 'id' | 'createdAt' | 'updatedAt'>> {
  id: string;
  tenantId: string;
}

export interface CreateMaintenanceOptions extends Omit<NewMaintenanceRecord, 'id' | 'createdAt'> {
  assetId: string;
}

export interface CreateAssetCategoryOptions extends Omit<NewAssetCategory, 'id' | 'createdAt' | 'updatedAt'> {
  tenantId: string;
}

export class AssetService {
  /**
   * Get paginated list of assets with optional filtering
   */
  async listAssets(options: AssetListOptions) {
    const { page, limit, industry, status, categoryId, search, tenantId } = options;
    const offset = (page - 1) * limit;

    let whereConditions = [eq(assetsTable.tenant_id, tenantId)];
    
    if (industry) {
      whereConditions.push(eq(assetsTable.industry, industry as any));
    }
    
    if (status) {
      whereConditions.push(eq(assetsTable.status, status as any));
    }
    
    if (categoryId) {
      whereConditions.push(eq(assetsTable.category_id, categoryId));
    }
    
    if (search) {
      whereConditions.push(
        or(
          ilike(assetsTable.name, `%${search}%`),
          ilike(assetsTable.sku, `%${search}%`),
          ilike(assetsTable.serial_number, `%${search}%`),
          ilike(assetsTable.supplier, `%${search}%`)
        )
      );
    }

    const [assets, totalCount] = await Promise.all([
      db
        .select({
          id: assetsTable.id,
          categoryId: assetsTable.category_id,
          name: assetsTable.name,
          sku: assetsTable.sku,
          serialNumber: assetsTable.serial_number,
          industry: assetsTable.industry,
          quantity: assetsTable.quantity,
          unit: assetsTable.unit,
          purchaseCost: assetsTable.purchase_cost,
          currentValue: assetsTable.current_value,
          depreciationRatePct: assetsTable.depreciation_rate_pct,
          reorderPoint: assetsTable.reorder_point,
          status: assetsTable.status,
          condition: assetsTable.condition,
          location: assetsTable.location,
          supplier: assetsTable.supplier,
          notes: assetsTable.notes,
          createdAt: assetsTable.created_at,
          updatedAt: assetsTable.updated_at,
        })
        .from(assetsTable)
        .where(and(...whereConditions))
        .orderBy(desc(assetsTable.updated_at))
        .limit(limit)
        .offset(offset),
      
      db
        .select({ count: assetsTable.id })
        .from(assetsTable)
        .where(and(...whereConditions))
        .then(result => result.length)
    ]);

    return {
      data: assets,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Get asset details including depreciation and maintenance records
   */
  async getAssetById(id: string, tenantId: string) {
    const [asset, depreciation, maintenance] = await Promise.all([
      db
        .select()
        .from(assetsTable)
        .where(and(eq(assetsTable.id, id), eq(assetsTable.tenant_id, tenantId)))
        .limit(1)
        .then(results => results[0]),

      db
        .select()
        .from(depreciationSchedulesTable)
        .where(eq(depreciationSchedulesTable.asset_id, id))
        .orderBy(desc(depreciationSchedulesTable.period)),

      db
        .select()
        .from(maintenanceRecordsTable)
        .where(eq(maintenanceRecordsTable.asset_id, id))
        .orderBy(desc(maintenanceRecordsTable.performed_at))
        .limit(10),
    ]);

    if (!asset) {
      return null;
    }

    return {
      asset,
      depreciation,
      maintenance,
    };
  }

  /**
   * Create a new asset
   */
  async createAsset(options: CreateAssetOptions) {
    const { tenantId, ...assetData } = options;
    
    const asset = {
      id: randomUUID(),
      tenant_id: tenantId,
      category_id: assetData.category_id,
      name: assetData.name,
      sku: assetData.sku,
      serial_number: assetData.serial_number,
      industry: assetData.industry,
      quantity: assetData.quantity,
      unit: assetData.unit,
      purchase_cost: assetData.purchase_cost,
      current_value: assetData.current_value || assetData.purchase_cost,
      depreciation_rate_pct: assetData.depreciation_rate_pct,
      reorder_point: assetData.reorder_point,
      status: assetData.status || 'active',
      condition: assetData.condition || 'good',
      location: assetData.location,
      supplier: assetData.supplier,
      notes: assetData.notes,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const [createdAsset] = await db
      .insert(assetsTable)
      .values(asset)
      .returning();

    return createdAsset;
  }

  /**
   * Update an existing asset
   */
  async updateAsset(options: UpdateAssetOptions) {
    const { id, tenantId, ...updateData } = options;

    const updateValues: any = {
      ...updateData,
      updated_at: new Date(),
    };

    // Map camelCase to snake_case for database fields
    if (updateValues.categoryId) updateValues.category_id = updateValues.categoryId;
    if (updateValues.serialNumber) updateValues.serial_number = updateValues.serialNumber;
    if (updateValues.depreciationRatePct) updateValues.depreciation_rate_pct = updateValues.depreciationRatePct;
    if (updateValues.reorderPoint) updateValues.reorder_point = updateValues.reorderPoint;
    if (updateValues.currentValue) updateValues.current_value = updateValues.currentValue;

    const [updatedAsset] = await db
      .update(assetsTable)
      .set(updateValues)
      .where(and(eq(assetsTable.id, id), eq(assetsTable.tenant_id, tenantId)))
      .returning();

    return updatedAsset;
  }

  /**
   * Get depreciation schedule for an asset
   */
  async getAssetDepreciation(id: string, tenantId: string) {
    // Verify asset belongs to tenant
    const asset = await db
      .select()
      .from(assetsTable)
      .where(and(eq(assetsTable.id, id), eq(assetsTable.tenant_id, tenantId)))
      .limit(1)
      .then(results => results[0]);

    if (!asset) {
      throw new Error('Asset not found');
    }

    const depreciation = await db
      .select()
      .from(depreciationSchedulesTable)
      .where(eq(depreciationSchedulesTable.asset_id, id))
      .orderBy(desc(depreciationSchedulesTable.period));

    return depreciation;
  }

  /**
   * Create a maintenance record for an asset
   */
  async createMaintenanceRecord(options: CreateMaintenanceOptions) {
    const { assetId, ...maintenanceData } = options;

    // Verify asset exists
    const asset = await db
      .select()
      .from(assetsTable)
      .where(eq(assetsTable.id, assetId))
      .limit(1)
      .then(results => results[0]);

    if (!asset) {
      throw new Error('Asset not found');
    }

    const maintenanceRecord = {
      id: randomUUID(),
      asset_id: assetId,
      description: maintenanceData.description,
      performed_by: maintenanceData.performed_by,
      performed_at: maintenanceData.performed_at,
      next_due_at: maintenanceData.next_due_at,
      cost: maintenanceData.cost,
      notes: maintenanceData.notes,
      created_at: new Date(),
    };

    const [createdRecord] = await db
      .insert(maintenanceRecordsTable)
      .values(maintenanceRecord)
      .returning();

    return createdRecord;
  }

  /**
   * Get list of asset categories
   */
  async listAssetCategories(tenantId: string) {
    const categories = await db
      .select()
      .from(assetCategoriesTable)
      .where(eq(assetCategoriesTable.tenant_id, tenantId))
      .orderBy(asc(assetCategoriesTable.name));

    return categories;
  }

  /**
   * Create a new asset category
   */
  async createAssetCategory(options: CreateAssetCategoryOptions) {
    const { tenantId, ...categoryData } = options;

    const category = {
      id: randomUUID(),
      tenant_id: tenantId,
      name: categoryData.name,
      description: categoryData.description,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const [createdCategory] = await db
      .insert(assetCategoriesTable)
      .values(category)
      .returning();

    return createdCategory;
  }

  /**
   * Calculate depreciation for an asset (server-side calculation)
   */
  async calculateDepreciation(assetId: string, period: Date) {
    const asset = await db
      .select()
      .from(assetsTable)
      .where(eq(assetsTable.id, assetId))
      .limit(1)
      .then(results => results[0]);

    if (!asset || !asset.purchase_cost || !asset.depreciation_rate_pct) {
      throw new Error('Asset missing required depreciation data');
    }

    // Get existing depreciation schedules
    const existingSchedules = await db
      .select()
      .from(depreciationSchedulesTable)
      .where(eq(depreciationSchedulesTable.asset_id, assetId))
      .orderBy(desc(depreciationSchedulesTable.period));

    const lastSchedule = existingSchedules[0];
    const accumulatedDepreciation = lastSchedule?.accumulated_depreciation || '0';
    const currentBookValue = lastSchedule?.book_value || asset.purchase_cost;

    // Calculate monthly depreciation
    const monthlyDepreciation = Number(asset.purchase_cost) * (Number(asset.depreciation_rate_pct) / 100 / 12);
    const newAccumulatedDepreciation = Number(accumulatedDepreciation) + monthlyDepreciation;
    const newBookValue = Number(currentBookValue) - monthlyDepreciation;

    // Don't depreciate below zero
    const finalDepreciation = Math.min(monthlyDepreciation, Number(currentBookValue));
    const finalAccumulatedDepreciation = Math.min(newAccumulatedDepreciation, Number(asset.purchase_cost));
    const finalBookValue = Math.max(newBookValue, 0);

    const depreciationSchedule = {
      id: randomUUID(),
      asset_id: assetId,
      period: period,
      depreciation_amount: finalDepreciation.toString(),
      accumulated_depreciation: finalAccumulatedDepreciation.toString(),
      book_value: finalBookValue.toString(),
      created_at: new Date(),
    };

    const [createdSchedule] = await db
      .insert(depreciationSchedulesTable)
      .values(depreciationSchedule)
      .returning();

    // Update asset's current value
    await db
      .update(assetsTable)
      .set({ 
        current_value: finalBookValue.toString(),
        updated_at: new Date()
      })
      .where(eq(assetsTable.id, assetId));

    return createdSchedule;
  }
}

export const assetService = new AssetService();
