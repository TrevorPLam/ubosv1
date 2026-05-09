/**
 * @file        artifacts/api-server/src/routes/knowledge.ts
 * @module      API Server / Routes / Knowledge
 * @purpose     Knowledge management routes with CRUD, versioning, search, and certifications
 *
 * @ai_instructions
 *   - Use Express router for knowledge operations
 *   - Implement all knowledge CRUD operations with proper validation
 *   - Support knowledge versioning and full-text search
 *   - Include certification management endpoints
 *   - Use proper error handling and status codes
 *   - Include request validation using Zod schemas
 *   - Apply authentication and authorization middleware
 *
 * @exports     Express router with knowledge endpoints
 * @imports     express, knowledge service, middleware, validation schemas
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Router } from 'express';
import { z } from 'zod';
import { knowledgeService } from '../lib/knowledge-service';
import { requireAuth } from '../middlewares/require-auth';
import { validateRequest } from '../middlewares/validate-request';
import { setRequestContext } from '../lib/tenant-context';
import { getCurrentUserId } from '../lib/tenant-context';

const router = Router();

/**
 * Validation schemas
 */
const createKnowledgeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  category: z.enum(['sop', 'wiki', 'training', 'certification', 'policy', 'process', 'template', 'faq', 'best_practice', 'other']),
  role: z.string().optional(),
  department: z.string().optional(),
  tags: z.array(z.string()).default([]),
  reviewer_id: z.string().uuid().optional(),
  review_due_at: z.string().datetime().optional(),
  effective_date: z.string().datetime().optional(),
  expiry_date: z.string().datetime().optional(),
  parent_entry_id: z.string().uuid().optional(),
  is_template: z.boolean().default(false),
});

const updateKnowledgeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  status: z.enum(['draft', 'needs-review', 'published', 'current']).optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  tags: z.array(z.string()).optional(),
  reviewer_id: z.string().uuid().optional(),
  review_due_at: z.string().datetime().optional(),
  effective_date: z.string().datetime().optional(),
  expiry_date: z.string().datetime().optional(),
  parent_entry_id: z.string().uuid().optional(),
  change_summary: z.string().optional(),
});

const createCertificationSchema = z.object({
  employee_id: z.string().uuid('Invalid employee ID'),
  certification_name: z.string().min(1, 'Certification name is required'),
  issuing_body: z.string().min(1, 'Issuing body is required'),
  credential_id: z.string().optional(),
  certification_level: z.string().optional(),
  issued_at: z.string().datetime('Invalid issued date'),
  expires_at: z.string().datetime().optional(),
  verification_url: z.string().url().optional(),
  verification_code: z.string().optional(),
  certificate_file_id: z.string().uuid().optional(),
  training_completed_at: z.string().datetime().optional(),
  next_renewal_due: z.string().datetime().optional(),
  notes: z.string().optional(),
  cost: z.number().int().positive().optional(),
  currency: z.string().default('USD'),
});

const listKnowledgeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.enum(['sop', 'wiki', 'training', 'certification', 'policy', 'process', 'template', 'faq', 'best_practice', 'other']).optional(),
  status: z.enum(['draft', 'needs-review', 'published', 'current']).optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  author_id: z.string().uuid().optional(),
  is_template: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

const listCertificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  employee_id: z.string().uuid().optional(),
  status: z.enum(['compliant', 'at-risk', 'overdue', 'expired', 'pending']).optional(),
  certification_name: z.string().optional(),
  issuing_body: z.string().optional(),
});

const searchKnowledgeQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
  category: z.enum(['sop', 'wiki', 'training', 'certification', 'policy', 'process', 'template', 'faq', 'best_practice', 'other']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID'),
});

/**
 * GET /knowledge - List knowledge entries
 * 
 * Returns a paginated list of knowledge entries with filtering options.
 * Supports filtering by category, status, role, department, author, and search.
 */
router.get('/', requireAuth, validateRequest({ query: listKnowledgeQuerySchema }), async (req, res) => {
  try {
    const { page, limit, category, status, role, department, author_id, is_template, search } = req.query as any;
    
    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not available',
      });
    }

    // Set tenant context for knowledge service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    const filters = {
      category,
      status,
      role,
      department,
      authorId: author_id,
      isTemplate: is_template,
      search,
    };

    const pagination = { page, limit };
    const result = await knowledgeService.listKnowledge(filters, pagination);

    res.json({
      entries: result.entries,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error listing knowledge entries:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list knowledge entries',
    });
  }
});

/**
 * POST /knowledge - Create knowledge entry
 * 
 * Creates a new knowledge entry with an initial version.
 * Supports categories like SOPs, wikis, training materials, etc.
 */
router.post('/', requireAuth, validateRequest({ body: createKnowledgeSchema }), async (req, res) => {
  try {
    const { 
      title, 
      content, 
      category, 
      role, 
      department, 
      tags, 
      reviewer_id, 
      review_due_at, 
      effective_date, 
      expiry_date, 
      parent_entry_id, 
      is_template 
    } = req.body;
    
    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not available',
      });
    }

    // Set tenant context for knowledge service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    const createData = {
      title,
      content,
      category,
      role,
      department,
      tags,
      reviewerId: reviewer_id,
      reviewDueAt: review_due_at ? new Date(review_due_at) : undefined,
      effectiveDate: effective_date ? new Date(effective_date) : undefined,
      expiryDate: expiry_date ? new Date(expiry_date) : undefined,
      parentEntryId: parent_entry_id,
      isTemplate: is_template,
      authorId: userId,
    };

    const result = await knowledgeService.createKnowledge(createData);

    res.status(201).json({
      entry: result.entry,
      versions: result.versions,
    });
  } catch (error) {
    console.error('Error creating knowledge entry:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create knowledge entry',
    });
  }
});

/**
 * GET /knowledge/search - Search knowledge entries
 * 
 * Performs full-text search across knowledge entries with relevance ranking.
 * Returns search results with snippets and relevance scores.
 */
router.get('/search', requireAuth, validateRequest({ query: searchKnowledgeQuerySchema }), async (req, res) => {
  try {
    const { q, category, limit } = req.query as any;
    
    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not available',
      });
    }

    // Set tenant context for knowledge service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    const filters = { category, limit };
    const result = await knowledgeService.searchKnowledge(q, filters);

    res.json({
      results: result.results,
      total: result.total,
    });
  } catch (error) {
    console.error('Error searching knowledge entries:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search knowledge entries',
    });
  }
});

/**
 * GET /knowledge/:id - Get knowledge entry details
 * 
 * Returns knowledge entry details with version history.
 * Increments view count for analytics.
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

    // Set tenant context for knowledge service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    const result = await knowledgeService.getKnowledge(id);

    // Increment view count asynchronously (don't wait for it)
    knowledgeService.incrementViewCount(id).catch(console.error);

    res.json({
      entry: result.entry,
      versions: result.versions,
    });
  } catch (error) {
    console.error('Error getting knowledge entry:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Knowledge entry not found',
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get knowledge entry',
    });
  }
});

/**
 * PATCH /knowledge/:id - Update knowledge entry
 * 
 * Updates a knowledge entry, creating a new version automatically.
 * Supports status changes and content updates with change tracking.
 */
router.patch('/:id', requireAuth, validateRequest({ 
  params: uuidParamSchema,
  body: updateKnowledgeSchema 
}), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      content, 
      status, 
      role, 
      department, 
      tags, 
      reviewer_id, 
      review_due_at, 
      effective_date, 
      expiry_date, 
      parent_entry_id, 
      change_summary 
    } = req.body;
    
    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not available',
      });
    }

    // Set tenant context for knowledge service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    const updateData = {
      title,
      content,
      status,
      role,
      department,
      tags,
      reviewerId: reviewer_id,
      reviewDueAt: review_due_at ? new Date(review_due_at) : undefined,
      effectiveDate: effective_date ? new Date(effective_date) : undefined,
      expiryDate: expiry_date ? new Date(expiry_date) : undefined,
      parentEntryId: parent_entry_id,
      changeSummary: change_summary,
      editedBy: userId,
    };

    const result = await knowledgeService.updateKnowledge(id, updateData);

    res.json({
      entry: result.entry,
      versions: result.versions,
    });
  } catch (error) {
    console.error('Error updating knowledge entry:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Knowledge entry not found',
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update knowledge entry',
    });
  }
});

/**
 * DELETE /knowledge/:id - Delete knowledge entry
 * 
 * Soft deletes a knowledge entry by setting deleted_at timestamp.
 * Entry remains in database but is not returned in listings.
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

    // Set tenant context for knowledge service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    await knowledgeService.deleteKnowledge(id);

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Knowledge entry not found',
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete knowledge entry',
    });
  }
});

/**
 * GET /certifications - List certification records
 * 
 * Returns a paginated list of employee certification records.
 * Supports filtering by employee, status, certification name, and issuing body.
 */
router.get('/certifications', requireAuth, validateRequest({ query: listCertificationsQuerySchema }), async (req, res) => {
  try {
    const { page, limit, employee_id, status, certification_name, issuing_body } = req.query as any;
    
    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not available',
      });
    }

    // Set tenant context for knowledge service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    const filters = {
      employeeId: employee_id,
      status,
      certificationName: certification_name,
      issuingBody: issuing_body,
    };

    const pagination = { page, limit };
    const result = await knowledgeService.listCertifications(filters, pagination);

    res.json({
      certifications: result.certifications,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error listing certifications:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list certifications',
    });
  }
});

/**
 * POST /certifications - Create certification record
 * 
 * Creates a new certification record for an employee.
 * Tracks certification status, expiration, and renewal requirements.
 */
router.post('/certifications', requireAuth, validateRequest({ body: createCertificationSchema }), async (req, res) => {
  try {
    const { 
      employee_id, 
      certification_name, 
      issuing_body, 
      credential_id, 
      certification_level, 
      issued_at, 
      expires_at, 
      verification_url, 
      verification_code, 
      certificate_file_id, 
      training_completed_at, 
      next_renewal_due, 
      notes, 
      cost, 
      currency 
    } = req.body;
    
    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not available',
      });
    }

    // Set tenant context for knowledge service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    const createData = {
      employeeId: employee_id,
      certificationName: certification_name,
      issuingBody: issuing_body,
      credentialId: credential_id,
      certificationLevel: certification_level,
      issuedAt: new Date(issued_at),
      expiresAt: expires_at ? new Date(expires_at) : undefined,
      verificationUrl: verification_url,
      verificationCode: verification_code,
      certificateFileId: certificate_file_id,
      trainingCompletedAt: training_completed_at ? new Date(training_completed_at) : undefined,
      nextRenewalDue: next_renewal_due ? new Date(next_renewal_due) : undefined,
      notes,
      cost,
      currency,
    };

    const certification = await knowledgeService.createCertification(createData);

    res.status(201).json(certification);
  } catch (error) {
    console.error('Error creating certification:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create certification',
    });
  }
});

export default router;
