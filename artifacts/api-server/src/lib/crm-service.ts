/**
 * @file        artifacts/api-server/src/lib/crm-service.ts
 * @module      API Server / Services / CRM Service
 * @purpose     Business logic for CRM contacts and opportunities
 *
 * @ai_instructions
 *   - Implement CRUD operations for contacts and opportunities
 *   - Support pipeline management and stage transitions
 *   - Include proper tenant isolation
 *   - Follow repository pattern with database abstraction
 *   - Include proper error handling and validation
 *
 * @exports     CRM service with all business methods
 * @imports     Database, schemas, utilities
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { db } from '@workspace/db';
import { 
  contactsTable, 
  opportunitiesTable,
  Contact,
  InsertContact,
  Opportunity,
  InsertOpportunity
} from '@workspace/db/schema';
import { eq, and, ilike, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface ContactListOptions {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  tenantId: string;
}

export interface CreateContactOptions extends Omit<InsertContact, 'id' | 'createdAt' | 'updatedAt'> {
  tenantId: string;
}

export interface CreateOpportunityOptions extends Omit<InsertOpportunity, 'id' | 'createdAt' | 'updatedAt'> {
  tenantId: string;
}

export interface UpdateOpportunityOptions extends Partial<Omit<InsertOpportunity, 'id' | 'createdAt' | 'updatedAt' | 'clientId'>> {
  tenantId: string;
}

export interface ContactListResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PipelineResponse {
  stages: Record<string, Opportunity[]>;
}

class CrmService {
  /**
   * List contacts with pagination, filtering, and search
   */
  async listContacts(options: ContactListOptions): Promise<ContactListResponse> {
    const { page, limit, status, search, tenantId } = options;
    const offset = (page - 1) * limit;

    // Build query conditions
    let whereConditions = [eq(contactsTable.tenant_id, tenantId)];
    
    if (status) {
      whereConditions.push(eq(contactsTable.status, status as any));
    }

    if (search) {
      const searchCondition = ilike(contactsTable.name, `%${search}%`);
      if (searchCondition) whereConditions.push(searchCondition);
    }

    // Get total count for pagination
    const countQuery = db
      .select({ count: db.$count(contactsTable.id) })
      .from(contactsTable)
      .where(and(...whereConditions));
    
    const [{ count }] = await countQuery;
    const total = Number(count);

    // Get contacts with pagination
    const contactsQuery = db
      .select()
      .from(contactsTable)
      .where(and(...whereConditions))
      .orderBy(desc(contactsTable.created_at))
      .limit(limit)
      .offset(offset);

    const contacts = await contactsQuery;

    return {
      contacts,
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
   * Create a new contact
   */
  async createContact(options: CreateContactOptions): Promise<Contact> {
    const contactData = {
      ...options,
      id: randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const [contact] = await db
      .insert(contactsTable)
      .values(contactData)
      .returning();

    return contact;
  }

  /**
   * Get sales pipeline grouped by stage
   */
  async getPipeline(options: { stage?: string; tenantId: string }): Promise<PipelineResponse> {
    const { stage, tenantId } = options;

    let whereConditions = [eq(opportunitiesTable.tenant_id, tenantId)];
    
    if (stage) {
      whereConditions.push(eq(opportunitiesTable.stage, stage as any));
    }

    const opportunities = await db
      .select()
      .from(opportunitiesTable)
      .where(and(...whereConditions))
      .orderBy(desc(opportunitiesTable.created_at));

    // Group by stage
    const stages: Record<string, Opportunity[]> = {};
    
    const allStages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
    
    for (const stageName of allStages) {
      stages[stageName] = opportunities.filter(opp => opp.stage === stageName);
    }

    return { stages };
  }

  /**
   * Create a new opportunity
   */
  async createOpportunity(options: CreateOpportunityOptions): Promise<Opportunity> {
    const opportunityData = {
      ...options,
      id: randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const [opportunity] = await db
      .insert(opportunitiesTable)
      .values(opportunityData)
      .returning();

    return opportunity;
  }

  /**
   * Update opportunity (stage movement, etc.)
   */
  async updateOpportunity(id: string, options: UpdateOpportunityOptions): Promise<Opportunity | null> {
    const updateData = {
      ...options,
      updated_at: new Date(),
    };

    const [opportunity] = await db
      .update(opportunitiesTable)
      .set(updateData)
      .where(and(
        eq(opportunitiesTable.id, id),
        eq(opportunitiesTable.tenant_id, options.tenantId)
      ))
      .returning();

    return opportunity || null;
  }
}

export const crmService = new CrmService();
