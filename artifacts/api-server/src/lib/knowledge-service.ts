/**
 * @file        artifacts/api-server/src/lib/knowledge-service.ts
 * @module      API Server / Knowledge Service
 * @purpose     Knowledge management service with versioning and search capabilities
 *
 * @ai_instructions
 *   - Use database transactions for knowledge version creation
 *   - Implement proper tenant isolation using tenant context
 *   - Handle knowledge status transitions with validation
 *   - Support full-text search using PostgreSQL tsvector
 *   - Include pagination and filtering for knowledge listings
 *   - Add audit logging for knowledge operations
 *   - Use proper error handling and validation
 *
 * @exports     KnowledgeService class with knowledge management operations
 * @imports     Database schema types, tenant context
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { eq, and, desc, asc, ilike, inArray, sql } from 'drizzle-orm';
import { db } from '@workspace/db';
import {
  knowledgeEntries,
  knowledgeVersions,
  certificationRecords,
  type KnowledgeEntry,
  type KnowledgeVersion,
  type CertificationRecord,
  type InsertKnowledgeEntry,
  type InsertKnowledgeVersion,
  type InsertCertificationRecord,
} from '@workspace/db/schema';
import { getCurrentTenantId } from './tenant-context';

export interface CreateKnowledgeData {
  title: string;
  content: string;
  category: 'sop' | 'wiki' | 'training' | 'certification' | 'policy' | 'process' | 'template' | 'faq' | 'best_practice' | 'other';
  role?: string;
  department?: string;
  tags?: string[];
  reviewerId?: string;
  reviewDueAt?: Date;
  effectiveDate?: Date;
  expiryDate?: Date;
  parentEntryId?: string;
  isTemplate?: boolean;
  authorId: string;
}

export interface UpdateKnowledgeData {
  title: string;
  content: string;
  status?: 'draft' | 'needs-review' | 'published' | 'current';
  role?: string;
  department?: string;
  tags?: string[];
  reviewerId?: string;
  reviewDueAt?: Date;
  effectiveDate?: Date;
  expiryDate?: Date;
  parentEntryId?: string;
  changeSummary?: string;
  editedBy: string;
}

export interface CreateCertificationData {
  employeeId: string;
  certificationName: string;
  issuingBody: string;
  credentialId?: string;
  certificationLevel?: string;
  issuedAt: Date;
  expiresAt?: Date;
  verificationUrl?: string;
  verificationCode?: string;
  certificateFileId?: string;
  trainingCompletedAt?: Date;
  nextRenewalDue?: Date;
  notes?: string;
  cost?: number;
  currency?: string;
}

export interface KnowledgeListFilters {
  category?: 'sop' | 'wiki' | 'training' | 'certification' | 'policy' | 'process' | 'template' | 'faq' | 'best_practice' | 'other';
  status?: 'draft' | 'needs-review' | 'published' | 'current';
  role?: string;
  department?: string;
  authorId?: string;
  isTemplate?: boolean;
  search?: string;
}

export interface CertificationListFilters {
  employeeId?: string;
  status?: 'compliant' | 'at-risk' | 'overdue' | 'expired' | 'pending';
  certificationName?: string;
  issuingBody?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface KnowledgeListResult {
  entries: KnowledgeEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface KnowledgeDetailResult {
  entry: KnowledgeEntry;
  versions: KnowledgeVersion[];
}

export interface SearchResult {
  entry: KnowledgeEntry;
  snippet: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

export interface CertificationListResult {
  certifications: CertificationRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Knowledge service for managing knowledge entries, versions, and certifications
 */
export class KnowledgeService {
  /**
   * Create a new knowledge entry with initial version
   * @param data Knowledge creation data
   * @returns Created knowledge entry with version
   */
  async createKnowledge(data: CreateKnowledgeData): Promise<KnowledgeDetailResult> {
    const tenantId = getCurrentTenantId();
    
    try {
      // Use transaction for atomic knowledge entry and version creation
      const result = await db.transaction(async (tx) => {
        // Create knowledge entry
        const insertData: InsertKnowledgeEntry = {
          tenant_id: tenantId,
          title: data.title,
          content: data.content,
          category: data.category,
          status: 'draft',
          role: data.role,
          department: data.department,
          tags: data.tags || [],
          author_id: data.authorId,
          reviewer_id: data.reviewerId,
          review_due_at: data.reviewDueAt,
          effective_date: data.effectiveDate,
          expiry_date: data.expiryDate,
          parent_entry_id: data.parentEntryId,
          is_template: data.isTemplate || false,
          version_number: 1,
          view_count: 0,
        };

        const [entry] = await tx.insert(knowledgeEntries).values(insertData).returning();

        // Create initial version
        const versionInsertData: InsertKnowledgeVersion = {
          knowledge_entry_id: entry.id,
          version_number: 1,
          content: data.content,
          edited_by: data.authorId,
          change_summary: 'Initial version',
          review_status: 'pending',
        };

        const [version] = await tx.insert(knowledgeVersions).values(versionInsertData).returning();

        // Update search vector for full-text search
        await this.updateSearchVector(tx, entry.id, data.title, data.content);

        return { entry, version };
      });

      return {
        entry: result.entry,
        versions: [result.version],
      };
    } catch (error) {
      console.error('Error creating knowledge entry:', error);
      throw new Error(`Failed to create knowledge entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get knowledge entry details with version history
   * @param entryId Knowledge entry ID
   * @returns Knowledge entry details
   */
  async getKnowledge(entryId: string): Promise<KnowledgeDetailResult> {
    const tenantId = getCurrentTenantId();

    try {
      // Get knowledge entry
      const entry = await db.query.knowledgeEntries.findFirst({
        where: and(
          eq(knowledgeEntries.id, entryId),
          eq(knowledgeEntries.tenant_id, tenantId)
        ),
      });

      if (!entry) {
        throw new Error('Knowledge entry not found');
      }

      // Get versions
      const versions = await db.query.knowledgeVersions.findMany({
        where: eq(knowledgeVersions.knowledge_entry_id, entryId),
        orderBy: [desc(knowledgeVersions.version_number)],
      });

      return {
        entry,
        versions,
      };
    } catch (error) {
      console.error('Error getting knowledge entry:', error);
      throw new Error(`Failed to get knowledge entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List knowledge entries with filtering and pagination
   * @param filters Filter options
   * @param pagination Pagination options
   * @returns Paginated knowledge entry list
   */
  async listKnowledge(
    filters: KnowledgeListFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<KnowledgeListResult> {
    const tenantId = getCurrentTenantId();
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    try {
      // Build query conditions
      const conditions = [eq(knowledgeEntries.tenant_id, tenantId)];

      if (filters.category) {
        conditions.push(eq(knowledgeEntries.category, filters.category));
      }

      if (filters.status) {
        conditions.push(eq(knowledgeEntries.status, filters.status));
      }

      if (filters.role) {
        conditions.push(eq(knowledgeEntries.role, filters.role));
      }

      if (filters.department) {
        conditions.push(eq(knowledgeEntries.department, filters.department));
      }

      if (filters.authorId) {
        conditions.push(eq(knowledgeEntries.author_id, filters.authorId));
      }

      if (filters.isTemplate !== undefined) {
        conditions.push(eq(knowledgeEntries.is_template, filters.isTemplate));
      }

      if (filters.search) {
        conditions.push(
          sql`(${knowledgeEntries.title} ILIKE ${'%' + filters.search + '%'} OR ${knowledgeEntries.content} ILIKE ${'%' + filters.search + '%'})`
        );
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

      // Get total count
      const [{ count }] = await db
        .select({ count: knowledgeEntries.id })
        .from(knowledgeEntries)
        .where(whereClause);

      // Get knowledge entries
      const entries = await db.query.knowledgeEntries.findMany({
        where: whereClause,
        orderBy: [desc(knowledgeEntries.updated_at)],
        limit,
        offset,
      });

      const total = Number(count);
      const totalPages = Math.ceil(total / limit);

      return {
        entries,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error listing knowledge entries:', error);
      throw new Error(`Failed to list knowledge entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a knowledge entry, creating a new version
   * @param entryId Knowledge entry ID
   * @param data Update data
   * @returns Updated knowledge entry
   */
  async updateKnowledge(entryId: string, data: UpdateKnowledgeData): Promise<KnowledgeDetailResult> {
    const tenantId = getCurrentTenantId();

    try {
      // Use transaction for atomic update and version creation
      const result = await db.transaction(async (tx) => {
        // Verify knowledge entry exists and belongs to tenant
        const entry = await tx.query.knowledgeEntries.findFirst({
          where: and(
            eq(knowledgeEntries.id, entryId),
            eq(knowledgeEntries.tenant_id, tenantId)
          ),
        });

        if (!entry) {
          throw new Error('Knowledge entry not found or access denied');
        }

        // Get current version number
        const [latestVersion] = await tx
          .select({ version_number: knowledgeVersions.version_number })
          .from(knowledgeVersions)
          .where(eq(knowledgeVersions.knowledge_entry_id, entryId))
          .orderBy(desc(knowledgeVersions.version_number))
          .limit(1);

        const nextVersionNumber = (latestVersion?.version_number || 0) + 1;

        // Create new version
        const versionInsertData: InsertKnowledgeVersion = {
          knowledge_entry_id: entryId,
          version_number: nextVersionNumber,
          content: data.content,
          edited_by: data.editedBy,
          change_summary: data.changeSummary,
          review_status: 'pending',
        };

        const [version] = await tx.insert(knowledgeVersions).values(versionInsertData).returning();

        // Update knowledge entry
        const updateData = {
          title: data.title,
          content: data.content,
          status: data.status || entry.status,
          role: data.role,
          department: data.department,
          tags: data.tags,
          reviewer_id: data.reviewerId,
          review_due_at: data.reviewDueAt,
          effective_date: data.effectiveDate,
          expiry_date: data.expiryDate,
          parent_entry_id: data.parentEntryId,
          version_number: nextVersionNumber,
          updated_at: new Date(),
        };

        const [updatedEntry] = await tx
          .update(knowledgeEntries)
          .set(updateData)
          .where(eq(knowledgeEntries.id, entryId))
          .returning();

        // Update search vector for full-text search
        await this.updateSearchVector(tx, entryId, data.title, data.content);

        return { entry: updatedEntry, version };
      });

      // Get all versions for the response
      const versions = await db.query.knowledgeVersions.findMany({
        where: eq(knowledgeVersions.knowledge_entry_id, entryId),
        orderBy: [desc(knowledgeVersions.version_number)],
      });

      return {
        entry: result.entry,
        versions,
      };
    } catch (error) {
      console.error('Error updating knowledge entry:', error);
      throw new Error(`Failed to update knowledge entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search knowledge entries using full-text search
   * @param query Search query
   * @param filters Search filters
   * @param limit Maximum number of results
   * @returns Search results with relevance scores
   */
  async searchKnowledge(
    query: string,
    filters: { category?: string; limit?: number } = {}
  ): Promise<SearchResponse> {
    const tenantId = getCurrentTenantId();
    const limit = filters.limit || 10;

    try {
      // Build search conditions
      const conditions = [
        eq(knowledgeEntries.tenant_id, tenantId),
        eq(knowledgeEntries.status, 'published'), // Only search published entries
      ];

      if (filters.category) {
        conditions.push(eq(knowledgeEntries.category, filters.category as any));
      }

      const whereClause = and(...conditions);

      // Perform full-text search with relevance ranking
      const searchQuery = sql`
        SELECT 
          ke.*,
          ts_rank_cd(ke.search_vector, plainto_tsquery('english', ${query})) as score,
          ts_headline('english', ke.content, plainto_tsquery('english', ${query}), 'MaxWords=50, MinWords=20') as snippet
        FROM ${knowledgeEntries} ke
        WHERE ${whereClause} AND ke.search_vector @@ plainto_tsquery('english', ${query})
        ORDER BY score DESC
        LIMIT ${limit}
      `;

      const results = await db.execute(searchQuery);

      const searchResults: SearchResult[] = results.rows.map((row: any) => ({
        entry: {
          id: row.id,
          tenant_id: row.tenant_id,
          title: row.title,
          content: row.content,
          category: row.category,
          status: row.status,
          role: row.role,
          department: row.department,
          tags: row.tags,
          author_id: row.author_id,
          reviewer_id: row.reviewer_id,
          review_due_at: row.review_due_at,
          last_reviewed_at: row.last_reviewed_at,
          effective_date: row.effective_date,
          expiry_date: row.expiry_date,
          version_number: row.version_number,
          parent_entry_id: row.parent_entry_id,
          is_template: row.is_template,
          view_count: row.view_count,
          last_accessed_at: row.last_accessed_at,
          search_vector: row.search_vector,
          metadata: row.metadata,
          created_at: row.created_at,
          updated_at: row.updated_at,
          deleted_at: row.deleted_at,
        },
        snippet: row.snippet,
        score: Number(row.score),
      }));

      // Get total count for pagination
      const countQuery = sql`
        SELECT COUNT(*) as total
        FROM ${knowledgeEntries} ke
        WHERE ${whereClause} AND ke.search_vector @@ plainto_tsquery('english', ${query})
      `;

      const countResult = await db.execute(countQuery);
      const total = Number(countResult.rows[0].total);

      return {
        results: searchResults,
        total,
      };
    } catch (error) {
      console.error('Error searching knowledge entries:', error);
      throw new Error(`Failed to search knowledge entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new certification record
   * @param data Certification creation data
   * @returns Created certification record
   */
  async createCertification(data: CreateCertificationData): Promise<CertificationRecord> {
    const tenantId = getCurrentTenantId();

    try {
      const insertData: InsertCertificationRecord = {
        tenant_id: tenantId,
        employee_id: data.employeeId,
        certification_name: data.certificationName,
        issuing_body: data.issuingBody,
        credential_id: data.credentialId,
        certification_level: data.certificationLevel,
        issued_at: data.issuedAt,
        expires_at: data.expiresAt,
        status: 'pending',
        verification_url: data.verificationUrl,
        verification_code: data.verificationCode,
        certificate_file_id: data.certificateFileId,
        training_completed_at: data.trainingCompletedAt,
        next_renewal_due: data.nextRenewalDue,
        renewal_reminder_sent: false,
        notes: data.notes,
        cost: data.cost,
        currency: data.currency || 'USD',
      };

      const [certification] = await db.insert(certificationRecords).values(insertData).returning();

      return certification;
    } catch (error) {
      console.error('Error creating certification:', error);
      throw new Error(`Failed to create certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List certification records with filtering and pagination
   * @param filters Filter options
   * @param pagination Pagination options
   * @returns Paginated certification list
   */
  async listCertifications(
    filters: CertificationListFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<CertificationListResult> {
    const tenantId = getCurrentTenantId();
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    try {
      // Build query conditions
      const conditions = [eq(certificationRecords.tenant_id, tenantId)];

      if (filters.employeeId) {
        conditions.push(eq(certificationRecords.employee_id, filters.employeeId));
      }

      if (filters.status) {
        conditions.push(eq(certificationRecords.status, filters.status));
      }

      if (filters.certificationName) {
        conditions.push(ilike(certificationRecords.certification_name, `%${filters.certificationName}%`));
      }

      if (filters.issuingBody) {
        conditions.push(ilike(certificationRecords.issuing_body, `%${filters.issuingBody}%`));
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

      // Get total count
      const [{ count }] = await db
        .select({ count: certificationRecords.id })
        .from(certificationRecords)
        .where(whereClause);

      // Get certifications
      const certifications = await db.query.certificationRecords.findMany({
        where: whereClause,
        orderBy: [desc(certificationRecords.created_at)],
        limit,
        offset,
      });

      const total = Number(count);
      const totalPages = Math.ceil(total / limit);

      return {
        certifications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error listing certifications:', error);
      throw new Error(`Failed to list certifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update search vector for full-text search
   * @param tx Database transaction
   * @param entryId Knowledge entry ID
   * @param title Entry title
   * @param content Entry content
   */
  private async updateSearchVector(
    tx: any,
    entryId: string,
    title: string,
    content: string
  ): Promise<void> {
    const searchVector = sql`to_tsvector('english', ${title} || ' ' || ${content})`;
    
    await tx
      .update(knowledgeEntries)
      .set({ search_vector: searchVector })
      .where(eq(knowledgeEntries.id, entryId));
  }

  /**
   * Increment view count for a knowledge entry
   * @param entryId Knowledge entry ID
   * @returns Updated view count
   */
  async incrementViewCount(entryId: string): Promise<void> {
    const tenantId = getCurrentTenantId();

    try {
      await db
        .update(knowledgeEntries)
        .set({ 
          view_count: sql`${knowledgeEntries.view_count} + 1`,
          last_accessed_at: new Date(),
        })
        .where(and(
          eq(knowledgeEntries.id, entryId),
          eq(knowledgeEntries.tenant_id, tenantId)
        ));
    } catch (error) {
      console.error('Error incrementing view count:', error);
      // Don't throw error for view count updates
    }
  }

  /**
   * Delete a knowledge entry (soft delete)
   * @param entryId Knowledge entry ID
   * @returns Success indicator
   */
  async deleteKnowledge(entryId: string): Promise<void> {
    const tenantId = getCurrentTenantId();

    try {
      // Verify knowledge entry exists and belongs to tenant
      const entry = await db.query.knowledgeEntries.findFirst({
        where: and(
          eq(knowledgeEntries.id, entryId),
          eq(knowledgeEntries.tenant_id, tenantId)
        ),
      });

      if (!entry) {
        throw new Error('Knowledge entry not found or access denied');
      }

      // Soft delete knowledge entry
      await db
        .update(knowledgeEntries)
        .set({ deleted_at: new Date() })
        .where(eq(knowledgeEntries.id, entryId));
    } catch (error) {
      console.error('Error deleting knowledge entry:', error);
      throw new Error(`Failed to delete knowledge entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const knowledgeService = new KnowledgeService();
