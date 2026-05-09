/**
 * @file        artifacts/api-server/src/routes/asset-categories.ts
 * @module      API Server / Routes / Asset Categories
 * @purpose     Asset category management API endpoints
 *
 * @ai_instructions
 *   - Implement RESTful asset category endpoints following OpenAPI specification
 *   - Use proper HTTP status codes and error handling
 *   - Apply authentication and authorization middleware
 *   - Validate request bodies using Zod schemas
 *
 * @exports     Express router with asset category endpoints
 * @imports     Express, asset service, middleware, validation schemas
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Router, type IRouter } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middlewares/require-auth';
import { requirePermission } from '../middlewares/require-permission';
import { validateRequest } from '../middlewares/validate-request';
import { asyncHandler } from '../middlewares/error-handler';
import { assetService } from '../lib/asset-service';

const router: IRouter = Router();

const createAssetCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// Apply authentication and authorization middleware to all routes
router.use(requireAuth);
router.use(requirePermission(['assets:read']));

// GET /asset-categories - List asset categories
router.get('/',
  asyncHandler(async (req, res) => {
    const categories = await assetService.listAssetCategories(req.user!.tenantId);
    
    res.json({ data: categories });
  })
);

// POST /asset-categories - Create asset category
router.post('/',
  requirePermission(['assets:write']),
  validateRequest({ body: createAssetCategorySchema }),
  asyncHandler(async (req, res) => {
    const category = await assetService.createAssetCategory({
      ...req.body,
      tenantId: req.user!.tenantId,
    });

    res.status(201).json(category);
  })
);

export default router;
