/**
 * @file        lib/db/src/tests/document-knowledge-schema.test.ts
 * @module      Database / Tests / Document & Knowledge Schema
 * @purpose     Integration tests for document and knowledge management schema constraints and business rules
 *
 * @ai_instructions
 *   - These tests verify document and knowledge schema constraints, foreign keys, and business rules.
 *   - Tests should cover version chaining, polymorphic linking, tenant isolation, and data integrity.
 *   - All tests require a test database with document and knowledge schema tables set up.
 *   - DO NOT run these tests against production databases.
 *
 * @exports     Integration tests for document and knowledge schemas
 * @imports     @workspace/db, test utilities
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

// Note: This test file requires vitest to be installed
// import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db, pool, setTenantContext, clearTenantContext, withTenantContext } from "../index";
import { tenantsTable } from "../schema/tenants";
import { documents, documentVersions, storageReferences, entityDocuments } from "../schema/documents";
import { knowledgeEntries, knowledgeVersions, certificationRecords } from "../schema/knowledge";
import { sql } from "drizzle-orm";

// Test data setup
const testTenants = [
  { id: "tenant-doc-1", name: "Document Tenant A", subdomain: "doc-a" },
  { id: "tenant-doc-2", name: "Document Tenant B", subdomain: "doc-b" },
];

const testDocuments = [
  { id: "doc-1", name: "Contract Agreement.pdf", type: "pdf", description: "Legal contract document" },
  { id: "doc-2", name: "Project Plan.xlsx", type: "spreadsheet", description: "Project planning spreadsheet" },
];

const testStorageReferences = [
  { id: "storage-1", bucket: "documents", key: "contracts/contract-1.pdf", originalFilename: "Contract Agreement.pdf" },
  { id: "storage-2", bucket: "documents", key: "plans/project-plan-1.xlsx", originalFilename: "Project Plan.xlsx" },
];

const testKnowledgeEntries = [
  { id: "knowledge-1", title: "Employee Onboarding SOP", content: "Standard operating procedure for onboarding new employees", category: "sop" },
  { id: "knowledge-2", title: "Security Best Practices", content: "Guidelines for maintaining security standards", category: "best_practice" },
];

const testCertifications = [
  { id: "cert-1", certificationName: "AWS Certified Solutions Architect", issuingBody: "Amazon Web Services" },
  { id: "cert-2", certificationName: "PMP Certification", issuingBody: "Project Management Institute" },
];

// Note: The following test suite requires a test framework like vitest or jest
// This file serves as documentation for integration tests that should be implemented
// when the test framework is set up

/*
describe("Document & Knowledge Schema Tests", () => {
  beforeEach(async () => {
    // Clean up any existing test data
    await pool.query("DELETE FROM entity_documents");
    await pool.query("DELETE FROM document_versions");
    await pool.query("DELETE FROM documents");
    await pool.query("DELETE FROM storage_references");
    await pool.query("DELETE FROM knowledge_versions");
    await pool.query("DELETE FROM knowledge_entries");
    await pool.query("DELETE FROM certification_records");
    await pool.query("DELETE FROM tenants WHERE subdomain LIKE 'doc-%'");
    
    // Insert test tenants
    for (const tenant of testTenants) {
      await db.insert(tenantsTable).values(tenant);
    }
  });

  afterEach(async () => {
    await clearTenantContext();
    await pool.query("DELETE FROM entity_documents");
    await pool.query("DELETE FROM document_versions");
    await pool.query("DELETE FROM documents");
    await pool.query("DELETE FROM storage_references");
    await pool.query("DELETE FROM knowledge_versions");
    await pool.query("DELETE FROM knowledge_entries");
    await pool.query("DELETE FROM certification_records");
    await pool.query("DELETE FROM tenants WHERE subdomain LIKE 'doc-%'");
  });

  describe("Storage References Schema", () => {
    it("should create storage references with valid data", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const storageRef = testStorageReferences[0];
        await db.insert(storageReferences).values({
          ...storageRef,
          mimeType: "application/pdf",
          sizeBytes: 1024000,
        });
        
        const result = await db.select().from(storageReferences).where(storageReferences.id.eq(storageRef.id));
        expect(result).toHaveLength(1);
        expect(result[0].bucket).toBe(storageRef.bucket);
        expect(result[0].key).toBe(storageRef.key);
        expect(result[0].tenantId).toBe(testTenants[0].id);
      });
    });

    it("should enforce unique bucket + key constraint", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const storageRef = {
          ...testStorageReferences[0],
          mimeType: "application/pdf",
          sizeBytes: 1024000,
        };
        
        // Insert first storage reference
        await db.insert(storageReferences).values(storageRef);
        
        // Should fail to insert another storage reference with same bucket + key
        await expect(
          db.insert(storageReferences).values({ ...storageRef, id: "storage-duplicate" })
        ).rejects.toThrow();
      });
    });

    it("should allow same bucket + key in different tenants", async () => {
      // Insert storage reference in first tenant
      await withTenantContext(testTenants[0].id, async () => {
        await db.insert(storageReferences).values({
          ...testStorageReferences[0],
          mimeType: "application/pdf",
          sizeBytes: 1024000,
        });
      });
      
      // Should be able to insert storage reference with same bucket + key in second tenant
      await withTenantContext(testTenants[1].id, async () => {
        await db.insert(storageReferences).values({
          ...testStorageReferences[0],
          mimeType: "application/pdf",
          sizeBytes: 1024000,
        });
        
        const result = await db.select().from(storageReferences);
        expect(result).toHaveLength(1); // Only sees own tenant's storage reference
      });
    });
  });

  describe("Documents Schema", () => {
    beforeEach(async () => {
      // Set up test storage references
      await withTenantContext(testTenants[0].id, async () => {
        await db.insert(storageReferences).values({
          ...testStorageReferences[0],
          mimeType: "application/pdf",
          sizeBytes: 1024000,
        });
        await db.insert(storageReferences).values({
          ...testStorageReferences[1],
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          sizeBytes: 2048000,
        });
      });
    });

    it("should create documents with valid data", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const document = testDocuments[0];
        await db.insert(documents).values({
          ...document,
          ownerId: "user-1",
        });
        
        const result = await db.select().from(documents).where(documents.id.eq(document.id));
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe(document.name);
        expect(result[0].type).toBe(document.type);
        expect(result[0].status).toBe("draft"); // Default status
        expect(result[0].accessLevel).toBe("private"); // Default access level
        expect(result[0].starred).toBe(false); // Default value
        expect(result[0].tenantId).toBe(testTenants[0].id);
      });
    });

    it("should enforce valid document type values", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const document = { 
          ...testDocuments[0], 
          type: "invalid_type" as any,
          ownerId: "user-1"
        };
        
        await expect(db.insert(documents).values(document)).rejects.toThrow();
      });
    });

    it("should enforce valid document status values", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const document = { 
          ...testDocuments[0], 
          status: "invalid_status" as any,
          ownerId: "user-1"
        };
        
        await expect(db.insert(documents).values(document)).rejects.toThrow();
      });
    });

    it("should enforce valid access level values", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const document = { 
          ...testDocuments[0], 
          accessLevel: "invalid_access" as any,
          ownerId: "user-1"
        };
        
        await expect(db.insert(documents).values(document)).rejects.toThrow();
      });
    });
  });

  describe("Document Versions Schema", () => {
    beforeEach(async () => {
      // Set up test storage references and documents
      await withTenantContext(testTenants[0].id, async () => {
        await db.insert(storageReferences).values({
          ...testStorageReferences[0],
          mimeType: "application/pdf",
          sizeBytes: 1024000,
        });
        await db.insert(storageReferences).values({
          ...testStorageReferences[1],
          mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          sizeBytes: 2048000,
        });
        await db.insert(documents).values({
          ...testDocuments[0],
          ownerId: "user-1",
        });
      });
    });

    it("should create document versions with valid data", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const version = {
          documentId: testDocuments[0].id,
          versionNumber: 1,
          storageReferenceId: testStorageReferences[0].id,
          createdBy: "user-1",
        };
        
        await db.insert(documentVersions).values(version);
        
        const result = await db.select().from(documentVersions).where(documentVersions.documentId.eq(version.documentId));
        expect(result).toHaveLength(1);
        expect(result[0].versionNumber).toBe(version.versionNumber);
        expect(result[0].storageReferenceId).toBe(version.storageReferenceId);
        expect(result[0].createdBy).toBe(version.createdBy);
      });
    });

    it("should enforce unique document + version number constraint", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const version = {
          documentId: testDocuments[0].id,
          versionNumber: 1,
          storageReferenceId: testStorageReferences[0].id,
          createdBy: "user-1",
        };
        
        // Insert first version
        await db.insert(documentVersions).values(version);
        
        // Should fail to insert another version with same document + version number
        await expect(
          db.insert(documentVersions).values({ ...version, id: "version-duplicate" })
        ).rejects.toThrow();
      });
    });

    it("should allow sequential version numbers for the same document", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        // Insert first version
        await db.insert(documentVersions).values({
          documentId: testDocuments[0].id,
          versionNumber: 1,
          storageReferenceId: testStorageReferences[0].id,
          createdBy: "user-1",
        });
        
        // Should be able to insert version 2
        await db.insert(documentVersions).values({
          documentId: testDocuments[0].id,
          versionNumber: 2,
          storageReferenceId: testStorageReferences[1].id,
          createdBy: "user-1",
        });
        
        const result = await db.select().from(documentVersions).where(documentVersions.documentId.eq(testDocuments[0].id));
        expect(result).toHaveLength(2);
        expect(result.map(v => v.versionNumber).sort()).toEqual([1, 2]);
      });
    });

    it("should enforce foreign key constraint to documents", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const version = {
          documentId: "non-existent-document",
          versionNumber: 1,
          storageReferenceId: testStorageReferences[0].id,
          createdBy: "user-1",
        };
        
        await expect(db.insert(documentVersions).values(version)).rejects.toThrow();
      });
    });

    it("should enforce foreign key constraint to storage references", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const version = {
          documentId: testDocuments[0].id,
          versionNumber: 1,
          storageReferenceId: "non-existent-storage",
          createdBy: "user-1",
        };
        
        await expect(db.insert(documentVersions).values(version)).rejects.toThrow();
      });
    });

    it("should cascade delete versions when document is deleted", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        // Insert version
        await db.insert(documentVersions).values({
          documentId: testDocuments[0].id,
          versionNumber: 1,
          storageReferenceId: testStorageReferences[0].id,
          createdBy: "user-1",
        });
        
        // Verify version exists
        const beforeDelete = await db.select().from(documentVersions).where(documentVersions.documentId.eq(testDocuments[0].id));
        expect(beforeDelete).toHaveLength(1);
        
        // Delete document
        await db.delete(documents).where(documents.id.eq(testDocuments[0].id));
        
        // Version should be deleted due to cascade
        const afterDelete = await db.select().from(documentVersions).where(documentVersions.documentId.eq(testDocuments[0].id));
        expect(afterDelete).toHaveLength(0);
      });
    });
  });

  describe("Entity Documents Polymorphic Linking", () => {
    beforeEach(async () => {
      // Set up test documents
      await withTenantContext(testTenants[0].id, async () => {
        await db.insert(storageReferences).values({
          ...testStorageReferences[0],
          mimeType: "application/pdf",
          sizeBytes: 1024000,
        });
        await db.insert(documents).values({
          ...testDocuments[0],
          ownerId: "user-1",
        });
        await db.insert(documents).values({
          ...testDocuments[1],
          ownerId: "user-1",
        });
      });
    });

    it("should create polymorphic links to different entity types", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        // Link document to a client
        await db.insert(entityDocuments).values({
          documentId: testDocuments[0].id,
          entityType: "client",
          entityId: "client-1",
          linkedBy: "user-1",
          linkType: "attachment",
        });
        
        // Link document to a project
        await db.insert(entityDocuments).values({
          documentId: testDocuments[1].id,
          entityType: "project",
          entityId: "project-1",
          linkedBy: "user-1",
          linkType: "reference",
        });
        
        const result = await db.select().from(entityDocuments);
        expect(result).toHaveLength(2);
        expect(result[0].entityType).toBe("client");
        expect(result[1].entityType).toBe("project");
      });
    });

    it("should prevent duplicate entity-document links", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const link = {
          documentId: testDocuments[0].id,
          entityType: "client",
          entityId: "client-1",
          linkedBy: "user-1",
          linkType: "attachment",
        };
        
        // Insert first link
        await db.insert(entityDocuments).values(link);
        
        // Should fail to insert the same link again
        await expect(db.insert(entityDocuments).values(link)).rejects.toThrow();
      });
    });

    it("should allow the same document to be linked to different entities", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        // Link document to first client
        await db.insert(entityDocuments).values({
          documentId: testDocuments[0].id,
          entityType: "client",
          entityId: "client-1",
          linkedBy: "user-1",
          linkType: "attachment",
        });
        
        // Should be able to link same document to different client
        await db.insert(entityDocuments).values({
          documentId: testDocuments[0].id,
          entityType: "client",
          entityId: "client-2",
          linkedBy: "user-1",
          linkType: "attachment",
        });
        
        const result = await db.select().from(entityDocuments).where(entityDocuments.documentId.eq(testDocuments[0].id));
        expect(result).toHaveLength(2);
      });
    });

    it("should cascade delete entity links when document is deleted", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        // Insert entity link
        await db.insert(entityDocuments).values({
          documentId: testDocuments[0].id,
          entityType: "client",
          entityId: "client-1",
          linkedBy: "user-1",
          linkType: "attachment",
        });
        
        // Verify link exists
        const beforeDelete = await db.select().from(entityDocuments).where(entityDocuments.documentId.eq(testDocuments[0].id));
        expect(beforeDelete).toHaveLength(1);
        
        // Delete document
        await db.delete(documents).where(documents.id.eq(testDocuments[0].id));
        
        // Entity link should be deleted due to cascade
        const afterDelete = await db.select().from(entityDocuments).where(entityDocuments.documentId.eq(testDocuments[0].id));
        expect(afterDelete).toHaveLength(0);
      });
    });
  });

  describe("Knowledge Entries Schema", () => {
    it("should create knowledge entries with valid data", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const entry = testKnowledgeEntries[0];
        await db.insert(knowledgeEntries).values({
          ...entry,
          authorId: "user-1",
        });
        
        const result = await db.select().from(knowledgeEntries).where(knowledgeEntries.id.eq(entry.id));
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe(entry.title);
        expect(result[0].category).toBe(entry.category);
        expect(result[0].status).toBe("draft"); // Default status
        expect(result[0].versionNumber).toBe(1); // Default version
        expect(result[0].isTemplate).toBe(false); // Default value
        expect(result[0].viewCount).toBe(0); // Default value
        expect(result[0].tenantId).toBe(testTenants[0].id);
      });
    });

    it("should enforce valid knowledge category values", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const entry = { 
          ...testKnowledgeEntries[0], 
          category: "invalid_category" as any,
          authorId: "user-1"
        };
        
        await expect(db.insert(knowledgeEntries).values(entry)).rejects.toThrow();
      });
    });

    it("should enforce valid knowledge status values", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const entry = { 
          ...testKnowledgeEntries[0], 
          status: "invalid_status" as any,
          authorId: "user-1"
        };
        
        await expect(db.insert(knowledgeEntries).values(entry)).rejects.toThrow();
      });
    });

    it("should support hierarchical knowledge organization", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        // Insert parent entry
        await db.insert(knowledgeEntries).values({
          ...testKnowledgeEntries[0],
          authorId: "user-1",
        });
        
        // Insert child entry with parent reference
        await db.insert(knowledgeEntries).values({
          ...testKnowledgeEntries[1],
          parentEntryId: testKnowledgeEntries[0].id,
          authorId: "user-1",
        });
        
        const result = await db.select().from(knowledgeEntries).where(knowledgeEntries.parentEntryId.eq(testKnowledgeEntries[0].id));
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe(testKnowledgeEntries[1].title);
      });
    });
  });

  describe("Knowledge Versions Schema", () => {
    beforeEach(async () => {
      // Set up test knowledge entries
      await withTenantContext(testTenants[0].id, async () => {
        await db.insert(knowledgeEntries).values({
          ...testKnowledgeEntries[0],
          authorId: "user-1",
        });
      });
    });

    it("should create knowledge versions with valid data", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const version = {
          knowledgeEntryId: testKnowledgeEntries[0].id,
          versionNumber: 1,
          content: "Updated content for version 1",
          editedBy: "user-1",
        };
        
        await db.insert(knowledgeVersions).values(version);
        
        const result = await db.select().from(knowledgeVersions).where(knowledgeVersions.knowledgeEntryId.eq(version.knowledgeEntryId));
        expect(result).toHaveLength(1);
        expect(result[0].versionNumber).toBe(version.versionNumber);
        expect(result[0].content).toBe(version.content);
        expect(result[0].editedBy).toBe(version.editedBy);
        expect(result[0].reviewStatus).toBe("pending"); // Default status
      });
    });

    it("should enforce unique knowledge entry + version number constraint", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const version = {
          knowledgeEntryId: testKnowledgeEntries[0].id,
          versionNumber: 1,
          content: "Version 1 content",
          editedBy: "user-1",
        };
        
        // Insert first version
        await db.insert(knowledgeVersions).values(version);
        
        // Should fail to insert another version with same entry + version number
        await expect(
          db.insert(knowledgeVersions).values({ ...version, id: "version-duplicate" })
        ).rejects.toThrow();
      });
    });

    it("should allow sequential version numbers for the same knowledge entry", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        // Insert first version
        await db.insert(knowledgeVersions).values({
          knowledgeEntryId: testKnowledgeEntries[0].id,
          versionNumber: 1,
          content: "Version 1 content",
          editedBy: "user-1",
        });
        
        // Should be able to insert version 2
        await db.insert(knowledgeVersions).values({
          knowledgeEntryId: testKnowledgeEntries[0].id,
          versionNumber: 2,
          content: "Version 2 content",
          editedBy: "user-1",
        });
        
        const result = await db.select().from(knowledgeVersions).where(knowledgeVersions.knowledgeEntryId.eq(testKnowledgeEntries[0].id));
        expect(result).toHaveLength(2);
        expect(result.map(v => v.versionNumber).sort()).toEqual([1, 2]);
      });
    });

    it("should enforce foreign key constraint to knowledge entries", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const version = {
          knowledgeEntryId: "non-existent-knowledge",
          versionNumber: 1,
          content: "Version content",
          editedBy: "user-1",
        };
        
        await expect(db.insert(knowledgeVersions).values(version)).rejects.toThrow();
      });
    });

    it("should cascade delete versions when knowledge entry is deleted", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        // Insert version
        await db.insert(knowledgeVersions).values({
          knowledgeEntryId: testKnowledgeEntries[0].id,
          versionNumber: 1,
          content: "Version 1 content",
          editedBy: "user-1",
        });
        
        // Verify version exists
        const beforeDelete = await db.select().from(knowledgeVersions).where(knowledgeVersions.knowledgeEntryId.eq(testKnowledgeEntries[0].id));
        expect(beforeDelete).toHaveLength(1);
        
        // Delete knowledge entry
        await db.delete(knowledgeEntries).where(knowledgeEntries.id.eq(testKnowledgeEntries[0].id));
        
        // Version should be deleted due to cascade
        const afterDelete = await db.select().from(knowledgeVersions).where(knowledgeVersions.knowledgeEntryId.eq(testKnowledgeEntries[0].id));
        expect(afterDelete).toHaveLength(0);
      });
    });
  });

  describe("Certification Records Schema", () => {
    it("should create certification records with valid data", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const certification = {
          ...testCertifications[0],
          employeeId: "employee-1",
          issuedAt: new Date("2024-01-15"),
          status: "compliant" as const,
          cost: 15000, // $150.00 in cents
          currency: "USD",
        };
        
        await db.insert(certificationRecords).values(certification);
        
        const result = await db.select().from(certificationRecords).where(certificationRecords.id.eq(certification.id));
        expect(result).toHaveLength(1);
        expect(result[0].certificationName).toBe(certification.certificationName);
        expect(result[0].issuingBody).toBe(certification.issuingBody);
        expect(result[0].status).toBe(certification.status);
        expect(result[0].cost).toBe(certification.cost);
        expect(result[0].currency).toBe(certification.currency);
        expect(result[0].tenantId).toBe(testTenants[0].id);
      });
    });

    it("should enforce valid certification status values", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const certification = { 
          ...testCertifications[0], 
          employeeId: "employee-1",
          issuedAt: new Date("2024-01-15"),
          status: "invalid_status" as any,
        };
        
        await expect(db.insert(certificationRecords).values(certification)).rejects.toThrow();
      });
    });

    it("should prevent duplicate certifications for same employee, name, and issuing body", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const certification = {
          ...testCertifications[0],
          employeeId: "employee-1",
          issuedAt: new Date("2024-01-15"),
          status: "compliant" as const,
        };
        
        // Insert first certification
        await db.insert(certificationRecords).values(certification);
        
        // Should fail to insert the same certification again
        await expect(
          db.insert(certificationRecords).values({ ...certification, id: "cert-duplicate" })
        ).rejects.toThrow();
      });
    });

    it("should allow same certification for different employees", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const certData = {
          ...testCertifications[0],
          issuedAt: new Date("2024-01-15"),
          status: "compliant" as const,
        };
        
        // Insert certification for first employee
        await db.insert(certificationRecords).values({
          ...certData,
          employeeId: "employee-1",
        });
        
        // Should be able to insert same certification for different employee
        await db.insert(certificationRecords).values({
          ...certData,
          employeeId: "employee-2",
          id: "cert-2",
        });
        
        const result = await db.select().from(certificationRecords).where(certificationRecords.certificationName.eq(testCertifications[0].certificationName));
        expect(result).toHaveLength(2);
      });
    });
  });

  describe("Cross-Tenant Isolation", () => {
    beforeEach(async () => {
      // Set up documents and knowledge entries in both tenants
      for (let i = 0; i < testTenants.length; i++) {
        await withTenantContext(testTenants[i].id, async () => {
          // Set up storage references
          await db.insert(storageReferences).values({
            ...testStorageReferences[i],
            mimeType: "application/pdf",
            sizeBytes: 1024000,
          });
          
          // Set up documents
          await db.insert(documents).values({
            ...testDocuments[i],
            ownerId: "user-1",
          });
          
          // Set up knowledge entries
          await db.insert(knowledgeEntries).values({
            ...testKnowledgeEntries[i],
            authorId: "user-1",
          });
        });
      }
    });

    it("should prevent cross-tenant document access", async () => {
      // Set context to first tenant
      await setTenantContext(testTenants[0].id);
      
      // Should only see first tenant's documents
      const result = await db.select().from(documents);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(testDocuments[0].name);
      
      // Switch to second tenant
      await setTenantContext(testTenants[1].id);
      
      // Should only see second tenant's documents
      const tenantBResult = await db.select().from(documents);
      expect(tenantBResult).toHaveLength(1);
      expect(tenantBResult[0].name).toBe(testDocuments[1].name);
    });

    it("should prevent cross-tenant knowledge entry access", async () => {
      // Set context to first tenant
      await setTenantContext(testTenants[0].id);
      
      // Should only see first tenant's knowledge entries
      const result = await db.select().from(knowledgeEntries);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe(testKnowledgeEntries[0].title);
      
      // Switch to second tenant
      await setTenantContext(testTenants[1].id);
      
      // Should only see second tenant's knowledge entries
      const tenantBResult = await db.select().from(knowledgeEntries);
      expect(tenantBResult).toHaveLength(1);
      expect(tenantBResult[0].title).toBe(testKnowledgeEntries[1].title);
    });
  });

  describe("Version Chaining Tests", () => {
    it("should maintain document version chain integrity", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        // Set up storage references and document
        await db.insert(storageReferences).values({
          ...testStorageReferences[0],
          mimeType: "application/pdf",
          sizeBytes: 1024000,
        });
        await db.insert(storageReferences).values({
          ...testStorageReferences[1],
          mimeType: "application/pdf",
          sizeBytes: 2048000,
        });
        
        await db.insert(documents).values({
          ...testDocuments[0],
          ownerId: "user-1",
        });
        
        // Create version chain
        const versions = [
          { versionNumber: 1, storageReferenceId: testStorageReferences[0].id },
          { versionNumber: 2, storageReferenceId: testStorageReferences[1].id },
        ];
        
        for (const version of versions) {
          await db.insert(documentVersions).values({
            documentId: testDocuments[0].id,
            ...version,
            createdBy: "user-1",
          });
        }
        
        // Verify version chain
        const result = await db.select().from(documentVersions)
          .where(documentVersions.documentId.eq(testDocuments[0].id))
          .orderBy(documentVersions.versionNumber);
        
        expect(result).toHaveLength(2);
        expect(result[0].versionNumber).toBe(1);
        expect(result[1].versionNumber).toBe(2);
        expect(result[0].storageReferenceId).toBe(testStorageReferences[0].id);
        expect(result[1].storageReferenceId).toBe(testStorageReferences[1].id);
      });
    });

    it("should maintain knowledge version chain integrity", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        // Set up knowledge entry
        await db.insert(knowledgeEntries).values({
          ...testKnowledgeEntries[0],
          authorId: "user-1",
        });
        
        // Create version chain
        const versions = [
          { versionNumber: 1, content: "Initial content" },
          { versionNumber: 2, content: "Updated content" },
          { versionNumber: 3, content: "Final content" },
        ];
        
        for (const version of versions) {
          await db.insert(knowledgeVersions).values({
            knowledgeEntryId: testKnowledgeEntries[0].id,
            ...version,
            editedBy: "user-1",
          });
        }
        
        // Verify version chain
        const result = await db.select().from(knowledgeVersions)
          .where(knowledgeVersions.knowledgeEntryId.eq(testKnowledgeEntries[0].id))
          .orderBy(knowledgeVersions.versionNumber);
        
        expect(result).toHaveLength(3);
        expect(result.map(v => v.versionNumber)).toEqual([1, 2, 3]);
        expect(result.map(v => v.content)).toEqual([
          "Initial content",
          "Updated content", 
          "Final content"
        ]);
      });
    });
  });

  describe("Polymorphic Linking Tests", () => {
    beforeEach(async () => {
      // Set up test documents
      await withTenantContext(testTenants[0].id, async () => {
        await db.insert(storageReferences).values({
          ...testStorageReferences[0],
          mimeType: "application/pdf",
          sizeBytes: 1024000,
        });
        await db.insert(documents).values({
          ...testDocuments[0],
          ownerId: "user-1",
        });
      });
    });

    it("should support linking documents to multiple entity types", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        const entityLinks = [
          { entityType: "client", entityId: "client-1" },
          { entityType: "project", entityId: "project-1" },
          { entityType: "task", entityId: "task-1" },
          { entityType: "employee", entityId: "employee-1" },
          { entityType: "agreement", entityId: "agreement-1" },
        ];
        
        // Link document to multiple entity types
        for (const link of entityLinks) {
          await db.insert(entityDocuments).values({
            documentId: testDocuments[0].id,
            ...link,
            linkedBy: "user-1",
            linkType: "attachment",
          });
        }
        
        // Verify all links exist
        const result = await db.select().from(entityDocuments).where(entityDocuments.documentId.eq(testDocuments[0].id));
        expect(result).toHaveLength(5);
        
        // Verify each entity type is represented
        const entityTypes = result.map(r => r.entityType).sort();
        expect(entityTypes).toEqual(["agreement", "client", "employee", "project", "task"]);
      });
    });

    it("should support finding documents by entity type and ID", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        // Link document to specific entity
        await db.insert(entityDocuments).values({
          documentId: testDocuments[0].id,
          entityType: "project",
          entityId: "project-1",
          linkedBy: "user-1",
          linkType: "reference",
        });
        
        // Query by entity type and ID
        const result = await db.select().from(entityDocuments)
          .where(
            sql`${entityDocuments.entityType} = 'project' AND ${entityDocuments.entityId} = 'project-1'`
          );
        
        expect(result).toHaveLength(1);
        expect(result[0].documentId).toBe(testDocuments[0].id);
        expect(result[0].linkType).toBe("reference");
      });
    });

    it("should support finding all entities linked to a document", async () => {
      await withTenantContext(testTenants[0].id, async () => {
        // Link document to multiple entities
        const entities = ["client-1", "project-1", "task-1"];
        
        for (const entityId of entities) {
          await db.insert(entityDocuments).values({
            documentId: testDocuments[0].id,
            entityType: "client", // All as clients for this test
            entityId,
            linkedBy: "user-1",
            linkType: "attachment",
          });
        }
        
        // Find all entities linked to the document
        const result = await db.select().from(entityDocuments).where(entityDocuments.documentId.eq(testDocuments[0].id));
        expect(result).toHaveLength(3);
        
        const linkedEntityIds = result.map(r => r.entityId).sort();
        expect(linkedEntityIds).toEqual(["client-1", "project-1", "task-1"]);
      });
    });
  });
});
*/
