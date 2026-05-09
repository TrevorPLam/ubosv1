/**
 * @file        artifacts/api-server/src/lib/domain-events.ts
 * @module      API Server / Domain Events
 * @purpose     Typed domain event definitions for cross-module communication
 *
 * @ai_instructions
 *   - Each event type should have a specific interface with required fields
 *   - Events must include tenant_id for multi-tenant isolation
 *   - Use strong typing to prevent runtime errors
 *   - DO NOT add events without updating the event handlers
 *
 * @exports     All domain event interfaces and event type constants
 * @imports     node:crypto
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { randomUUID } from "node:crypto";

// Base event interface
export interface BaseDomainEvent {
  id: string;
  type: string;
  tenant_id: string;
  occurred_at: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Work Module Events
export interface TaskCompletedEvent extends BaseDomainEvent {
  type: "task.completed";
  data: {
    task_id: string;
    task_title: string;
    completed_by: string;
    completed_at: string;
    is_billable: boolean;
    project_id?: string;
  };
}

export interface TaskAssignedEvent extends BaseDomainEvent {
  type: "task.assigned";
  data: {
    task_id: string;
    task_title: string;
    assigned_to: string;
    assigned_by: string;
    assigned_at: string;
    due_date?: string;
  };
}

// CRM Module Events
export interface ClientCreatedEvent extends BaseDomainEvent {
  type: "client.created";
  data: {
    client_id: string;
    client_name: string;
    email: string;
    created_by: string;
    created_at: string;
    source: "manual" | "import" | "webhook";
  };
}

export interface DealClosedWonEvent extends BaseDomainEvent {
  type: "deal.closed_won";
  data: {
    deal_id: string;
    deal_title: string;
    client_id: string;
    closed_by: string;
    closed_at: string;
    value: number;
    currency: string;
  };
}

// Finance Module Events
export interface InvoicePaidEvent extends BaseDomainEvent {
  type: "invoice.paid";
  data: {
    invoice_id: string;
    invoice_number: string;
    client_id: string;
    paid_by: string;
    paid_at: string;
    amount: number;
    currency: string;
    payment_method: string;
  };
}

export interface InvoiceCreatedEvent extends BaseDomainEvent {
  type: "invoice.created";
  data: {
    invoice_id: string;
    invoice_number: string;
    client_id: string;
    created_by: string;
    created_at: string;
    amount: number;
    currency: string;
    due_date: string;
    line_items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
    }>;
  };
}

// Team Module Events
export interface EmployeeOnboardedEvent extends BaseDomainEvent {
  type: "employee.onboarded";
  data: {
    employee_id: string;
    employee_name: string;
    email: string;
    role: string;
    department: string;
    onboarded_by: string;
    onboarded_at: string;
    start_date: string;
  };
}

// Knowledge Module Events
export interface ArticlePublishedEvent extends BaseDomainEvent {
  type: "article.published";
  data: {
    article_id: string;
    article_title: string;
    author_id: string;
    published_at: string;
    category: string;
    tags: string[];
    is_public: boolean;
  };
}

// Assets Module Events
export interface AssetDepreciatedEvent extends BaseDomainEvent {
  type: "asset.depreciated";
  data: {
    asset_id: string;
    asset_name: string;
    asset_type: string;
    current_value: number;
    depreciation_amount: number;
    depreciated_by: string;
    depreciated_at: string;
  };
}

// Vendors Module Events
export interface ContractExpiringEvent extends BaseDomainEvent {
  type: "contract.expiring";
  data: {
    contract_id: string;
    contract_title: string;
    vendor_id: string;
    vendor_name: string;
    expires_at: string;
    days_until_expiry: number;
    auto_renew: boolean;
  };
}

// Event type union for type-safe handling
export type DomainEvent = 
  | TaskCompletedEvent
  | TaskAssignedEvent
  | ClientCreatedEvent
  | DealClosedWonEvent
  | InvoicePaidEvent
  | InvoiceCreatedEvent
  | EmployeeOnboardedEvent
  | ArticlePublishedEvent
  | AssetDepreciatedEvent
  | ContractExpiringEvent;

// Event factory functions for type-safe creation
export const DomainEventFactory = {
  taskCompleted: (data: Omit<TaskCompletedEvent['data'], 'id' | 'type' | 'occurred_at'>, tenant_id: string): TaskCompletedEvent => ({
    id: randomUUID(),
    type: "task.completed",
    tenant_id,
    occurred_at: new Date().toISOString(),
    data
  }),

  taskAssigned: (data: Omit<TaskAssignedEvent['data'], 'id' | 'type' | 'occurred_at'>, tenant_id: string): TaskAssignedEvent => ({
    id: randomUUID(),
    type: "task.assigned",
    tenant_id,
    occurred_at: new Date().toISOString(),
    data
  }),

  clientCreated: (data: Omit<ClientCreatedEvent['data'], 'id' | 'type' | 'occurred_at'>, tenant_id: string): ClientCreatedEvent => ({
    id: randomUUID(),
    type: "client.created",
    tenant_id,
    occurred_at: new Date().toISOString(),
    data
  }),

  dealClosedWon: (data: Omit<DealClosedWonEvent['data'], 'id' | 'type' | 'occurred_at'>, tenant_id: string): DealClosedWonEvent => ({
    id: randomUUID(),
    type: "deal.closed_won",
    tenant_id,
    occurred_at: new Date().toISOString(),
    data
  }),

  invoicePaid: (data: Omit<InvoicePaidEvent['data'], 'id' | 'type' | 'occurred_at'>, tenant_id: string): InvoicePaidEvent => ({
    id: randomUUID(),
    type: "invoice.paid",
    tenant_id,
    occurred_at: new Date().toISOString(),
    data
  }),

  invoiceCreated: (data: Omit<InvoiceCreatedEvent['data'], 'id' | 'type' | 'occurred_at'>, tenant_id: string): InvoiceCreatedEvent => ({
    id: randomUUID(),
    type: "invoice.created",
    tenant_id,
    occurred_at: new Date().toISOString(),
    data
  }),

  employeeOnboarded: (data: Omit<EmployeeOnboardedEvent['data'], 'id' | 'type' | 'occurred_at'>, tenant_id: string): EmployeeOnboardedEvent => ({
    id: randomUUID(),
    type: "employee.onboarded",
    tenant_id,
    occurred_at: new Date().toISOString(),
    data
  }),

  articlePublished: (data: Omit<ArticlePublishedEvent['data'], 'id' | 'type' | 'occurred_at'>, tenant_id: string): ArticlePublishedEvent => ({
    id: randomUUID(),
    type: "article.published",
    tenant_id,
    occurred_at: new Date().toISOString(),
    data
  }),

  assetDepreciated: (data: Omit<AssetDepreciatedEvent['data'], 'id' | 'type' | 'occurred_at'>, tenant_id: string): AssetDepreciatedEvent => ({
    id: randomUUID(),
    type: "asset.depreciated",
    tenant_id,
    occurred_at: new Date().toISOString(),
    data
  }),

  contractExpiring: (data: Omit<ContractExpiringEvent['data'], 'id' | 'type' | 'occurred_at'>, tenant_id: string): ContractExpiringEvent => ({
    id: randomUUID(),
    type: "contract.expiring",
    tenant_id,
    occurred_at: new Date().toISOString(),
    data
  })
};

// Event type constants for string-based lookups
export const EVENT_TYPES = {
  TASK_COMPLETED: "task.completed",
  TASK_ASSIGNED: "task.assigned",
  CLIENT_CREATED: "client.created",
  DEAL_CLOSED_WON: "deal.closed_won",
  INVOICE_PAID: "invoice.paid",
  INVOICE_CREATED: "invoice.created",
  EMPLOYEE_ONBOARDED: "employee.onboarded",
  ARTICLE_PUBLISHED: "article.published",
  ASSET_DEPRECIATED: "asset.depreciated",
  CONTRACT_EXPIRING: "contract.expiring"
} as const;
