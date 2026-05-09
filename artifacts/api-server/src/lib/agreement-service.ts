/**
 * @file        artifacts/api-server/src/lib/agreement-service.ts
 * @module      API Server / Services / Agreement Service
 * @purpose     Business logic for agreement management with versioning
 *
 * @ai_instructions
 *   - Implement CRUD operations for agreements and versions
 *   - Support signature state management
 *   - Include proper tenant isolation
 *   - Follow repository pattern with database abstraction
 *   - Include proper error handling and validation
 *
 * @exports     Agreement service with all business methods
 * @imports     Database, schemas, utilities
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { db } from '@workspace/db';
import { 
  agreementsTable, 
  agreementVersionsTable,
  signatureRequestsTable,
  Agreement,
  InsertAgreement,
  AgreementVersion,
  InsertAgreementVersion
} from '@workspace/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface AgreementListOptions {
  page: number;
  limit: number;
  status?: string;
  clientId?: string;
  tenantId: string;
}

export interface CreateAgreementOptions extends Omit<InsertAgreement, 'id' | 'createdAt' | 'updatedAt'> {
  tenantId: string;
}

export interface CreateAgreementVersionOptions extends Omit<InsertAgreementVersion, 'id' | 'createdAt'> {
  tenantId: string;
  createdBy: string;
}

export interface UpdateSignatureOptions {
  status: string;
  externalEnvelopeId?: string;
  tenantId: string;
}

export interface AgreementListResponse {
  agreements: Agreement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class AgreementService {
  /**
   * List agreements with pagination and filtering
   */
  async listAgreements(options: AgreementListOptions): Promise<AgreementListResponse> {
    const { page, limit, status, clientId, tenantId } = options;
    const offset = (page - 1) * limit;

    // Build query conditions
    let whereConditions = [eq(agreementsTable.tenant_id, tenantId)];
    
    if (status) {
      whereConditions.push(eq(agreementsTable.status, status as any));
    }

    if (clientId) {
      whereConditions.push(eq(agreementsTable.client_id, clientId));
    }

    // Get total count for pagination
    const countQuery = db
      .select({ count: db.$count(agreementsTable.id) })
      .from(agreementsTable)
      .where(and(...whereConditions));
    
    const [{ count }] = await countQuery;
    const total = Number(count);

    // Get agreements with pagination
    const agreementsQuery = db
      .select()
      .from(agreementsTable)
      .where(and(...whereConditions))
      .orderBy(desc(agreementsTable.created_at))
      .limit(limit)
      .offset(offset);

    const agreements = await agreementsQuery;

    return {
      agreements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Create a new agreement
   */
  async createAgreement(options: CreateAgreementOptions): Promise<Agreement> {
    const agreementData = {
      ...options,
      id: randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const [agreement] = await db
      .insert(agreementsTable)
      .values(agreementData)
      .returning();

    return agreement;
  }

  /**
   * Create a new version of an agreement
   */
  async createAgreementVersion(agreementId: string, options: CreateAgreementVersionOptions): Promise<AgreementVersion | null> {
    // First, get the latest version number
    const [latestVersion] = await db
      .select({ version: agreementVersionsTable.version_number })
      .from(agreementVersionsTable)
      .where(eq(agreementVersionsTable.agreement_id, agreementId))
      .orderBy(desc(agreementVersionsTable.version_number))
      .limit(1);

    const nextVersion = (latestVersion?.version || 0) + 1;

    const versionData = {
      ...options,
      id: randomUUID(),
      agreement_id: agreementId,
      version_number: nextVersion,
      created_at: new Date(),
    };

    const [version] = await db
      .insert(agreementVersionsTable)
      .values(versionData)
      .returning();

    return version;
  }

  /**
   * Update agreement signature state
   */
  async updateSignatureState(id: string, options: UpdateSignatureOptions): Promise<Agreement | null> {
    // Update signature request if it exists
    if (options.externalEnvelopeId) {
      await db
        .update(signatureRequestsTable)
        .set({
          status: options.status as any,
          external_envelope_id: options.externalEnvelopeId,
          signed_at: options.status === 'completed' ? new Date() : undefined,
        })
        .where(and(
          eq(signatureRequestsTable.agreement_id, id),
          eq(signatureRequestsTable.tenant_id, options.tenantId)
        ));
    }

    // Update agreement status
    const updateData = {
      status: options.status as any,
      updated_at: new Date(),
    };

    const [agreement] = await db
      .update(agreementsTable)
      .set(updateData)
      .where(and(
        eq(agreementsTable.id, id),
        eq(agreementsTable.tenant_id, options.tenantId)
      ))
      .returning();

    return agreement || null;
  }
}

export const agreementService = new AgreementService();
