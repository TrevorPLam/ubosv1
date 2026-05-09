/**
 * @file        artifacts/api-server/src/routes/assets.ts
 * @module      API Server / Routes / Assets
 * @purpose     Asset management API endpoints with CRUD operations and depreciation tracking
 *
 * @ai_instructions
 *   - Implement RESTful asset endpoints following OpenAPI specification
 *   - Use proper HTTP status codes and error handling
 *   - Apply authentication and authorization middleware
 *   - Validate request bodies using Zod schemas
 *   - Include pagination, filtering, and search functionality
 *   - Handle depreciation calculations and maintenance records
 *
 * @exports     Express router with asset endpoints
 * @imports     Express, asset service, middleware, validation schemas
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Router, type IRouter } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/require-auth';
import { requirePermission } from '../middlewares/require-permission';
import { validateRequest, commonSchemas } from '../middlewares/validate-request';
import { asyncHandler } from '../middlewares/error-handler';
import { assetService } from '../lib/asset-service';

const router: IRouter = Router();

// Query schemas for validation
const listAssetsQuerySchema = z.object({
  page: commonSchemas.paginationQuery.shape.page.optional(),
  limit: commonSchemas.paginationQuery.shape.limit.optional(),
  industry: z.enum(['digital', 'food', 'product', 'equipment', 'real_estate', 'fleet']).optional(),
  status: z.enum(['active', 'low_stock', 'expiring', 'maintenance', 'inactive', 'critical']).optional(),
  categoryId: commonSchemas.uuidQuery.optional(),
  search: z.string().max(100).optional(),
});

const createAssetSchema = z.object({
  categoryId: commonSchemas.uuid,
  name: z.string().min(1).max(200),
  sku: z.string().max(50).optional(),
  serialNumber: z.string().max(100).optional(),
  industry: z.enum(['digital', 'food', 'product', 'equipment', 'real_estate', 'fleet']),
  quantity: z.number().int().min(0).default(1),
  unit: z.string().min(1).max(20).default('each'),
  purchaseCost: z.number().min(0),
  depreciationRatePct: z.number().min(0).max(100).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  location: z.string().max(200).optional(),
  supplier: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

const updateAssetSchema = z.object({
  categoryId: commonSchemas.uuid.optional(),
  name: z.string().min(1).max(200).optional(),
  sku: z.string().max(50).optional(),
  serialNumber: z.string().max(100).optional(),
  industry: z.enum(['digital', 'food', 'product', 'equipment', 'real_estate', 'fleet']).optional(),
  quantity: z.number().int().min(0).optional(),
  unit: z.string().min(1).max(20).optional(),
  currentValue: z.number().min(0).optional(),
  depreciationRatePct: z.number().min(0).max(100).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  status: z.enum(['active', 'low_stock', 'expiring', 'maintenance', 'inactive', 'critical']).optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  location: z.string().max(200).optional(),
  supplier: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

const createMaintenanceSchema = z.object({
  description: z.string().min(1).max(1000),
  performedBy: z.string().min(1).max(200),
  performedAt: z.string().datetime(),
  nextDueAt: z.string().datetime().optional(),
  cost: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

const createAssetCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// Apply authentication and authorization middleware to all routes
router.use(requireAuth);
router.use(requirePermission(['assets:read']));

// GET /assets - List assets with pagination and filtering
router.get('/', 
  validateRequest({ query: listAssetsQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, industry, status, categoryId, search } = req.query as any;
    
    const result = await assetService.listAssets({
      page: Number(page),
      limit: Number(limit),
      industry,
      status,
      categoryId,
      search,
      tenantId: req.user!.tenantId,
    });

    res.json(result);
  })
);

// POST /assets - Create a new asset
router.post('/',
  requirePermission(['assets:write']),
  validateRequest({ body: createAssetSchema }),
  asyncHandler(async (req, res) => {
    const asset = await assetService.createAsset({
      ...req.body,
      tenantId: req.user!.tenantId,
    });

    res.status(201).json(asset);
  })
);

// GET /assets/:id - Get asset details with depreciation and maintenance
router.get('/:id',
  validateRequest({ params: commonSchemas.uuidParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as any;
    
    const result = await assetService.getAssetById(id, req.user!.tenantId);
    
    if (!result) {
      return res.status(404).json({
        error: 'Asset not found',
        statusCode: 404,
      });
    }

    res.json(result);
  })
);

// PATCH /assets/:id - Update asset
router.patch('/:id',
  requirePermission(['assets:write']),
  validateRequest({ 
    params: commonSchemas.uuidParams,
    body: updateAssetSchema,
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as any;
    
    const asset = await assetService.updateAsset({
      id,
      tenantId: req.user!.tenantId,
      ...req.body,
    });

    if (!asset) {
      return res.status(404).json({
        error: 'Asset not found',
        statusCode: 404,
      });
    }

    res.json(asset);
  })
);

// GET /assets/:id/depreciation - Get asset depreciation schedule
router.get('/:id/depreciation',
  validateRequest({ params: commonSchemas.uuidParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as any;
    
    const depreciation = await assetService.getAssetDepreciation(id, req.user!.tenantId);
    
    res.json({ data: depreciation });
  })
);

// POST /assets/:id/maintenance - Create maintenance record
router.post('/:id/maintenance',
  requirePermission(['assets:write']),
  validateRequest({ 
    params: commonSchemas.uuidParams,
    body: createMaintenanceSchema,
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as any;
    
    const maintenance = await assetService.createMaintenanceRecord({
      assetId: id,
      ...req.body,
      performedAt: new Date(req.body.performedAt),
      nextDueAt: req.body.nextDueAt ? new Date(req.body.nextDueAt) : undefined,
    });

    res.status(201).json(maintenance);
  })
);


export default router;
