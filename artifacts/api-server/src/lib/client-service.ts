/**
 * @file        artifacts/api-server/src/lib/client-service.ts
 * @module      API Server / Services / Client Service
 * @purpose     Business logic for client management operations
 *
 * @ai_instructions
 *   - Implement CRUD operations for clients with proper tenant isolation
 *   - Handle contact information (emails, phones, addresses, etc.)
 *   - Support pagination, filtering, and search functionality
 *   - Include cross-linked resources (projects, documents, agreements, appointments)
 *   - Follow repository pattern with database abstraction
 *   - Include proper error handling and validation
 *
 * @exports     Client service with all business methods
 * @imports     Database, schemas, utilities
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { db } from '@workspace/db';
import { 
  clientsTable, 
  clientEmailsTable, 
  clientPhonesTable, 
  clientWebsitesTable, 
  clientSocialProfilesTable, 
  clientAddressesTable,
  Client,
  InsertClient,
  ClientEmail,
  ClientPhone,
  ClientWebsite,
  ClientSocialProfile,
  ClientAddress
} from '@workspace/db/schema';
import { eq, and, ilike, desc, asc, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export interface ClientListOptions {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  tenantId: string;
}

export interface CreateClientOptions extends Omit<InsertClient, 'id' | 'createdAt' | 'updatedAt'> {
  tenantId: string;
}

export interface UpdateClientOptions extends Partial<Omit<InsertClient, 'id' | 'createdAt' | 'updatedAt'>> {
  tenantId: string;
}

export interface ClientDetail extends Client {
  contacts: {
    emails: ClientEmail[];
    phones: ClientPhone[];
    websites: ClientWebsite[];
    socialProfiles: ClientSocialProfile[];
    addresses: ClientAddress[];
  };
}

export interface ClientListResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ClientContactsResponse {
  emails: ClientEmail[];
  phones: ClientPhone[];
  websites: ClientWebsite[];
  socialProfiles: ClientSocialProfile[];
  addresses: ClientAddress[];
}

class ClientService {
  /**
   * List clients with pagination, filtering, and search
   */
  async listClients(options: ClientListOptions): Promise<ClientListResponse> {
    const { page, limit, status, search, tenantId } = options;
    const offset = (page - 1) * limit;

    // Build query conditions
    let whereConditions = [eq(clientsTable.tenant_id, tenantId)];
    
    if (status) {
      whereConditions.push(eq(clientsTable.status, status as any));
    }

    if (search) {
      const searchCondition = or(
        ilike(clientsTable.first_name, `%${search}%`),
        ilike(clientsTable.last_name, `%${search}%`),
        ilike(clientsTable.company, `%${search}%`)
      );
      if (searchCondition) whereConditions.push(searchCondition);
    }

    // Get total count for pagination
    const countQuery = db
      .select({ count: db.$count(clientsTable.id) })
      .from(clientsTable)
      .where(and(...whereConditions));
    
    const [{ count }] = await countQuery;
    const total = Number(count);

    // Get clients with pagination
    const clientsQuery = db
      .select()
      .from(clientsTable)
      .where(and(...whereConditions))
      .orderBy(desc(clientsTable.created_at))
      .limit(limit)
      .offset(offset);

    const clients = await clientsQuery;

    return {
      clients,
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
   * Get client by ID with detailed contact information
   */
  async getClientById(id: string, tenantId: string): Promise<ClientDetail | null> {
    // Get main client record
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(and(
        eq(clientsTable.id, id),
        eq(clientsTable.tenant_id, tenantId)
      ))
      .limit(1);

    if (!client) {
      return null;
    }

    // Get all contact information
    const [emails, phones, websites, socialProfiles, addresses] = await Promise.all([
      db
        .select()
        .from(clientEmailsTable)
        .where(eq(clientEmailsTable.client_id, id)),
      
      db
        .select()
        .from(clientPhonesTable)
        .where(eq(clientPhonesTable.client_id, id)),
      
      db
        .select()
        .from(clientWebsitesTable)
        .where(eq(clientWebsitesTable.client_id, id)),
      
      db
        .select()
        .from(clientSocialProfilesTable)
        .where(eq(clientSocialProfilesTable.client_id, id)),
      
      db
        .select()
        .from(clientAddressesTable)
        .where(eq(clientAddressesTable.client_id, id)),
    ]);

    return {
      ...client,
      contacts: {
        emails,
        phones,
        websites,
        socialProfiles,
        addresses,
      },
    };
  }

  /**
   * Create a new client
   */
  async createClient(options: CreateClientOptions): Promise<Client> {
    const clientData = {
      ...options,
      id: randomUUID(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    const [client] = await db
      .insert(clientsTable)
      .values(clientData)
      .returning();

    return client;
  }

  /**
   * Update client information
   */
  async updateClient(id: string, options: UpdateClientOptions): Promise<Client | null> {
    const updateData = {
      ...options,
      updated_at: new Date(),
    };

    const [client] = await db
      .update(clientsTable)
      .set(updateData)
      .where(and(
        eq(clientsTable.id, id),
        eq(clientsTable.tenant_id, options.tenantId)
      ))
      .returning();

    return client || null;
  }

  /**
   * Delete a client (cascade delete handled by database)
   */
  async deleteClient(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(clientsTable)
      .where(and(
        eq(clientsTable.id, id),
        eq(clientsTable.tenant_id, tenantId)
      ));

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get client contacts (emails, phones, etc.)
   */
  async getClientContacts(id: string, tenantId: string): Promise<ClientContactsResponse> {
    // Verify client exists
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(and(
        eq(clientsTable.id, id),
        eq(clientsTable.tenant_id, tenantId)
      ))
      .limit(1);

    if (!client) {
      throw new Error('Client not found');
    }

    // Get all contact information
    const [emails, phones, websites, socialProfiles, addresses] = await Promise.all([
      db
        .select()
        .from(clientEmailsTable)
        .where(eq(clientEmailsTable.client_id, id)),
      
      db
        .select()
        .from(clientPhonesTable)
        .where(eq(clientPhonesTable.client_id, id)),
      
      db
        .select()
        .from(clientWebsitesTable)
        .where(eq(clientWebsitesTable.client_id, id)),
      
      db
        .select()
        .from(clientSocialProfilesTable)
        .where(eq(clientSocialProfilesTable.client_id, id)),
      
      db
        .select()
        .from(clientAddressesTable)
        .where(eq(clientAddressesTable.client_id, id)),
    ]);

    return {
      emails,
      phones,
      websites,
      socialProfiles,
      addresses,
    };
  }

  /**
   * Get client projects (placeholder for cross-linked functionality)
   */
  async getClientProjects(id: string, tenantId: string): Promise<any> {
    // Verify client exists
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(and(
        eq(clientsTable.id, id),
        eq(clientsTable.tenant_id, tenantId)
      ))
      .limit(1);

    if (!client) {
      throw new Error('Client not found');
    }

    // TODO: Implement when projects schema is available
    return {
      projects: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  /**
   * Get client documents (placeholder for cross-linked functionality)
   */
  async getClientDocuments(id: string, tenantId: string): Promise<any> {
    // Verify client exists
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(and(
        eq(clientsTable.id, id),
        eq(clientsTable.tenant_id, tenantId)
      ))
      .limit(1);

    if (!client) {
      throw new Error('Client not found');
    }

    // TODO: Implement when documents schema is available
    return {
      documents: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  /**
   * Get client agreements
   */
  async getClientAgreements(id: string, tenantId: string): Promise<any> {
    // Verify client exists
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(and(
        eq(clientsTable.id, id),
        eq(clientsTable.tenant_id, tenantId)
      ))
      .limit(1);

    if (!client) {
      throw new Error('Client not found');
    }

    // TODO: Implement when agreements are imported
    return {
      agreements: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  /**
   * Get client appointments (placeholder for cross-linked functionality)
   */
  async getClientAppointments(id: string, tenantId: string): Promise<any> {
    // Verify client exists
    const [client] = await db
      .select()
      .from(clientsTable)
      .where(and(
        eq(clientsTable.id, id),
        eq(clientsTable.tenant_id, tenantId)
      ))
      .limit(1);

    if (!client) {
      throw new Error('Client not found');
    }

    // TODO: Implement when appointments schema is available
    return {
      appointments: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }
}

export const clientService = new ClientService();
