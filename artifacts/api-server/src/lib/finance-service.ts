/**
 * @file        artifacts/api-server/src/lib/finance-service.ts
 * @module      API Server / Services / Finance
 * @purpose     Business logic for finance and accounting operations
 *
 * @ai_instructions
 *   - Contains all finance-related business logic
 *   - Uses database through the db instance from lib/db
 *   - Handles pagination, filtering, and data transformation
 *   - Follows repository pattern for data access
 *   - Includes proper error handling and tenant isolation
 *   - Validates journal entry balancing before posting
 *   - Implements double-entry bookkeeping principles
 *   - Uses server-side SQL aggregation for financial reports
 *
 * @exports     FinanceService class and singleton instance
 * @imports     @workspace/db, drizzle-orm
 *
 * @copyright   SPDX-FileCopyrightText: 2026 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { 
  desc, 
  eq, 
  and,
  inArray,
  gte,
  lte,
  sum,
  sql
} from "drizzle-orm";
import { db } from "@workspace/db";
import { 
  accountsTable,
  transactionsTable,
  vendorsTable,
  invoicesTable,
  billsTable,
  journalEntriesTable,
  journalEntryLinesTable,
  budgetsTable,
  goalsTable,
  type Account,
  type Transaction,
  type Vendor,
  type Invoice,
  type Bill,
  type JournalEntry,
  type JournalEntryLine,
  type Budget,
  type Goal
} from "@workspace/db/schema";
import { ErrorTypes } from "../middlewares/error-handler";
import { 
  journalEntryBalanceSchema,
  type InsertAccount,
  type InsertTransaction,
  type InsertInvoice,
  type InsertBill,
  type InsertJournalEntry,
  type InsertJournalEntryLine,
  type InsertBudget,
  type InsertGoal
} from "@workspace/db/schema/finance";

// Common interfaces
interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Account interfaces
interface ListAccountsParams {
  page: number;
  limit: number;
  type?: string;
  is_active?: boolean;
  tenantId: string;
}

interface CreateAccountParams extends InsertAccount {
  tenantId: string;
}

interface AccountListResponse {
  data: Account[];
  pagination: PaginationResult;
}

// Transaction interfaces
interface ListTransactionsParams {
  page: number;
  limit: number;
  account_id?: string;
  category?: string;
  is_reconciled?: boolean;
  date_from?: Date;
  date_to?: Date;
  tenantId: string;
}

interface CreateTransactionParams extends InsertTransaction {
  tenantId: string;
}

interface UpdateTransactionParams {
  transactionId: string;
  is_reconciled?: boolean;
  category?: string;
  tenantId: string;
}

interface TransactionListResponse {
  data: Transaction[];
  pagination: PaginationResult;
}

// Invoice interfaces
interface ListInvoicesParams {
  page: number;
  limit: number;
  status?: string;
  client_id?: string;
  tenantId: string;
}

interface CreateInvoiceParams extends InsertInvoice {
  tenantId: string;
}

interface UpdateInvoiceParams {
  invoiceId: string;
  status?: string;
  paid_at?: Date;
  notes?: string;
  tenantId: string;
}

interface InvoiceListResponse {
  data: Invoice[];
  pagination: PaginationResult;
}

// Bill interfaces
interface ListBillsParams {
  page: number;
  limit: number;
  status?: string;
  vendor_id?: string;
  tenantId: string;
}

interface CreateBillParams extends InsertBill {
  tenantId: string;
}

interface UpdateBillParams {
  billId: string;
  status?: string;
  notes?: string;
  tenantId: string;
}

interface BillListResponse {
  data: Bill[];
  pagination: PaginationResult;
}

// Journal Entry interfaces
interface ListJournalEntriesParams {
  page: number;
  limit: number;
  status?: string;
  date_from?: Date;
  date_to?: Date;
  tenantId: string;
}

interface CreateJournalEntryParams {
  description: string;
  reference?: string;
  date: Date;
  lines: Array<{
    account_id: string;
    debit?: number;
    credit?: number;
    description?: string;
  }>;
  created_by: string;
  tenantId: string;
}

interface UpdateJournalEntryParams {
  journalEntryId: string;
  status?: string;
  approved_by?: string;
  tenantId: string;
}

interface JournalEntryListResponse {
  data: JournalEntry[];
  pagination: PaginationResult;
}

interface JournalEntryWithLines {
  journal_entry: JournalEntry;
  lines: JournalEntryLine[];
}

// Budget interfaces
interface ListBudgetsParams {
  page: number;
  limit: number;
  category?: string;
  tenantId: string;
}

interface CreateBudgetParams extends InsertBudget {
  tenantId: string;
}

interface BudgetListResponse {
  data: Budget[];
  pagination: PaginationResult;
}

// Goal interfaces
interface ListGoalsParams {
  page: number;
  limit: number;
  is_active?: boolean;
  category?: string;
  tenantId: string;
}

interface CreateGoalParams extends InsertGoal {
  tenantId: string;
}

interface UpdateGoalParams {
  goalId: string;
  current_amount?: number;
  is_active?: boolean;
  target_date?: Date;
  tenantId: string;
}

interface GoalListResponse {
  data: Goal[];
  pagination: PaginationResult;
}

// Report interfaces
interface IncomeStatementParams {
  periodStart: Date;
  periodEnd: Date;
  tenantId: string;
}

interface BalanceSheetParams {
  asOfDate: Date;
  tenantId: string;
}

interface IncomeStatement {
  period_start: Date;
  period_end: Date;
  revenue: {
    total: number;
    breakdown: Array<{
      account_name: string;
      amount: number;
    }>;
  };
  expenses: {
    total: number;
    breakdown: Array<{
      account_name: string;
      amount: number;
    }>;
  };
  net_income: number;
}

interface BalanceSheet {
  as_of_date: Date;
  assets: {
    total: number;
    breakdown: Array<{
      account_name: string;
      amount: number;
    }>;
  };
  liabilities: {
    total: number;
    breakdown: Array<{
      account_name: string;
      amount: number;
    }>;
  };
  equity: {
    total: number;
    breakdown: Array<{
      account_name: string;
      amount: number;
    }>;
  };
}

/**
 * Finance service containing business logic for finance operations
 */
export class FinanceService {
  // Chart of Accounts methods
  async listAccounts(params: ListAccountsParams): Promise<AccountListResponse> {
    const { page, limit, type, is_active, tenantId } = params;
    const offset = (page - 1) * limit;

    // Build base query with tenant isolation
    let baseQuery = eq(accountsTable.tenantId, tenantId);
    
    // Add filters
    if (type) {
      baseQuery = and(baseQuery, eq(accountsTable.type, type as any)) as any;
    }
    if (is_active !== undefined) {
      baseQuery = and(baseQuery, eq(accountsTable.is_active, is_active)) as any;
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: accountsTable.id })
      .from(accountsTable)
      .where(baseQuery);
    
    const total = countResult.length;

    // Get paginated results
    const accounts = await db
      .select()
      .from(accountsTable)
      .where(baseQuery)
      .orderBy(accountsTable.code)
      .limit(limit)
      .offset(offset);

    return {
      data: accounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createAccount(params: CreateAccountParams): Promise<Account> {
    const { tenantId, ...accountData } = params;

    // Check if account code already exists for this tenant
    const existing = await db
      .select()
      .from(accountsTable)
      .where(and(
        eq(accountsTable.tenantId, tenantId),
        eq(accountsTable.code, accountData.code!)
      ));

    if (existing.length > 0) {
      throw new ErrorTypes.ConflictError("Account code already exists");
    }

    // Create account
    const [account] = await db
      .insert(accountsTable)
      .values({
        ...accountData,
        tenantId
      })
      .returning();

    return account;
  }

  // Transaction methods
  async listTransactions(params: ListTransactionsParams): Promise<TransactionListResponse> {
    const { page, limit, account_id, category, is_reconciled, date_from, date_to, tenantId } = params;
    const offset = (page - 1) * limit;

    // Build base query with tenant isolation
    let baseQuery = eq(transactionsTable.tenantId, tenantId);
    
    // Add filters
    if (account_id) {
      baseQuery = and(baseQuery, eq(transactionsTable.accountId, account_id)) as any;
    }
    if (category) {
      baseQuery = and(baseQuery, eq(transactionsTable.category, category)) as any;
    }
    if (is_reconciled !== undefined) {
      baseQuery = and(baseQuery, eq(transactionsTable.isReconciled, is_reconciled)) as any;
    }
    if (date_from) {
      baseQuery = and(baseQuery, gte(transactionsTable.date, date_from)) as any;
    }
    if (date_to) {
      baseQuery = and(baseQuery, lte(transactionsTable.date, date_to)) as any;
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: transactionsTable.id })
      .from(transactionsTable)
      .where(baseQuery);
    
    const total = countResult.length;

    // Get paginated results
    const transactions = await db
      .select()
      .from(transactionsTable)
      .where(baseQuery)
      .orderBy(desc(transactionsTable.date))
      .limit(limit)
      .offset(offset);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createTransaction(params: CreateTransactionParams): Promise<Transaction> {
    const { tenantId, ...transactionData } = params;

    // Verify account exists and belongs to tenant
    const account = await db
      .select()
      .from(accountsTable)
      .where(and(
        eq(accountsTable.id, transactionData.accountId!),
        eq(accountsTable.tenantId, tenantId)
      ));

    if (account.length === 0) {
      throw new ErrorTypes.NotFoundError("Account not found");
    }

    // Create transaction
    const [transaction] = await db
      .insert(transactionsTable)
      .values({
        ...transactionData,
        tenantId
      })
      .returning();

    return transaction;
  }

  async updateTransaction(params: UpdateTransactionParams): Promise<Transaction> {
    const { transactionId, tenantId, ...updateData } = params;

    // Verify transaction exists and belongs to tenant
    const existing = await db
      .select()
      .from(transactionsTable)
      .where(and(
        eq(transactionsTable.id, transactionId),
        eq(transactionsTable.tenantId, tenantId)
      ));

    if (existing.length === 0) {
      throw new ErrorTypes.NotFoundError("Transaction not found");
    }

    // Update transaction
    const [transaction] = await db
      .update(transactionsTable)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(transactionsTable.id, transactionId),
        eq(transactionsTable.tenantId, tenantId)
      ))
      .returning();

    return transaction;
  }

  // Invoice methods
  async listInvoices(params: ListInvoicesParams): Promise<InvoiceListResponse> {
    const { page, limit, status, client_id, tenantId } = params;
    const offset = (page - 1) * limit;

    // Build base query with tenant isolation
    let baseQuery = eq(invoicesTable.tenantId, tenantId);
    
    // Add filters
    if (status) {
      baseQuery = and(baseQuery, eq(invoicesTable.status, status as any)) as any;
    }
    if (client_id) {
      baseQuery = and(baseQuery, eq(invoicesTable.clientId, client_id)) as any;
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: invoicesTable.id })
      .from(invoicesTable)
      .where(baseQuery);
    
    const total = countResult.length;

    // Get paginated results
    const invoices = await db
      .select()
      .from(invoicesTable)
      .where(baseQuery)
      .orderBy(desc(invoicesTable.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createInvoice(params: CreateInvoiceParams): Promise<Invoice> {
    const { tenantId, ...invoiceData } = params;

    // Verify client account exists and belongs to tenant
    const account = await db
      .select()
      .from(accountsTable)
      .where(and(
        eq(accountsTable.id, invoiceData.clientId!),
        eq(accountsTable.tenantId, tenantId)
      ));

    if (account.length === 0) {
      throw new ErrorTypes.NotFoundError("Client account not found");
    }

    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // Create invoice
    const [invoice] = await db
      .insert(invoicesTable)
      .values({
        ...invoiceData,
        invoiceNumber,
        tenantId
      })
      .returning();

    return invoice;
  }

  async getInvoice(params: { invoiceId: string; tenantId: string }): Promise<Invoice> {
    const { invoiceId, tenantId } = params;

    const [invoice] = await db
      .select()
      .from(invoicesTable)
      .where(and(
        eq(invoicesTable.id, invoiceId),
        eq(invoicesTable.tenantId, tenantId)
      ));

    if (!invoice) {
      throw new ErrorTypes.NotFoundError("Invoice not found");
    }

    return invoice;
  }

  async updateInvoice(params: UpdateInvoiceParams): Promise<Invoice> {
    const { invoiceId, tenantId, ...updateData } = params;

    // Verify invoice exists and belongs to tenant
    const existing = await db
      .select()
      .from(invoicesTable)
      .where(and(
        eq(invoicesTable.id, invoiceId),
        eq(invoicesTable.tenantId, tenantId)
      ));

    if (existing.length === 0) {
      throw new ErrorTypes.NotFoundError("Invoice not found");
    }

    // Update invoice
    const [invoice] = await db
      .update(invoicesTable)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(invoicesTable.id, invoiceId),
        eq(invoicesTable.tenantId, tenantId)
      ))
      .returning();

    return invoice;
  }

  // Bill methods
  async listBills(params: ListBillsParams): Promise<BillListResponse> {
    const { page, limit, status, vendor_id, tenantId } = params;
    const offset = (page - 1) * limit;

    // Build base query with tenant isolation
    let baseQuery = eq(billsTable.tenantId, tenantId);
    
    // Add filters
    if (status) {
      baseQuery = and(baseQuery, eq(billsTable.status, status as any)) as any;
    }
    if (vendor_id) {
      baseQuery = and(baseQuery, eq(billsTable.vendorId, vendor_id)) as any;
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: billsTable.id })
      .from(billsTable)
      .where(baseQuery);
    
    const total = countResult.length;

    // Get paginated results
    const bills = await db
      .select()
      .from(billsTable)
      .where(baseQuery)
      .orderBy(desc(billsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: bills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createBill(params: CreateBillParams): Promise<Bill> {
    const { tenantId, ...billData } = params;

    // Verify vendor exists and belongs to tenant
    const vendor = await db
      .select()
      .from(vendorsTable)
      .where(and(
        eq(vendorsTable.id, billData.vendorId!),
        eq(vendorsTable.tenantId, tenantId)
      ));

    if (vendor.length === 0) {
      throw new ErrorTypes.NotFoundError("Vendor not found");
    }

    // Generate unique bill number
    const billNumber = `BILL-${Date.now()}`;

    // Create bill
    const [bill] = await db
      .insert(billsTable)
      .values({
        ...billData,
        billNumber,
        tenantId
      })
      .returning();

    return bill;
  }

  async getBill(params: { billId: string; tenantId: string }): Promise<Bill> {
    const { billId, tenantId } = params;

    const [bill] = await db
      .select()
      .from(billsTable)
      .where(and(
        eq(billsTable.id, billId),
        eq(billsTable.tenantId, tenantId)
      ));

    if (!bill) {
      throw new ErrorTypes.NotFoundError("Bill not found");
    }

    return bill;
  }

  async updateBill(params: UpdateBillParams): Promise<Bill> {
    const { billId, tenantId, ...updateData } = params;

    // Verify bill exists and belongs to tenant
    const existing = await db
      .select()
      .from(billsTable)
      .where(and(
        eq(billsTable.id, billId),
        eq(billsTable.tenantId, tenantId)
      ));

    if (existing.length === 0) {
      throw new ErrorTypes.NotFoundError("Bill not found");
    }

    // Update bill
    const [bill] = await db
      .update(billsTable)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(billsTable.id, billId),
        eq(billsTable.tenantId, tenantId)
      ))
      .returning();

    return bill;
  }

  // Journal Entry methods
  async listJournalEntries(params: ListJournalEntriesParams): Promise<JournalEntryListResponse> {
    const { page, limit, status, date_from, date_to, tenantId } = params;
    const offset = (page - 1) * limit;

    // Build base query with tenant isolation
    let baseQuery = eq(journalEntriesTable.tenantId, tenantId);
    
    // Add filters
    if (status) {
      baseQuery = and(baseQuery, eq(journalEntriesTable.status, status as any)) as any;
    }
    if (date_from) {
      baseQuery = and(baseQuery, gte(journalEntriesTable.date, date_from)) as any;
    }
    if (date_to) {
      baseQuery = and(baseQuery, lte(journalEntriesTable.date, date_to)) as any;
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: journalEntriesTable.id })
      .from(journalEntriesTable)
      .where(baseQuery);
    
    const total = countResult.length;

    // Get paginated results
    const journalEntries = await db
      .select()
      .from(journalEntriesTable)
      .where(baseQuery)
      .orderBy(desc(journalEntriesTable.date))
      .limit(limit)
      .offset(offset);

    return {
      data: journalEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createJournalEntry(params: CreateJournalEntryParams): Promise<JournalEntry> {
    const { description, reference, date, lines, created_by, tenantId } = params;

    // Validate journal entry balance
    const validation = journalEntryBalanceSchema.parse({
      journal_entry_id: 'temp',
      lines
    });

    // Verify all accounts exist and belong to tenant
    const accountIds = lines.map(line => line.account_id);
    const accounts = await db
      .select()
      .from(accountsTable)
      .where(and(
        inArray(accountsTable.id, accountIds),
        eq(accountsTable.tenantId, tenantId)
      ));

    if (accounts.length !== accountIds.length) {
      throw new ErrorTypes.NotFoundError("One or more accounts not found");
    }

    // Create journal entry and lines in a transaction
    const [journalEntry] = await db.transaction(async (tx) => {
      // Create journal entry
      const [entry] = await tx
        .insert(journalEntriesTable)
        .values({
          description,
          reference,
          date,
          createdBy: created_by,
          tenantId
        })
        .returning();

      // Create journal entry lines
      const linesToInsert = lines.map(line => ({
        journalEntryId: entry.id,
        accountId: line.account_id,
        debit: line.debit || 0,
        credit: line.credit || 0,
        description: line.description
      }));

      await tx
        .insert(journalEntryLinesTable)
        .values(linesToInsert);

      return entry;
    });

    return journalEntry;
  }

  async getJournalEntry(params: { journalEntryId: string; tenantId: string }): Promise<JournalEntryWithLines> {
    const { journalEntryId, tenantId } = params;

    // Get journal entry
    const [journalEntry] = await db
      .select()
      .from(journalEntriesTable)
      .where(and(
        eq(journalEntriesTable.id, journalEntryId),
        eq(journalEntriesTable.tenantId, tenantId)
      ));

    if (!journalEntry) {
      throw new ErrorTypes.NotFoundError("Journal entry not found");
    }

    // Get journal entry lines
    const lines = await db
      .select()
      .from(journalEntryLinesTable)
      .where(eq(journalEntryLinesTable.journalEntryId, journalEntryId));

    return {
      journal_entry: journalEntry,
      lines
    };
  }

  async updateJournalEntry(params: UpdateJournalEntryParams): Promise<JournalEntry> {
    const { journalEntryId, status, approved_by, tenantId } = params;

    // Verify journal entry exists and belongs to tenant
    const existing = await db
      .select()
      .from(journalEntriesTable)
      .where(and(
        eq(journalEntriesTable.id, journalEntryId),
        eq(journalEntriesTable.tenantId, tenantId)
      ));

    if (existing.length === 0) {
      throw new ErrorTypes.NotFoundError("Journal entry not found");
    }

    // Update journal entry
    const updateData: any = {
      updatedAt: new Date()
    };

    if (status) {
      updateData.status = status;
      if (status === 'posted') {
        updateData.postedAt = new Date();
      }
    }

    if (approved_by) {
      updateData.approvedBy = approved_by;
    }

    const [journalEntry] = await db
      .update(journalEntriesTable)
      .set(updateData)
      .where(and(
        eq(journalEntriesTable.id, journalEntryId),
        eq(journalEntriesTable.tenantId, tenantId)
      ))
      .returning();

    return journalEntry;
  }

  // Budget methods
  async listBudgets(params: ListBudgetsParams): Promise<BudgetListResponse> {
    const { page, limit, category, tenantId } = params;
    const offset = (page - 1) * limit;

    // Build base query with tenant isolation
    let baseQuery = eq(budgetsTable.tenantId, tenantId);
    
    // Add filters
    if (category) {
      baseQuery = and(baseQuery, eq(budgetsTable.category, category as any)) as any;
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: budgetsTable.id })
      .from(budgetsTable)
      .where(baseQuery);
    
    const total = countResult.length;

    // Get paginated results
    const budgets = await db
      .select()
      .from(budgetsTable)
      .where(baseQuery)
      .orderBy(desc(budgetsTable.periodStart))
      .limit(limit)
      .offset(offset);

    return {
      data: budgets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createBudget(params: CreateBudgetParams): Promise<Budget> {
    const { tenantId, ...budgetData } = params;

    // Create budget
    const [budget] = await db
      .insert(budgetsTable)
      .values({
        ...budgetData,
        tenantId
      })
      .returning();

    return budget;
  }

  // Goal methods
  async listGoals(params: ListGoalsParams): Promise<GoalListResponse> {
    const { page, limit, is_active, category, tenantId } = params;
    const offset = (page - 1) * limit;

    // Build base query with tenant isolation
    let baseQuery = eq(goalsTable.tenantId, tenantId);
    
    // Add filters
    if (is_active !== undefined) {
      baseQuery = and(baseQuery, eq(goalsTable.isActive, is_active)) as any;
    }
    if (category) {
      baseQuery = and(baseQuery, eq(goalsTable.category, category)) as any;
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: goalsTable.id })
      .from(goalsTable)
      .where(baseQuery);
    
    const total = countResult.length;

    // Get paginated results
    const goals = await db
      .select()
      .from(goalsTable)
      .where(baseQuery)
      .orderBy(desc(goalsTable.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: goals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createGoal(params: CreateGoalParams): Promise<Goal> {
    const { tenantId, ...goalData } = params;

    // Create goal
    const [goal] = await db
      .insert(goalsTable)
      .values({
        ...goalData,
        tenantId
      })
      .returning();

    return goal;
  }

  async updateGoal(params: UpdateGoalParams): Promise<Goal> {
    const { goalId, tenantId, ...updateData } = params;

    // Verify goal exists and belongs to tenant
    const existing = await db
      .select()
      .from(goalsTable)
      .where(and(
        eq(goalsTable.id, goalId),
        eq(goalsTable.tenantId, tenantId)
      ));

    if (existing.length === 0) {
      throw new ErrorTypes.NotFoundError("Goal not found");
    }

    // Update goal
    const [goal] = await db
      .update(goalsTable)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(
        eq(goalsTable.id, goalId),
        eq(goalsTable.tenantId, tenantId)
      ))
      .returning();

    return goal;
  }

  // Report methods
  async getIncomeStatement(params: IncomeStatementParams): Promise<IncomeStatement> {
    const { periodStart, periodEnd, tenantId } = params;

    // Get revenue accounts (income type)
    const revenueResults = await db
      .select({
        accountName: accountsTable.name,
        totalAmount: sum(transactionsTable.amount).mapWith(Number)
      })
      .from(transactionsTable)
      .innerJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
      .where(and(
        eq(transactionsTable.tenantId, tenantId),
        eq(accountsTable.tenantId, tenantId),
        eq(accountsTable.type, 'income'),
        gte(transactionsTable.date, periodStart),
        lte(transactionsTable.date, periodEnd)
      ))
      .groupBy(accountsTable.id, accountsTable.name);

    // Get expense accounts (expense type)
    const expenseResults = await db
      .select({
        accountName: accountsTable.name,
        totalAmount: sum(transactionsTable.amount).mapWith(Number)
      })
      .from(transactionsTable)
      .innerJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
      .where(and(
        eq(transactionsTable.tenantId, tenantId),
        eq(accountsTable.tenantId, tenantId),
        eq(accountsTable.type, 'expense'),
        gte(transactionsTable.date, periodStart),
        lte(transactionsTable.date, periodEnd)
      ))
      .groupBy(accountsTable.id, accountsTable.name);

    const totalRevenue = revenueResults.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalExpenses = expenseResults.reduce((sum, r) => sum + r.totalAmount, 0);
    const netIncome = totalRevenue - totalExpenses;

    return {
      period_start: periodStart,
      period_end: periodEnd,
      revenue: {
        total: totalRevenue,
        breakdown: revenueResults.map(r => ({
          account_name: r.accountName,
          amount: r.totalAmount
        }))
      },
      expenses: {
        total: totalExpenses,
        breakdown: expenseResults.map(r => ({
          account_name: r.accountName,
          amount: r.totalAmount
        }))
      },
      net_income: netIncome
    };
  }

  async getBalanceSheet(params: BalanceSheetParams): Promise<BalanceSheet> {
    const { asOfDate, tenantId } = params;

    // Get asset accounts
    const assetResults = await db
      .select({
        accountName: accountsTable.name,
        totalAmount: sum(transactionsTable.amount).mapWith(Number)
      })
      .from(transactionsTable)
      .innerJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
      .where(and(
        eq(transactionsTable.tenantId, tenantId),
        eq(accountsTable.tenantId, tenantId),
        eq(accountsTable.type, 'asset'),
        lte(transactionsTable.date, asOfDate)
      ))
      .groupBy(accountsTable.id, accountsTable.name);

    // Get liability accounts
    const liabilityResults = await db
      .select({
        accountName: accountsTable.name,
        totalAmount: sum(transactionsTable.amount).mapWith(Number)
      })
      .from(transactionsTable)
      .innerJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
      .where(and(
        eq(transactionsTable.tenantId, tenantId),
        eq(accountsTable.tenantId, tenantId),
        eq(accountsTable.type, 'liability'),
        lte(transactionsTable.date, asOfDate)
      ))
      .groupBy(accountsTable.id, accountsTable.name);

    // Get equity accounts
    const equityResults = await db
      .select({
        accountName: accountsTable.name,
        totalAmount: sum(transactionsTable.amount).mapWith(Number)
      })
      .from(transactionsTable)
      .innerJoin(accountsTable, eq(transactionsTable.accountId, accountsTable.id))
      .where(and(
        eq(transactionsTable.tenantId, tenantId),
        eq(accountsTable.tenantId, tenantId),
        eq(accountsTable.type, 'equity'),
        lte(transactionsTable.date, asOfDate)
      ))
      .groupBy(accountsTable.id, accountsTable.name);

    const totalAssets = assetResults.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalLiabilities = liabilityResults.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalEquity = equityResults.reduce((sum, r) => sum + r.totalAmount, 0);

    return {
      as_of_date: asOfDate,
      assets: {
        total: totalAssets,
        breakdown: assetResults.map(r => ({
          account_name: r.accountName,
          amount: r.totalAmount
        }))
      },
      liabilities: {
        total: totalLiabilities,
        breakdown: liabilityResults.map(r => ({
          account_name: r.accountName,
          amount: r.totalAmount
        }))
      },
      equity: {
        total: totalEquity,
        breakdown: equityResults.map(r => ({
          account_name: r.accountName,
          amount: r.totalAmount
        }))
      }
    };
  }
}

// Export singleton instance
export const financeService = new FinanceService();
