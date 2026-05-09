/**
 * @file        artifacts/api-server/src/routes/files.ts
 * @module      API Server / Routes / Files
 * @purpose     File upload and storage routes
 *
 * @ai_instructions
 *   - Use Express router for file operations
 *   - Implement pre-signed URL generation for secure uploads
 *   - Validate file types and sizes before generating URLs
 *   - Use proper error handling and status codes
 *   - Include request validation using Zod schemas
 *   - Apply authentication and authorization middleware
 *
 * @exports     Express router with file endpoints
 * @imports     express, storage service, middleware, validation schemas
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Router } from 'express';
import { z } from 'zod';
import { storageService, StorageService } from '../lib/storage-service';
import { requireAuth } from '../middlewares/require-auth';
import { validateRequest } from '../middlewares/validate-request';
import { setRequestContext } from '../lib/tenant-context';
import { getCurrentUserId } from '../lib/tenant-context';

const router = Router();

/**
 * Validation schema for upload URL request
 */
const uploadRequestSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
  mime_type: z.string().min(1, 'MIME type is required'),
  size_bytes: z.number().int().positive('File size must be positive').max(100 * 1024 * 1024, 'File size too large'), // 100MB max
});

/**
 * GET /files/upload - Generate pre-signed upload URL
 * 
 * Returns a pre-signed URL for direct file upload to S3/R2 storage.
 * The client should upload the file directly to the returned URL,
 * then create a document record using the storage key.
 */
router.post('/upload', requireAuth, validateRequest({ body: uploadRequestSchema }), async (req, res) => {
  try {
    const { filename, mime_type, size_bytes } = req.body;
    
    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User context not available',
      });
    }

    // Set tenant context for storage service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    // Validate MIME type
    const allowedTypes = StorageService.getAllowedMimeTypes();
    if (!StorageService.validateMimeType(mime_type, allowedTypes)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'File type not allowed',
        details: {
          allowed_types: allowedTypes,
        },
      });
    }

    // Generate upload URL
    const uploadResult = await storageService.generateUploadUrl(
      filename,
      mime_type,
      size_bytes,
      req.tenantId!
    );

    res.json({
      upload_url: uploadResult.uploadUrl,
      storage_key: uploadResult.storageKey,
      expires_at: uploadResult.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate upload URL',
    });
  }
});

/**
 * GET /files/:storageKey/download - Generate pre-signed download URL
 * 
 * Returns a pre-signed URL for downloading a file from S3/R2 storage.
 * This endpoint can be used to provide temporary access to files.
 */
router.get('/:storageKey/download', requireAuth, async (req, res) => {
  try {
    const { storageKey } = req.params;
    
    if (!storageKey || typeof storageKey !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Storage key is required',
      });
    }
    
    if (!storageKey) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Storage key is required',
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

    // Set tenant context for storage service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    // Generate download URL
    const downloadUrl = await storageService.generateDownloadUrl(storageKey);

    res.json({
      download_url: downloadUrl,
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'File not found',
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate download URL',
    });
  }
});

/**
 * GET /files/:storageKey/metadata - Get file metadata
 * 
 * Returns metadata for a stored file including size, content type,
 * and last modified date without providing download access.
 */
router.get('/:storageKey/metadata', requireAuth, async (req, res) => {
  try {
    const { storageKey } = req.params;
    
    if (!storageKey || typeof storageKey !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Storage key is required',
      });
    }
    
    if (!storageKey) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Storage key is required',
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

    // Set tenant context for storage service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    // Get file metadata
    const metadata = await storageService.getMetadata(storageKey);

    res.json({
      bucket: metadata.bucket,
      key: metadata.key,
      size: metadata.size,
      content_type: metadata.contentType,
      last_modified: metadata.lastModified,
      etag: metadata.etag,
    });
  } catch (error) {
    console.error('Error getting file metadata:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'File not found',
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get file metadata',
    });
  }
});

/**
 * HEAD /files/:storageKey - Check if file exists
 * 
 * Returns 200 if file exists, 404 if not found.
 * Useful for checking file existence before other operations.
 */
router.head('/:storageKey', requireAuth, async (req, res) => {
  try {
    const { storageKey } = req.params;
    
    if (!storageKey || typeof storageKey !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Storage key is required',
      });
    }
    
    if (!storageKey) {
      return res.status(400).end();
    }

    // Get current user and tenant context
    const userId = getCurrentUserId();
    if (!userId) {
      return res.status(401).end();
    }

    // Set tenant context for storage service
    setRequestContext({
      tenantId: req.tenantId,
      userId,
    });

    // Check if file exists
    const exists = await storageService.fileExists(storageKey);
    
    if (exists) {
      return res.status(200).end();
    } else {
      return res.status(404).end();
    }
  } catch (error) {
    console.error('Error checking file existence:', error);
    res.status(500).end();
  }
});

export default router;
