/**
 * @file        artifacts/api-server/src/routes/clients.ts
 * @module      API Server / Routes / Clients
 * @purpose     Client management API endpoints with CRUD operations and cross-linked resources
 *
 * @ai_instructions
 *   - Implement RESTful client endpoints following OpenAPI specification
 *   - Use proper HTTP status codes and error handling
 *   - Apply authentication and authorization middleware
 *   - Validate request bodies using Zod schemas
 *   - Include pagination, filtering, and search functionality
 *   - Handle cross-linked resources (projects, documents, agreements, appointments)
 *
 * @exports     Express router with client endpoints
 * @imports     Express, client service, middleware, validation schemas
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
import { clientService } from '../lib/client-service';

const router: IRouter = Router();

// Query schemas for validation
const listClientsQuerySchema = z.object({
  page: commonSchemas.paginationQuery.shape.page.optional(),
  limit: commonSchemas.paginationQuery.shape.limit.optional(),
  status: z.enum(['active', 'inactive', 'at-risk', 'new']).optional(),
  search: z.string().max(100).optional(),
});

const createClientSchema = z.object({
  salutation: z.enum(['mr', 'mrs', 'ms', 'dr', 'prof', 'mx', 'none']).optional(),
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  suffix: z.string().max(20).optional(),
  preferredName: z.string().max(100).optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']).optional(),
  preferredLanguage: z.string().max(10).optional(),
  company: z.string().max(200).optional(),
  jobTitle: z.string().max(200).optional(),
  status: z.enum(['active', 'inactive', 'at-risk', 'new']).optional(),
  source: z.string().max(100).optional(),
  clientOwner: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

const updateClientSchema = z.object({
  salutation: z.enum(['mr', 'mrs', 'ms', 'dr', 'prof', 'mx', 'none']).optional(),
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  suffix: z.string().max(20).optional(),
  preferredName: z.string().max(100).optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']).optional(),
  preferredLanguage: z.string().max(10).optional(),
  company: z.string().max(200).optional(),
  jobTitle: z.string().max(200).optional(),
  status: z.enum(['active', 'inactive', 'at-risk', 'new']),
  source: z.string().max(100).optional(),
  clientOwner: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

const uuidParamSchema = commonSchemas.uuidParam;

/**
 * GET /clients
 * List clients with pagination, filtering, and search
 */
router.get(
  '/clients',
  requireAuth,
  requirePermission(['crm:read']),
  validateRequest({ query: listClientsQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query as {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    };
    
    const result = await clientService.listClients({
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
 * POST /clients
 * Create a new client
 */
router.post(
  '/clients',
  requireAuth,
  requirePermission(['crm:write']),
  validateRequest({ body: createClientSchema }),
  asyncHandler(async (req, res) => {
    const clientData = req.body;
    const client = await clientService.createClient({
      ...clientData,
      tenantId: req.user?.tenantId!,
    });
    res.status(201).json(client);
  })
);

/**
 * GET /clients/:id
 * Get detailed client information including contacts
 */
router.get(
  '/clients/:id',
  requireAuth,
  requirePermission(['crm:read']),
  validateRequest({ params: uuidParamSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const client = await clientService.getClientById(id, req.user?.tenantId!);
    
    if (!client) {
      return res.status(404).json({
        error: 'Client not found',
        statusCode: 404,
      });
    }
    
    res.json(client);
  })
);

/**
 * PUT /clients/:id
 * Update client information completely
 */
router.put(
  '/clients/:id',
  requireAuth,
  requirePermission(['crm:write']),
  validateRequest({ 
    params: uuidParamSchema,
    body: updateClientSchema 
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const updateData = req.body;
    
    const client = await clientService.updateClient(id, {
      ...updateData,
      tenantId: req.user?.tenantId!,
    });
    
    if (!client) {
      return res.status(404).json({
        error: 'Client not found',
        statusCode: 404,
      });
    }
    
    res.json(client);
  })
);

/**
 * DELETE /clients/:id
 * Delete a client and all associated data
 */
router.delete(
  '/clients/:id',
  requireAuth,
  requirePermission(['crm:write']),
  validateRequest({ params: uuidParamSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    
    const deleted = await clientService.deleteClient(id, req.user?.tenantId!);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Client not found',
        statusCode: 404,
      });
    }
    
    res.status(204).send();
  })
);

/**
 * GET /clients/:id/contacts
 * Get all contact information for a specific client
 */
router.get(
  '/:id/contacts',
  requirePermission('clients:read'),
  validateRequest({ params: uuidParamSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as any;
      
      // Verify client exists
      const client = await clientService.getClientById(id, req.tenant?.id);
      if (!client) {
        return res.status(404).json({
          error: 'Client not found',
          statusCode: 404,
        });
      }
      
      const contacts = await clientService.getClientContacts(id, req.tenant?.id);
      res.json(contacts);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /clients/:id/projects
 * Get all projects associated with a specific client
 */
router.get(
  '/:id/projects',
  requirePermission('clients:read'),
  validateRequest({ params: uuidParamSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as any;
      
      // Verify client exists
      const client = await clientService.getClientById(id, req.tenant?.id);
      if (!client) {
        return res.status(404).json({
          error: 'Client not found',
          statusCode: 404,
        });
      }
      
      const projects = await clientService.getClientProjects(id, req.tenant?.id);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /clients/:id/documents
 * Get all documents associated with a specific client
 */
router.get(
  '/:id/documents',
  requirePermission('clients:read'),
  validateRequest({ params: uuidParamSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as any;
      
      // Verify client exists
      const client = await clientService.getClientById(id, req.tenant?.id);
      if (!client) {
        return res.status(404).json({
          error: 'Client not found',
          statusCode: 404,
        });
      }
      
      const documents = await clientService.getClientDocuments(id, req.tenant?.id);
      res.json(documents);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /clients/:id/agreements
 * Get all agreements associated with a specific client
 */
router.get(
  '/:id/agreements',
  requirePermission('clients:read'),
  validateRequest({ params: uuidParamSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as any;
      
      // Verify client exists
      const client = await clientService.getClientById(id, req.tenant?.id);
      if (!client) {
        return res.status(404).json({
          error: 'Client not found',
          statusCode: 404,
        });
      }
      
      const agreements = await clientService.getClientAgreements(id, req.tenant?.id);
      res.json(agreements);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /clients/:id/appointments
 * Get all appointments associated with a specific client
 */
router.get(
  '/:id/appointments',
  requirePermission('clients:read'),
  validateRequest({ params: uuidParamSchema }),
  async (req, res, next) => {
    try {
      const { id } = req.params as any;
      
      // Verify client exists
      const client = await clientService.getClientById(id, req.tenant?.id);
      if (!client) {
        return res.status(404).json({
          error: 'Client not found',
          statusCode: 404,
        });
      }
      
      const appointments = await clientService.getClientAppointments(id, req.tenant?.id);
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  }
);

export { router as clientsRouter };
