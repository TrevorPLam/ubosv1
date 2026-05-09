/**
 * @file        artifacts/api-server/src/routes/crm.ts
 * @module      API Server / Routes / CRM
 * @purpose     CRM contacts and pipeline management endpoints
 *
 * @ai_instructions
 *   - Implement RESTful CRM endpoints following OpenAPI specification
 *   - Use proper HTTP status codes and error handling
 *   - Apply authentication and authorization middleware
 *   - Validate request bodies using Zod schemas
 *   - Include pipeline management and opportunity tracking
 *
 * @exports     Express router with CRM endpoints
 * @imports     Express, CRM service, middleware, validation schemas
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
import { crmService } from '../lib/crm-service';

const router: IRouter = Router();

// Query schemas for validation
const listContactsQuerySchema = z.object({
  page: commonSchemas.paginationQuery.shape.page.optional(),
  limit: commonSchemas.paginationQuery.shape.limit.optional(),
  status: z.enum(['hot', 'warm', 'cold']).optional(),
  search: z.string().max(100).optional(),
});

const createContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  company: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  status: z.enum(['hot', 'warm', 'cold']).optional(),
  tags: z.array(z.string()).optional(),
});

const createOpportunitySchema = z.object({
  clientId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  value: z.string().optional(),
  stage: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost']).optional(),
  winProbability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().optional(),
});

const updateOpportunitySchema = z.object({
  stage: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost']).optional(),
  winProbability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().optional(),
});

const pipelineQuerySchema = z.object({
  stage: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost']).optional(),
});

/**
 * GET /contacts
 * List CRM contacts with pagination and filtering
 */
router.get(
  '/contacts',
  requireAuth,
  requirePermission(['crm:read']),
  validateRequest({ query: listContactsQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query as {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    };
    
    const result = await crmService.listContacts({
      page,
      limit,
      status,
      search,
      tenantId: req.user?.tenantId!,
    });
    
    res.json(result);
  })
);

/**
 * POST /contacts
 * Create a new CRM contact
 */
router.post(
  '/contacts',
  requireAuth,
  requirePermission(['crm:write']),
  validateRequest({ body: createContactSchema }),
  asyncHandler(async (req, res) => {
    const contactData = req.body;
    const contact = await crmService.createContact({
      ...contactData,
      tenantId: req.user?.tenantId!,
    });
    res.status(201).json(contact);
  })
);

/**
 * GET /pipeline
 * Get sales pipeline with opportunities grouped by stage
 */
router.get(
  '/pipeline',
  requireAuth,
  requirePermission(['crm:read']),
  validateRequest({ query: pipelineQuerySchema }),
  asyncHandler(async (req, res) => {
    const { stage } = req.query as { stage?: string };
    
    const pipeline = await crmService.getPipeline({
      stage,
      tenantId: req.user?.tenantId!,
    });
    
    res.json(pipeline);
  })
);

/**
 * POST /opportunities
 * Create a new sales opportunity
 */
router.post(
  '/opportunities',
  requireAuth,
  requirePermission(['crm:write']),
  validateRequest({ body: createOpportunitySchema }),
  asyncHandler(async (req, res) => {
    const opportunityData = req.body;
    const opportunity = await crmService.createOpportunity({
      ...opportunityData,
      tenantId: req.user?.tenantId!,
    });
    res.status(201).json(opportunity);
  })
);

/**
 * PATCH /opportunities/:id
 * Update opportunity (stage movement, etc.)
 */
router.patch(
  '/opportunities/:id',
  requireAuth,
  requirePermission(['crm:write']),
  validateRequest({ 
    params: commonSchemas.uuidParam,
    body: updateOpportunitySchema 
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const updateData = req.body;
    
    const opportunity = await crmService.updateOpportunity(id, {
      ...updateData,
      tenantId: req.user?.tenantId!,
    });
    
    if (!opportunity) {
      return res.status(404).json({
        error: 'Opportunity not found',
        statusCode: 404,
      });
    }
    
    res.json(opportunity);
  })
);

export { router as crmRouter };
