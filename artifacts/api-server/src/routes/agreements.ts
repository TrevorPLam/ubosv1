/**
 * @file        artifacts/api-server/src/routes/agreements.ts
 * @module      API Server / Routes / Agreements
 * @purpose     Agreement management endpoints with versioning and signature tracking
 *
 * @ai_instructions
 *   - Implement RESTful agreement endpoints following OpenAPI specification
 *   - Use proper HTTP status codes and error handling
 *   - Apply authentication and authorization middleware
 *   - Validate request bodies using Zod schemas
 *   - Include agreement versioning and signature state management
 *
 * @exports     Express router with agreement endpoints
 * @imports     Express, agreement service, middleware, validation schemas
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
import { agreementService } from '../lib/agreement-service';

const router: IRouter = Router();

// Query schemas for validation
const listAgreementsQuerySchema = z.object({
  page: commonSchemas.paginationQuery.shape.page.optional(),
  limit: commonSchemas.paginationQuery.shape.limit.optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'signed', 'expired']).optional(),
  clientId: z.string().uuid().optional(),
});

const createAgreementSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1).max(200),
  value: z.string().optional(),
});

const createAgreementVersionSchema = z.object({
  content: z.string().min(1),
  storageRef: z.string().optional(),
});

const updateSignatureSchema = z.object({
  status: z.enum(['pending', 'completed', 'declined']),
  externalEnvelopeId: z.string().optional(),
});

/**
 * GET /agreements
 * List agreements with pagination and filtering
 */
router.get(
  '/agreements',
  requireAuth,
  requirePermission(['crm:read']),
  validateRequest({ query: listAgreementsQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, clientId } = req.query as {
      page?: number;
      limit?: number;
      status?: string;
      clientId?: string;
    };
    
    const result = await agreementService.listAgreements({
      page,
      limit,
      status,
      clientId,
      tenantId: req.user?.tenantId!,
    });
    
    res.json(result);
  })
);

/**
 * POST /agreements
 * Create a new agreement
 */
router.post(
  '/agreements',
  requireAuth,
  requirePermission(['crm:write']),
  validateRequest({ body: createAgreementSchema }),
  asyncHandler(async (req, res) => {
    const agreementData = req.body;
    const agreement = await agreementService.createAgreement({
      ...agreementData,
      tenantId: req.user?.tenantId!,
    });
    res.status(201).json(agreement);
  })
);

/**
 * POST /agreements/:id/versions
 * Create a new version of an agreement
 */
router.post(
  '/agreements/:id/versions',
  requireAuth,
  requirePermission(['crm:write']),
  validateRequest({ 
    params: commonSchemas.uuidParam,
    body: createAgreementVersionSchema 
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const versionData = req.body;
    
    const version = await agreementService.createAgreementVersion(id, {
      ...versionData,
      createdBy: req.user?.id || 'unknown',
      tenantId: req.user?.tenantId!,
    });
    
    if (!version) {
      return res.status(404).json({
        error: 'Agreement not found',
        statusCode: 404,
      });
    }
    
    res.status(201).json(version);
  })
);

/**
 * PATCH /agreements/:id/signature
 * Update agreement signature state
 */
router.patch(
  '/agreements/:id/signature',
  requireAuth,
  requirePermission(['crm:write']),
  validateRequest({ 
    params: commonSchemas.uuidParam,
    body: updateSignatureSchema 
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const signatureData = req.body;
    
    const agreement = await agreementService.updateSignatureState(id, {
      ...signatureData,
      tenantId: req.user?.tenantId!,
    });
    
    if (!agreement) {
      return res.status(404).json({
        error: 'Agreement not found',
        statusCode: 404,
      });
    }
    
    res.json(agreement);
  })
);

export { router as agreementsRouter };
