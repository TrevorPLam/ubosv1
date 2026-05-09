/**
 * @file        artifacts/api-server/src/tests/documents.test.ts
 * @module      API Server / Tests / Documents
 * @purpose     Integration tests for document upload and knowledge versioning
 *
 * @ai_instructions
 *   - Use Jest or similar testing framework
 *   - Test complete upload flow: pre-signed URL generation, document creation, versioning
 *   - Test knowledge entry creation and versioning with search functionality
 *   - Include authentication and tenant isolation tests
 *   - Mock external dependencies (S3/R2 storage)
 *   - Test error scenarios and edge cases
 *
 * @exports     Test suite for document and knowledge APIs
 * @imports     testing framework, services, mock data
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import request from 'supertest';
import { app } from '../app';
import { storageService } from '../lib/storage-service';
import { documentService } from '../lib/document-service';
import { knowledgeService } from '../lib/knowledge-service';
import { setRequestContext } from '../lib/tenant-context';

// Mock the storage service
jest.mock('../lib/storage-service');
const mockStorageService = storageService as jest.Mocked<typeof storageService>;

// Mock the document service
jest.mock('../lib/document-service');
const mockDocumentService = documentService as jest.Mocked<typeof documentService>;

// Mock the knowledge service
jest.mock('../lib/knowledge-service');
const mockKnowledgeService = knowledgeService as jest.Mocked<typeof knowledgeService>;

describe('Document and Knowledge APIs', () => {
  const tenantId = 'test-tenant-id';
  const userId = 'test-user-id';
  const authToken = 'Bearer test-token';

  beforeEach(() => {
    // Set up tenant context for all tests
    setRequestContext({
      tenantId,
      userId,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('File Upload Flow', () => {
    const testFile = {
      filename: 'test-document.pdf',
      mime_type: 'application/pdf',
      size_bytes: 1024 * 1024, // 1MB
    };

    it('should generate pre-signed upload URL', async () => {
      const mockUploadResult = {
        uploadUrl: 'https://test-bucket.s3.amazonaws.com/upload-key',
        storageKey: 'tenant/2025-01-01/test-document.pdf',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      };

      mockStorageService.generateUploadUrl.mockResolvedValue(mockUploadResult);

      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', authToken)
        .send(testFile)
        .expect(200);

      expect(response.body).toEqual({
        upload_url: mockUploadResult.uploadUrl,
        storage_key: mockUploadResult.storageKey,
        expires_at: mockUploadResult.expiresAt.toISOString(),
      });

      expect(mockStorageService.generateUploadUrl).toHaveBeenCalledWith(
        testFile.filename,
        testFile.mime_type,
        testFile.size_bytes,
        tenantId
      );
    });

    it('should reject invalid file types', async () => {
      const invalidFile = {
        filename: 'malware.exe',
        mime_type: 'application/x-executable',
        size_bytes: 1024,
      };

      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', authToken)
        .send(invalidFile)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('File type not allowed');
    });

    it('should reject oversized files', async () => {
      const oversizedFile = {
        filename: 'huge-file.pdf',
        mime_type: 'application/pdf',
        size_bytes: 200 * 1024 * 1024, // 200MB (exceeds 100MB limit)
      };

      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', authToken)
        .send(oversizedFile)
        .expect(422);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Document Management', () => {
    const testDocument = {
      name: 'Test Document',
      type: 'pdf' as const,
      access_level: 'private' as const,
      storage_reference_id: 'test-storage-id',
    };

    it('should create document with initial version', async () => {
      const mockDocumentResult = {
        document: {
          id: 'doc-123',
          tenant_id: tenantId,
          name: testDocument.name,
          type: testDocument.type,
          status: 'draft' as const,
          access_level: testDocument.access_level,
          owner_id: userId,
          created_at: new Date(),
          updated_at: new Date(),
          starred: false,
        },
        versions: [{
          id: 'version-123',
          document_id: 'doc-123',
          version_number: 1,
          storage_reference_id: testDocument.storage_reference_id,
          created_by: userId,
          created_at: new Date(),
        }],
        linkedEntities: [],
      };

      mockDocumentService.createDocument.mockResolvedValue(mockDocumentResult);

      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', authToken)
        .send(testDocument)
        .expect(201);

      expect(response.body).toEqual({
        document: mockDocumentResult.document,
        versions: mockDocumentResult.versions,
        linked_entities: mockDocumentResult.linkedEntities,
      });

      expect(mockDocumentService.createDocument).toHaveBeenCalledWith({
        name: testDocument.name,
        type: testDocument.type,
        accessLevel: testDocument.access_level,
        storageReferenceId: testDocument.storage_reference_id,
        ownerId: userId,
      });
    });

    it('should list documents with pagination', async () => {
      const mockListResult = {
        documents: [{
          id: 'doc-123',
          name: 'Test Document',
          type: 'pdf' as const,
          status: 'draft' as const,
          created_at: new Date(),
        }],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      mockDocumentService.listDocuments.mockResolvedValue(mockListResult);

      const response = await request(app)
        .get('/api/documents')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toEqual({
        documents: mockListResult.documents,
        pagination: mockListResult.pagination,
      });
    });

    it('should create new document version', async () => {
      const mockVersion = {
        id: 'version-456',
        document_id: 'doc-123',
        version_number: 2,
        storage_reference_id: 'new-storage-id',
        created_by: userId,
        created_at: new Date(),
      };

      mockDocumentService.createDocumentVersion.mockResolvedValue(mockVersion);

      const versionData = {
        storage_reference_id: 'new-storage-id',
        change_description: 'Updated content',
      };

      const response = await request(app)
        .post('/api/documents/doc-123/versions')
        .set('Authorization', authToken)
        .send(versionData)
        .expect(201);

      expect(response.body).toEqual(mockVersion);

      expect(mockDocumentService.createDocumentVersion).toHaveBeenCalledWith(
        'doc-123',
        {
          storageReferenceId: versionData.storage_reference_id,
          changeDescription: versionData.change_description,
          createdBy: userId,
        }
      );
    });

    it('should link document to entity', async () => {
      const mockLink = {
        id: 'link-123',
        document_id: 'doc-123',
        entity_type: 'client',
        entity_id: 'client-456',
        linked_by: userId,
        link_type: 'attachment',
        linked_at: new Date(),
      };

      mockDocumentService.linkDocument.mockResolvedValue(mockLink);

      const linkData = {
        entity_type: 'client',
        entity_id: 'client-456',
        link_type: 'reference',
        description: 'Client contract',
      };

      const response = await request(app)
        .post('/api/documents/doc-123/link')
        .set('Authorization', authToken)
        .send(linkData)
        .expect(201);

      expect(response.body).toEqual(mockLink);

      expect(mockDocumentService.linkDocument).toHaveBeenCalledWith(
        'doc-123',
        {
          entityType: linkData.entity_type,
          entityId: linkData.entity_id,
          linkType: linkData.link_type,
          description: linkData.description,
          linkedBy: userId,
        }
      );
    });
  });

  describe('Knowledge Management', () => {
    const testKnowledge = {
      title: 'Test SOP',
      content: 'This is test content for a standard operating procedure',
      category: 'sop' as const,
      role: 'manager',
      department: 'operations',
    };

    it('should create knowledge entry with initial version', async () => {
      const mockKnowledgeResult = {
        entry: {
          id: 'knowledge-123',
          tenant_id: tenantId,
          title: testKnowledge.title,
          content: testKnowledge.content,
          category: testKnowledge.category,
          status: 'draft' as const,
          role: testKnowledge.role,
          department: testKnowledge.department,
          author_id: userId,
          version_number: 1,
          view_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
        versions: [{
          id: 'version-123',
          knowledge_entry_id: 'knowledge-123',
          version_number: 1,
          content: testKnowledge.content,
          edited_by: userId,
          created_at: new Date(),
        }],
      };

      mockKnowledgeService.createKnowledge.mockResolvedValue(mockKnowledgeResult);

      const response = await request(app)
        .post('/api/knowledge')
        .set('Authorization', authToken)
        .send(testKnowledge)
        .expect(201);

      expect(response.body).toEqual({
        entry: mockKnowledgeResult.entry,
        versions: mockKnowledgeResult.versions,
      });

      expect(mockKnowledgeService.createKnowledge).toHaveBeenCalledWith({
        title: testKnowledge.title,
        content: testKnowledge.content,
        category: testKnowledge.category,
        role: testKnowledge.role,
        department: testKnowledge.department,
        authorId: userId,
      });
    });

    it('should search knowledge entries', async () => {
      const mockSearchResult = {
        results: [{
          entry: {
            id: 'knowledge-123',
            title: 'Test SOP',
            content: 'This is test content',
            category: 'sop' as const,
          },
          snippet: 'This is <mark>test</mark> content',
          score: 0.95,
        }],
        total: 1,
      };

      mockKnowledgeService.searchKnowledge.mockResolvedValue(mockSearchResult);

      const response = await request(app)
        .get('/api/knowledge/search?q=test')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toEqual({
        results: mockSearchResult.results,
        total: mockSearchResult.total,
      });

      expect(mockKnowledgeService.searchKnowledge).toHaveBeenCalledWith('test', {});
    });

    it('should update knowledge entry creating new version', async () => {
      const mockUpdateResult = {
        entry: {
          id: 'knowledge-123',
          title: 'Updated SOP',
          content: 'Updated content',
          category: 'sop' as const,
          status: 'published' as const,
          version_number: 2,
          updated_at: new Date(),
        },
        versions: [{
          id: 'version-456',
          knowledge_entry_id: 'knowledge-123',
          version_number: 2,
          content: 'Updated content',
          edited_by: userId,
          created_at: new Date(),
        }],
      };

      mockKnowledgeService.updateKnowledge.mockResolvedValue(mockUpdateResult);

      const updateData = {
        title: 'Updated SOP',
        content: 'Updated content',
        status: 'published' as const,
        change_summary: 'Updated for publication',
      };

      const response = await request(app)
        .patch('/api/knowledge/knowledge-123')
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        entry: mockUpdateResult.entry,
        versions: mockUpdateResult.versions,
      });

      expect(mockKnowledgeService.updateKnowledge).toHaveBeenCalledWith(
        'knowledge-123',
        {
          title: updateData.title,
          content: updateData.content,
          status: updateData.status,
          changeSummary: updateData.change_summary,
          editedBy: userId,
        }
      );
    });

    it('should increment view count when accessing knowledge entry', async () => {
      const mockKnowledgeDetail = {
        entry: {
          id: 'knowledge-123',
          title: 'Test SOP',
          content: 'This is test content',
          view_count: 5,
        },
        versions: [],
      };

      mockKnowledgeService.getKnowledge.mockResolvedValue(mockKnowledgeDetail);
      mockKnowledgeService.incrementViewCount.mockResolvedValue();

      await request(app)
        .get('/api/knowledge/knowledge-123')
        .set('Authorization', authToken)
        .expect(200);

      expect(mockKnowledgeService.incrementViewCount).toHaveBeenCalledWith('knowledge-123');
    });
  });

  describe('Certification Management', () => {
    const testCertification = {
      employee_id: 'employee-123',
      certification_name: 'Project Management Professional',
      issuing_body: 'PMI',
      issued_at: '2024-01-15T00:00:00.000Z',
      expires_at: '2025-01-15T00:00:00.000Z',
    };

    it('should create certification record', async () => {
      const mockCertification = {
        id: 'cert-123',
        tenant_id: tenantId,
        employee_id: testCertification.employee_id,
        certification_name: testCertification.certification_name,
        issuing_body: testCertification.issuing_body,
        issued_at: new Date(testCertification.issued_at),
        expires_at: new Date(testCertification.expires_at),
        status: 'pending' as const,
        renewal_reminder_sent: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockKnowledgeService.createCertification.mockResolvedValue(mockCertification);

      const response = await request(app)
        .post('/api/knowledge/certifications')
        .set('Authorization', authToken)
        .send(testCertification)
        .expect(201);

      expect(response.body).toEqual(mockCertification);

      expect(mockKnowledgeService.createCertification).toHaveBeenCalledWith({
        employeeId: testCertification.employee_id,
        certificationName: testCertification.certification_name,
        issuingBody: testCertification.issuing_body,
        issuedAt: new Date(testCertification.issued_at),
        expiresAt: new Date(testCertification.expires_at),
      });
    });

    it('should list certifications with filters', async () => {
      const mockCertListResult = {
        certifications: [{
          id: 'cert-123',
          employee_id: 'employee-123',
          certification_name: 'PMP',
          status: 'compliant' as const,
        }],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      mockKnowledgeService.listCertifications.mockResolvedValue(mockCertListResult);

      const response = await request(app)
        .get('/api/knowledge/certifications?employee_id=employee-123')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toEqual({
        certifications: mockCertListResult.certifications,
        pagination: mockCertListResult.pagination,
      });

      expect(mockKnowledgeService.listCertifications).toHaveBeenCalledWith(
        { employeeId: 'employee-123' },
        { page: 1, limit: 20 }
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent document', async () => {
      mockDocumentService.getDocument.mockRejectedValue(new Error('Document not found'));

      const response = await request(app)
        .get('/api/documents/non-existent')
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Document not found');
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .get('/api/documents')
        .expect(401);

      await request(app)
        .post('/api/files/upload')
        .send({ filename: 'test.pdf', mime_type: 'application/pdf', size_bytes: 1024 })
        .expect(401);
    });

    it('should handle storage service errors gracefully', async () => {
      mockStorageService.generateUploadUrl.mockRejectedValue(new Error('S3 service unavailable'));

      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', authToken)
        .send({
          filename: 'test.pdf',
          mime_type: 'application/pdf',
          size_bytes: 1024,
        })
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.message).toBe('Failed to generate upload URL');
    });
  });
});
