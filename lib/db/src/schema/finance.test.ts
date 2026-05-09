/**
 * @file        lib/db/src/schema/finance.test.ts
 * @module      Database / Schema / Finance / Tests
 * @purpose     Schema validation tests for finance tables
 *
 * @ai_instructions
 *   - Test schema structure and constraints
 *   - Verify double-entry accounting validation
 *   - Test enum values and constraints
 *   - Ensure proper tenant isolation patterns
 *
 * @copyright   SPDX-FileCopyrightText: 2026 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from 'vitest';
import { 
  accountsTable, 
  transactionsTable, 
  invoicesTable, 
  billsTable,
  journalEntriesTable,
  journalEntryLinesTable,
  budgetsTable,
  goalsTable,
  vendorsTable,
  accountTypeEnum,
  transactionSourceEnum,
  invoiceStatusEnum,
  billStatusEnum,
  journalEntryStatusEnum,
  budgetCategoryEnum,
  journalEntryBalanceSchema
} from './finance';

describe('Finance Schema', () => {
  describe('Account Types', () => {
    it('should have correct account type enum values', () => {
      expect(accountTypeEnum.enumValues).toEqual([
        'asset',
        'liability', 
        'equity',
        'income',
        'expense'
      ]);
    });
  });

  describe('Transaction Sources', () => {
    it('should have correct transaction source enum values', () => {
      expect(transactionSourceEnum.enumValues).toEqual([
        'manual',
        'imported',
        'invoice',
        'bill',
        'journal'
      ]);
    });
  });

  describe('Invoice Status', () => {
    it('should have correct invoice status enum values', () => {
      expect(invoiceStatusEnum.enumValues).toEqual([
        'draft',
        'sent', 
        'paid',
        'overdue',
        'cancelled'
      ]);
    });
  });

  describe('Bill Status', () => {
    it('should have correct bill status enum values', () => {
      expect(billStatusEnum.enumValues).toEqual([
        'draft',
        'pending-approval',
        'scheduled', 
        'paid',
        'overdue'
      ]);
    });
  });

  describe('Journal Entry Status', () => {
    it('should have correct journal entry status enum values', () => {
      expect(journalEntryStatusEnum.enumValues).toEqual([
        'draft',
        'posted'
      ]);
    });
  });

  describe('Budget Categories', () => {
    it('should have correct budget category enum values', () => {
      expect(budgetCategoryEnum.enumValues).toEqual([
        'operations',
        'marketing',
        'sales',
        'rd',
        'admin',
        'capex',
        'other'
      ]);
    });
  });

  describe('Table Structure', () => {
    it('should have accounts table with required columns', () => {
      const columns = accountsTable[Symbol.for('drizzle:columns')];
      expect(columns.id).toBeDefined();
      expect(columns.tenant_id).toBeDefined();
      expect(columns.code).toBeDefined();
      expect(columns.name).toBeDefined();
      expect(columns.type).toBeDefined();
      expect(columns.is_active).toBeDefined();
      expect(columns.created_at).toBeDefined();
      expect(columns.updated_at).toBeDefined();
    });

    it('should have transactions table with required columns', () => {
      const columns = transactionsTable[Symbol.for('drizzle:columns')];
      expect(columns.id).toBeDefined();
      expect(columns.tenant_id).toBeDefined();
      expect(columns.account_id).toBeDefined();
      expect(columns.description).toBeDefined();
      expect(columns.amount).toBeDefined();
      expect(columns.date).toBeDefined();
      expect(columns.is_reconciled).toBeDefined();
      expect(columns.source).toBeDefined();
    });

    it('should have invoices table with required columns', () => {
      const columns = invoicesTable[Symbol.for('drizzle:columns')];
      expect(columns.id).toBeDefined();
      expect(columns.tenant_id).toBeDefined();
      expect(columns.client_id).toBeDefined();
      expect(columns.invoice_number).toBeDefined();
      expect(columns.amount).toBeDefined();
      expect(columns.status).toBeDefined();
      expect(columns.issued_at).toBeDefined();
      expect(columns.due_at).toBeDefined();
    });

    it('should have bills table with required columns', () => {
      const columns = billsTable[Symbol.for('drizzle:columns')];
      expect(columns.id).toBeDefined();
      expect(columns.tenant_id).toBeDefined();
      expect(columns.vendor_id).toBeDefined();
      expect(columns.bill_number).toBeDefined();
      expect(columns.amount).toBeDefined();
      expect(columns.status).toBeDefined();
      expect(columns.due_at).toBeDefined();
    });

    it('should have journal entries table with required columns', () => {
      const columns = journalEntriesTable[Symbol.for('drizzle:columns')];
      expect(columns.id).toBeDefined();
      expect(columns.tenant_id).toBeDefined();
      expect(columns.description).toBeDefined();
      expect(columns.status).toBeDefined();
      expect(columns.date).toBeDefined();
      expect(columns.created_by).toBeDefined();
    });

    it('should have journal entry lines table with required columns', () => {
      const columns = journalEntryLinesTable[Symbol.for('drizzle:columns')];
      expect(columns.id).toBeDefined();
      expect(columns.journal_entry_id).toBeDefined();
      expect(columns.account_id).toBeDefined();
      expect(columns.debit).toBeDefined();
      expect(columns.credit).toBeDefined();
    });

    it('should have budgets table with required columns', () => {
      const columns = budgetsTable[Symbol.for('drizzle:columns')];
      expect(columns.id).toBeDefined();
      expect(columns.tenant_id).toBeDefined();
      expect(columns.category).toBeDefined();
      expect(columns.budgeted_amount).toBeDefined();
      expect(columns.period_start).toBeDefined();
      expect(columns.period_end).toBeDefined();
    });

    it('should have goals table with required columns', () => {
      const columns = goalsTable[Symbol.for('drizzle:columns')];
      expect(columns.id).toBeDefined();
      expect(columns.tenant_id).toBeDefined();
      expect(columns.name).toBeDefined();
      expect(columns.target_amount).toBeDefined();
      expect(columns.current_amount).toBeDefined();
    });

    it('should have vendors table with required columns', () => {
      const columns = vendorsTable[Symbol.for('drizzle:columns')];
      expect(columns.id).toBeDefined();
      expect(columns.tenant_id).toBeDefined();
      expect(columns.name).toBeDefined();
      expect(columns.is_active).toBeDefined();
    });
  });

  describe('Double-Entry Accounting Validation', () => {
    it('should validate balanced journal entries', () => {
      const validEntry = {
        journal_entry_id: '123e4567-e89b-12d3-a456-426614174000',
        lines: [
          {
            description: 'Debit line',
            account_id: '123e4567-e89b-12d3-a456-426614174001',
            debit: '100.00',
            credit: undefined
          },
          {
            description: 'Credit line', 
            account_id: '123e4567-e89b-12d3-a456-426614174002',
            debit: undefined,
            credit: '100.00'
          }
        ]
      };

      const result = journalEntryBalanceSchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('should reject unbalanced journal entries', () => {
      const invalidEntry = {
        journal_entry_id: '123e4567-e89b-12d3-a456-426614174000',
        lines: [
          {
            description: 'Debit line',
            account_id: '123e4567-e89b-12d3-a456-426614174001',
            debit: '100.00',
            credit: undefined
          },
          {
            description: 'Credit line',
            account_id: '123e4567-e89b-12d3-a456-426614174002',
            debit: undefined,
            credit: '90.00' // Unbalanced!
          }
        ]
      };

      const result = journalEntryBalanceSchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('balance');
      }
    });

    it('should reject journal entries with lines having both debit and credit', () => {
      const invalidEntry = {
        journal_entry_id: '123e4567-e89b-12d3-a456-426614174000',
        lines: [
          {
            description: 'Invalid line',
            account_id: '123e4567-e89b-12d3-a456-426614174001',
            debit: '100.00',
            credit: '50.00' // Both values!
          },
          {
            description: 'Another line',
            account_id: '123e4567-e89b-12d3-a456-426614174002',
            debit: undefined,
            credit: '150.00'
          }
        ]
      };

      const result = journalEntryBalanceSchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('either a debit or credit');
      }
    });

    it('should require at least 2 lines for double-entry', () => {
      const invalidEntry = {
        journal_entry_id: '123e4567-e89b-12d3-a456-426614174000',
        lines: [
          {
            description: 'Single line',
            account_id: '123e4567-e89b-12d3-a456-426614174001',
            debit: '100.00',
            credit: undefined
          }
        ]
      };

      const result = journalEntryBalanceSchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2');
      }
    });
  });
});
