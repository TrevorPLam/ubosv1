/**
 * @file        artifacts/api-server/src/routes/documents.ts
 * @module      API Server / Routes / Documents
 * @purpose     Document management routes with CRUD, versioning, and linking
 *
 * @ai_instructions
 *   - Use Express router for document operations
 *   - Implement all document CRUD operations with proper validation
 *   - Support document versioning and entity linking
 *   - Use proper error handling and status codes
 *   - Include request validation using Zod schemas
 *   - Apply authentication and authorization middleware
 *
 * @exports     Express router with document endpoints
 * @imports     express, document service, middleware, validation schemas
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Router } from 'express';
import { z } from 'zod';
import { documentService } from '../lib/document-service';
import { requireAuth } from '../middlewares/require-auth';
import { validateRequest } from '../middlewares/validate-request';
import { setRequestContext } from '../lib/tenant-context';
import { getCurrentUserId } from '../lib/tenant-context';

const router = Router();

/**
 * Validation schemas
 */
const createDocumentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  type: z.enum(['pdf', 'spreadsheet', 'doc', 'image', 'code', 'presentation', 'video', 'audio', 'archive', 'other']),
  access_level: z.enum(['private', 'team', 'public']).default('private'),
  folder: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  storage_reference_id: z.string().uuid('Invalid storage reference ID'),
});

const createDocumentVersionSchema = z.object({
  storage_reference_id: z.string().uuid('Invalid storage reference ID'),
  change_description: z.string().optional(),
});

const linkDocumentSchema = z.object({
  entity_type: z.string().min(1, 'Entity type is required'),
  entity_id: z.string().uuid('Invalid entity ID'),
  link_type: z.string().default('attachment'),
  description: z.string().optional(),
});

const updateDocumentStatusSchema = z.object({
  status: z.enum(['draft', 'pending', 'approved', 'requires_signature', 'expired']),
});

const listDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['pdf', 'spreadsheet', 'doc', 'image', 'code', 'presentation', 'video', 'audio', 'archive', 'other']).optional(),
  status: z.enum(['draft', 'pending', 'approved', 'requires_signature', 'expired']).optional(),
  access_level: z.enum(['private', 'team', 'public']).optional(),
  folder: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  starred: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid document ID'),
});

/**
 * GET /documents - List documents
 * 
 * Returns a paginated list of documents with filtering options.
 * Supports filtering by type, status, access level, folder, owner, and search.
 */
router.get('/', requireAuth, validateRequest({ query: listDocumentsQuerySchema }), async (req, res) => {
  try {
    const { page, limit, type, status, access_level, folder, owner_id, starred, search } = req.query as any;
    
    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not available',
      });
    }

    // Set tenant context for document service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    const filters = {
      type,
      status,
      accessLevel: access_level,
      folder,
      ownerId: owner_id,
      starred,
      search,
    };

    const pagination = { page, limit };
    const result = await documentService.listDocuments(filters, pagination);

    res.json({
      documents: result.documents,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list documents',
    });
  }
});

/**
 * POST /documents - Create document
 * 
 * Creates a new document record with an initial version.
 * The storage reference should be created first using the files/upload endpoint.
 */
router.post('/', requireAuth, validateRequest({ body: createDocumentSchema }), async (req, res) => {
  try {
    const { name, type, access_level, folder, description, tags, storage_reference_id } = req.body;
    
    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not available',
      });
    }

    // Set tenant context for document service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    const createData = {
      name,
      type,
      accessLevel: access_level,
      folder,
      description,
      tags,
      storageReferenceId: storage_reference_id,
      ownerId: userId,
    };

    const result = await documentService.createDocument(createData);

    res.status(201).json({
      document: result.document,
      versions: result.versions,
      linked_entities: result.linkedEntities,
    });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create document',
    });
  }
});

/**
 * GET /documents/:id - Get document details
 * 
 * Returns document details with version history and linked entities.
 */
router.get('/:id', requireAuth, validateRequest({ params: uuidParamSchema }), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not available',
      });
    }

    // Set tenant context for document service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    const result = await documentService.getDocument(id);

    res.json({
      document: result.document,
      versions: result.versions,
      linked_entities: result.linkedEntities,
    });
  } catch (error) {
    console.error('Error getting document:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Document not found',
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get document',
    });
  }
});

/**
 * POST /documents/:id/versions - Create document version
 * 
 * Creates a new version of an existing document.
 * The storage reference should be created first using the files/upload endpoint.
 */
router.post('/:id/versions', requireAuth, validateRequest({ 
  params: uuidParamSchema,
  body: createDocumentVersionSchema 
}), async (req, res) => {
  try {
    const { id } = req.params;
    const { storage_reference_id, change_description } = req.body;
    
    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not available',
      });
    }

    // Set tenant context for document service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    const versionData = {
      storageReferenceId: storage_reference_id,
      changeDescription: change_description,
      createdBy: userId,
    };

    const version = await documentService.createDocumentVersion(id, versionData);

    res.status(201).json(version);
  } catch (error) {
    console.error('Error creating document version:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Document not found',
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create document version',
    });
  }
});

/**
 * POST /documents/:id/link - Link document to entity
 * 
 * Links a document to any entity (client, project, task, employee).
 * Supports polymorphic linking to different entity types.
 */
router.post('/:id/link', requireAuth, validateRequest({ 
  params: uuidParamSchema,
  body: linkDocumentSchema 
}), async (req, res) => {
  try {
    const { id } = req.params;
    const { entity_type, entity_id, link_type, description } = req.body;
    
    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not available',
      });
    }

    // Set tenant context for document service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    const linkData = {
      entityType: entity_type,
      entityId: entity_id,
      linkType: link_type,
      description,
      linkedBy: userId,
    };

    const link = await documentService.linkDocument(id, linkData);

    res.status(201).json(link);
  } catch (error) {
    console.error('Error linking document:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Document not found',
      });
    }

    if (error instanceof Error && error.message.includes('already linked')) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Document is already linked to this entity',
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to link document',
    });
  }
});

/**
 * PATCH /documents/:id/status - Update document status
 * 
 * Updates document status with validation of valid transitions.
 * Supports status workflow: draft -> pending -> approved -> expired
 */
router.patch('/:id/status', requireAuth, validateRequest({ 
  params: uuidParamSchema,
  body: updateDocumentStatusSchema 
}), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not available',
      });
    }

    // Set tenant context for document service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    const document = await documentService.updateDocumentStatus(id, status);

    res.json(document);
  } catch (error) {
    console.error('Error updating document status:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Document not found',
      });
    }

    if (error instanceof Error && error.message.includes('Invalid status transition')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid status transition',
        details: error.message,
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update document status',
    });
  }
});

/**
 * DELETE /documents/:id - Delete document
 * 
 * Soft deletes a document by setting deleted_at timestamp.
 * Document remains in database but is not returned in listings.
 */
router.delete('/:id', requireAuth, validateRequest({ params: uuidParamSchema }), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not available',
      });
    }

    // Set tenant context for document service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    await documentService.deleteDocument(id);

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting document:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Document not found',
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete document',
    });
  }
});

/**
 * GET /documents/entity/:entityType/:entityId - Get entity documents
 * 
 * Returns all documents linked to a specific entity.
 * Useful for displaying related documents on entity detail pages.
 */
router.get('/entity/:entityType/:entityId', requireAuth, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    if (!entityType || !entityId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Entity type and ID are required',
      });
    }
    
    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not available',
      });
    }

    // Set tenant context for document service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    const documents = await documentService.getEntityDocuments(entityType, entityId);

    res.json({
      documents,
    });
  } catch (error) {
    console.error('Error getting entity documents:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get entity documents',
    });
  }
});

export default router;
