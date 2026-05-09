/**
 * @file        artifacts/api-server/src/lib/document-service.ts
 * @module      API Server / Document Service
 * @purpose     Document management service with CRUD, versioning, and entity linking
 *
 * @ai_instructions
 *   - Use database transactions for document version creation
 *   - Implement proper tenant isolation using tenant context
 *   - Handle document status transitions with validation
 *   - Support polymorphic entity linking (client, project, task, employee)
 *   - Include pagination and filtering for document listings
 *   - Add audit logging for document operations
 *   - Use proper error handling and validation
 *
 * @exports     DocumentService class with document management operations
 * @imports     Database schema types, storage service, tenant context
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { eq, and, desc, asc, ilike, inArray } from 'drizzle-orm';
import { db } from '@workspace/db';
import {
  documents,
  documentVersions,
  storageReferences,
  entityDocuments,
  type Document,
  type DocumentVersion,
  type StorageReference,
  type EntityDocument,
  type InsertDocument,
  type InsertDocumentVersion,
  type InsertStorageReference,
  type InsertEntityDocument,
} from '@workspace/db/schema';
import { storageService } from './storage-service';
import { getCurrentTenantId } from './tenant-context';

export interface CreateDocumentData {
  name: string;
  type: 'pdf' | 'spreadsheet' | 'doc' | 'image' | 'code' | 'presentation' | 'video' | 'audio' | 'archive' | 'other';
  accessLevel?: 'private' | 'team' | 'public';
  folder?: string;
  description?: string;
  tags?: string[];
  storageReferenceId: string;
  ownerId: string;
}

export interface CreateDocumentVersionData {
  storageReferenceId: string;
  changeDescription?: string;
  createdBy: string;
}

export interface LinkDocumentData {
  entityType: string;
  entityId: string;
  linkType?: string;
  description?: string;
  linkedBy: string;
}

export interface DocumentListFilters {
  type?: 'pdf' | 'spreadsheet' | 'doc' | 'image' | 'code' | 'presentation' | 'video' | 'audio' | 'archive' | 'other';
  status?: 'draft' | 'pending' | 'approved' | 'requires_signature' | 'expired';
  accessLevel?: 'private' | 'team' | 'public';
  folder?: string;
  ownerId?: string;
  starred?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface DocumentListResult {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DocumentDetailResult {
  document: Document;
  versions: DocumentVersion[];
  linkedEntities: EntityDocument[];
}

/**
 * Document service for managing documents, versions, and entity links
 */
export class DocumentService {
  /**
   * Create a new document with initial version
   * @param data Document creation data
   * @returns Created document with version
   */
  async createDocument(data: CreateDocumentData): Promise<DocumentDetailResult> {
    const tenantId = getCurrentTenantId();
    
    try {
      // Use transaction for atomic document and version creation
      const result = await db.transaction(async (tx) => {
        // Verify storage reference exists and belongs to tenant
        const storageRef = await tx.query.storageReferences.findFirst({
          where: and(
            eq(storageReferences.id, data.storageReferenceId),
            eq(storageReferences.tenant_id, tenantId)
          ),
        });

        if (!storageRef) {
          throw new Error('Storage reference not found or access denied');
        }

        // Create document
        const insertData: InsertDocument = {
          tenant_id: tenantId,
          name: data.name,
          type: data.type,
          status: 'draft',
          access_level: data.accessLevel || 'private',
          owner_id: data.ownerId,
          folder: data.folder,
          description: data.description,
          tags: data.tags || [],
        };

        const [document] = await tx.insert(documents).values(insertData).returning();

        // Create initial version
        const versionInsertData: InsertDocumentVersion = {
          document_id: document.id,
          version_number: 1,
          storage_reference_id: data.storageReferenceId,
          created_by: data.ownerId,
          change_description: 'Initial version',
        };

        const [version] = await tx.insert(documentVersions).values(versionInsertData).returning();

        return { document, version };
      });

      // Get linked entities (empty for new document)
      const linkedEntities: EntityDocument[] = [];

      return {
        document: result.document,
        versions: [result.version],
        linkedEntities,
      };
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error(`Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get document details with versions and linked entities
   * @param documentId Document ID
   * @returns Document details
   */
  async getDocument(documentId: string): Promise<DocumentDetailResult> {
    const tenantId = getCurrentTenantId();

    try {
      // Get document
      const document = await db.query.documents.findFirst({
        where: and(
          eq(documents.id, documentId),
          eq(documents.tenant_id, tenantId)
        ),
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Get versions
      const versions = await db.query.documentVersions.findMany({
        where: eq(documentVersions.document_id, documentId),
        orderBy: [desc(documentVersions.version_number)],
        with: {
          storageReference: true,
        },
      });

      // Get linked entities
      const linkedEntities = await db.query.entityDocuments.findMany({
        where: eq(entityDocuments.document_id, documentId),
        orderBy: [desc(entityDocuments.linked_at)],
      });

      return {
        document,
        versions,
        linkedEntities,
      };
    } catch (error) {
      console.error('Error getting document:', error);
      throw new Error(`Failed to get document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List documents with filtering and pagination
   * @param filters Filter options
   * @param pagination Pagination options
   * @returns Paginated document list
   */
  async listDocuments(
    filters: DocumentListFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<DocumentListResult> {
    const tenantId = getCurrentTenantId();
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    try {
      // Build query conditions
      const conditions = [eq(documents.tenant_id, tenantId)];

      if (filters.type) {
        conditions.push(eq(documents.type, filters.type));
      }

      if (filters.status) {
        conditions.push(eq(documents.status, filters.status));
      }

      if (filters.accessLevel) {
        conditions.push(eq(documents.access_level, filters.accessLevel));
      }

      if (filters.folder) {
        conditions.push(eq(documents.folder, filters.folder));
      }

      if (filters.ownerId) {
        conditions.push(eq(documents.owner_id, filters.ownerId));
      }

      if (filters.starred !== undefined) {
        conditions.push(eq(documents.starred, filters.starred));
      }

      if (filters.search) {
        conditions.push(ilike(documents.name, `%${filters.search}%`));
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

      // Get total count
      const [{ count }] = await db
        .select({ count: documents.id })
        .from(documents)
        .where(whereClause);

      // Get documents
      const documentsList = await db.query.documents.findMany({
        where: whereClause,
        orderBy: [desc(documents.updated_at)],
        limit,
        offset,
      });

      const total = Number(count);
      const totalPages = Math.ceil(total / limit);

      return {
        documents: documentsList,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error listing documents:', error);
      throw new Error(`Failed to list documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new version of an existing document
   * @param documentId Document ID
   * @param data Version creation data
   * @returns Created version
   */
  async createDocumentVersion(
    documentId: string,
    data: CreateDocumentVersionData
  ): Promise<DocumentVersion> {
    const tenantId = getCurrentTenantId();

    try {
      // Use transaction for atomic version creation
      const result = await db.transaction(async (tx) => {
        // Verify document exists and belongs to tenant
        const document = await tx.query.documents.findFirst({
          where: and(
            eq(documents.id, documentId),
            eq(documents.tenant_id, tenantId)
          ),
        });

        if (!document) {
          throw new Error('Document not found or access denied');
        }

        // Verify storage reference exists and belongs to tenant
        const storageRef = await tx.query.storageReferences.findFirst({
          where: and(
            eq(storageReferences.id, data.storageReferenceId),
            eq(storageReferences.tenant_id, tenantId)
          ),
        });

        if (!storageRef) {
          throw new Error('Storage reference not found or access denied');
        }

        // Get current version number
        const [latestVersion] = await tx
          .select({ version_number: documentVersions.version_number })
          .from(documentVersions)
          .where(eq(documentVersions.document_id, documentId))
          .orderBy(desc(documentVersions.version_number))
          .limit(1);

        const nextVersionNumber = (latestVersion?.version_number || 0) + 1;

        // Create new version
        const insertData: InsertDocumentVersion = {
          document_id: documentId,
          version_number: nextVersionNumber,
          storage_reference_id: data.storageReferenceId,
          created_by: data.createdBy,
          change_description: data.changeDescription,
        };

        const [version] = await tx.insert(documentVersions).values(insertData).returning();

        // Update document's updated_at timestamp
        await tx
          .update(documents)
          .set({ updated_at: new Date() })
          .where(eq(documents.id, documentId));

        return version;
      });

      return result;
    } catch (error) {
      console.error('Error creating document version:', error);
      throw new Error(`Failed to create document version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Link a document to an entity
   * @param documentId Document ID
   * @param data Link data
   * @returns Created entity link
   */
  async linkDocument(documentId: string, data: LinkDocumentData): Promise<EntityDocument> {
    const tenantId = getCurrentTenantId();

    try {
      // Verify document exists and belongs to tenant
      const document = await db.query.documents.findFirst({
        where: and(
          eq(documents.id, documentId),
          eq(documents.tenant_id, tenantId)
        ),
      });

      if (!document) {
        throw new Error('Document not found or access denied');
      }

      // Check if link already exists
      const existingLink = await db.query.entityDocuments.findFirst({
        where: and(
          eq(entityDocuments.document_id, documentId),
          eq(entityDocuments.entity_type, data.entityType),
          eq(entityDocuments.entity_id, data.entityId)
        ),
      });

      if (existingLink) {
        throw new Error('Document is already linked to this entity');
      }

      // Create entity link
      const insertData: InsertEntityDocument = {
        document_id: documentId,
        entity_type: data.entityType,
        entity_id: data.entityId,
        linked_by: data.linkedBy,
        link_type: data.linkType || 'attachment',
        description: data.description,
      };

      const [link] = await db.insert(entityDocuments).values(insertData).returning();

      return link;
    } catch (error) {
      console.error('Error linking document:', error);
      throw new Error(`Failed to link document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update document status
   * @param documentId Document ID
   * @param status New status
   * @returns Updated document
   */
  async updateDocumentStatus(documentId: string, status: 'draft' | 'pending' | 'approved' | 'requires_signature' | 'expired'): Promise<Document> {
    const tenantId = getCurrentTenantId();

    try {
      // Verify document exists and belongs to tenant
      const document = await db.query.documents.findFirst({
        where: and(
          eq(documents.id, documentId),
          eq(documents.tenant_id, tenantId)
        ),
      });

      if (!document) {
        throw new Error('Document not found or access denied');
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        draft: ['pending', 'requires_signature'],
        pending: ['approved', 'requires_signature', 'draft'],
        approved: ['expired', 'draft'],
        requires_signature: ['approved', 'pending', 'draft'],
        expired: ['draft'],
      };

      const allowedStatuses = validTransitions[document.status] || [];
      if (!allowedStatuses.includes(status)) {
        throw new Error(`Invalid status transition from ${document.status} to ${status}`);
      }

      // Update document
      const [updatedDocument] = await db
        .update(documents)
        .set({ 
          status,
          updated_at: new Date(),
        })
        .where(eq(documents.id, documentId))
        .returning();

      return updatedDocument;
    } catch (error) {
      console.error('Error updating document status:', error);
      throw new Error(`Failed to update document status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a document (soft delete)
   * @param documentId Document ID
   * @returns Success indicator
   */
  async deleteDocument(documentId: string): Promise<void> {
    const tenantId = getCurrentTenantId();

    try {
      // Verify document exists and belongs to tenant
      const document = await db.query.documents.findFirst({
        where: and(
          eq(documents.id, documentId),
          eq(documents.tenant_id, tenantId)
        ),
      });

      if (!document) {
        throw new Error('Document not found or access denied');
      }

      // Soft delete document
      await db
        .update(documents)
        .set({ deleted_at: new Date() })
        .where(eq(documents.id, documentId));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get documents linked to a specific entity
   * @param entityType Entity type
   * @param entityId Entity ID
   * @returns Linked documents
   */
  async getEntityDocuments(entityType: string, entityId: string): Promise<Document[]> {
    const tenantId = getCurrentTenantId();

    try {
      const linkedDocuments = await db.query.documents.findMany({
        where: and(
          eq(documents.tenant_id, tenantId),
          eq(entityDocuments.entity_type, entityType),
          eq(entityDocuments.entity_id, entityId)
        ),
        with: {
          entityDocuments: {
            where: and(
              eq(entityDocuments.entity_type, entityType),
              eq(entityDocuments.entity_id, entityId)
            ),
          },
        },
        orderBy: [desc(entityDocuments.linked_at)],
      });

      return linkedDocuments;
    } catch (error) {
      console.error('Error getting entity documents:', error);
      throw new Error(`Failed to get entity documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService();
