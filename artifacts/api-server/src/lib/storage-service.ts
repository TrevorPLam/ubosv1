/**
 * @file        artifacts/api-server/src/lib/storage-service.ts
 * @module      API Server / Storage Service
 * @purpose     S3/R2 storage service for pre-signed URL generation and file operations
 *
 * @ai_instructions
 *   - Use AWS SDK v3 for S3-compatible storage operations
 *   - Support both AWS S3 and Cloudflare R2 through endpoint configuration
 *   - Generate secure pre-signed URLs with appropriate expiration times
 *   - Include proper error handling and logging
 *   - Follow security best practices for file uploads
 *   - Use environment variables for configuration
 *
 * @exports     StorageService class with upload/download URL generation
 * @imports     @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, crypto, config
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'crypto';
import { s3, aws } from './config';

export interface UploadUrlResult {
  uploadUrl: string;
  storageKey: string;
  expiresAt: Date;
}

export interface StorageMetadata {
  bucket: string;
  key: string;
  size?: number;
  contentType?: string;
  lastModified?: Date;
  etag?: string;
}

/**
 * Storage service for S3/R2 operations
 * Provides pre-signed URL generation for secure direct uploads
 */
export class StorageService {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    // Initialize S3 client with configuration from environment
    this.s3Client = new S3Client({
      region: aws.region || 'auto',
      endpoint: s3.endpoint,
      credentials: {
        accessKeyId: s3.accessKey,
        secretAccessKey: s3.secretKey,
      },
      // Force path style for R2 compatibility
      forcePathStyle: !!s3.endpoint && !s3.endpoint.includes('amazonaws.com'),
    });

    this.bucket = s3.bucket;

    if (!this.bucket) {
      throw new Error('S3 bucket name is required');
    }
  }

  /**
   * Generate a unique storage key for a file
   * @param originalFilename Original filename
   * @param mimeType File MIME type
   * @param tenantId Tenant ID for multi-tenant isolation
   * @returns Unique storage key
   */
  private generateStorageKey(originalFilename: string, mimeType: string, tenantId: string): string {
    // Sanitize filename
    const sanitized = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Generate unique identifier
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(2);
    
    // Organize by tenant and date for better structure
    const datePrefix = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    return `${tenantId}/${datePrefix}/${timestamp}-${random}-${sanitized}`;
  }

  /**
   * Generate pre-signed upload URL for direct file upload
   * @param filename Original filename
   * @param mimeType File MIME type
   * @param sizeBytes File size in bytes
   * @param tenantId Tenant ID for multi-tenant isolation
   * @param expiresIn URL expiration time in seconds (default: 1 hour)
   * @returns Upload URL result with storage key and expiration
   */
  async generateUploadUrl(
    filename: string,
    mimeType: string,
    sizeBytes: number,
    tenantId: string,
    expiresIn: number = 3600
  ): Promise<UploadUrlResult> {
    try {
      // Validate inputs
      if (!filename || !mimeType || sizeBytes <= 0 || !tenantId) {
        throw new Error('Invalid upload parameters');
      }

      // Check file size limits (100MB default)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (sizeBytes > maxSize) {
        throw new Error(`File size ${sizeBytes} exceeds maximum allowed size ${maxSize}`);
      }

      // Generate storage key
      const storageKey = this.generateStorageKey(filename, mimeType, tenantId);

      // Create put command for pre-signed URL
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        ContentType: mimeType,
        ContentLength: sizeBytes,
        // Add metadata for tracking
        Metadata: {
          'original-filename': filename,
          'tenant-id': tenantId,
          'upload-source': 'api-presigned',
        },
      });

      // Generate pre-signed URL
      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      return {
        uploadUrl,
        storageKey,
        expiresAt,
      };
    } catch (error) {
      console.error('Error generating upload URL:', error);
      throw new Error(`Failed to generate upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate pre-signed download URL for file access
   * @param storageKey Storage key of the file
   * @param expiresIn URL expiration time in seconds (default: 1 hour)
   * @returns Download URL
   */
  async generateDownloadUrl(storageKey: string, expiresIn: number = 3600): Promise<string> {
    try {
      if (!storageKey) {
        throw new Error('Storage key is required');
      }

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file metadata from storage
   * @param storageKey Storage key of the file
   * @returns File metadata
   */
  async getMetadata(storageKey: string): Promise<StorageMetadata> {
    try {
      if (!storageKey) {
        throw new Error('Storage key is required');
      }

      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      });

      const response = await this.s3Client.send(command);

      return {
        bucket: this.bucket,
        key: storageKey,
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        etag: response.ETag?.replace(/"/g, ''), // Remove quotes from ETag
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if file exists in storage
   * @param storageKey Storage key of the file
   * @returns True if file exists
   */
  async fileExists(storageKey: string): Promise<boolean> {
    try {
      await this.getMetadata(storageKey);
      return true;
    } catch (error) {
      // HeadObjectCommand throws error if file doesn't exist
      return false;
    }
  }

  /**
   * Calculate SHA-256 hash of file content (for integrity verification)
   * @param buffer File content as buffer
   * @returns SHA-256 hash as hex string
   */
  static calculateChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Extract file extension from filename
   * @param filename Original filename
   * @returns File extension (without dot) or empty string
   */
  static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
  }

  /**
   * Validate MIME type against allowed types
   * @param mimeType MIME type to validate
   * @param allowedTypes Array of allowed MIME types
   * @returns True if MIME type is allowed
   */
  static validateMimeType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimeType);
  }

  /**
   * Get default allowed MIME types for uploads
   * @returns Array of allowed MIME types
   */
  static getAllowedMimeTypes(): string[] {
    return [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      
      // Text
      'text/plain',
      'text/csv',
      'text/markdown',
      'application/json',
      
      // Archives
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      
      // Code
      'text/javascript',
      'application/javascript',
      'text/x-python',
      'text/x-java',
      'text/x-c',
      'text/x-c++',
      'text/x-ruby',
      'text/x-php',
      'text/x-typescript',
    ];
  }
}

// Export singleton instance
export const storageService = new StorageService();
