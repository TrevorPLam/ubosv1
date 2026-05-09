/**
 * @file        artifacts/api-server/src/routes/finance.ts
 * @module      API Server / Routes / Finance
 * @purpose     Finance and accounting endpoints for managing accounts, transactions, invoices, bills, journal entries, budgets, goals, and reports
 *
 * @ai_instructions
 *   - Use requireAuth and requirePermission middleware for authentication
 *   - Use validateRequest middleware for query and parameter validation
 *   - Delegate business logic to financeService
 *   - Follow error handling patterns with asyncHandler
 *   - Return responses matching OpenAPI specification
 *   - Implement proper pagination and filtering for list endpoints
 *   - Validate journal entry balancing at the service layer
 *
 * @exports     Express router with finance endpoints
 * @imports     express, @workspace/api-zod, middlewares, services
 *
 * @copyright   SPDX-FileCopyrightText: 2026 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Router, type IRouter } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/require-auth";
import { requirePermission } from "../middlewares/require-permission";
import { validateRequest, commonSchemas } from "../middlewares/validate-request";
import { asyncHandler, ErrorTypes } from "../middlewares/error-handler";
import { financeService } from "../lib/finance-service";

const router: IRouter = Router();

// Query schemas for validation
const listAccountsQuerySchema = z.object({
  page: commonSchemas.paginationQuery.shape.page.optional(),
  limit: commonSchemas.paginationQuery.shape.limit.optional(),
  type: z.enum(["asset", "liability", "equity", "income", "expense"]).optional(),
  is_active: z.coerce.boolean().optional()
});

const listTransactionsQuerySchema = z.object({
  page: commonSchemas.paginationQuery.shape.page.optional(),
  limit: commonSchemas.paginationQuery.shape.limit.optional(),
  account_id: z.string().uuid().optional(),
  category: z.string().optional(),
  is_reconciled: z.coerce.boolean().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional()
});

const listInvoicesQuerySchema = z.object({
  page: commonSchemas.paginationQuery.shape.page.optional(),
  limit: commonSchemas.paginationQuery.shape.limit.optional(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  client_id: z.string().uuid().optional()
});

const listBillsQuerySchema = z.object({
  page: commonSchemas.paginationQuery.shape.page.optional(),
  limit: commonSchemas.paginationQuery.shape.limit.optional(),
  status: z.enum(["draft", "pending-approval", "scheduled", "paid", "overdue"]).optional(),
  vendor_id: z.string().uuid().optional()
});

const listJournalEntriesQuerySchema = z.object({
  page: commonSchemas.paginationQuery.shape.page.optional(),
  limit: commonSchemas.paginationQuery.shape.limit.optional(),
  status: z.enum(["draft", "posted"]).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional()
});

const listBudgetsQuerySchema = z.object({
  page: commonSchemas.paginationQuery.shape.page.optional(),
  limit: commonSchemas.paginationQuery.shape.limit.optional(),
  category: z.enum(["operations", "marketing", "sales", "rd", "admin", "capex", "other"]).optional()
});

const listGoalsQuerySchema = z.object({
  page: commonSchemas.paginationQuery.shape.page.optional(),
  limit: commonSchemas.paginationQuery.shape.limit.optional(),
  is_active: z.coerce.boolean().optional(),
  category: z.string().optional()
});

const incomeStatementQuerySchema = z.object({
  period_start: z.string().datetime(),
  period_end: z.string().datetime()
});

const balanceSheetQuerySchema = z.object({
  as_of_date: z.string().datetime()
});

// Request body schemas
const createAccountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["asset", "liability", "equity", "income", "expense"]),
  subtype: z.string().optional(),
  description: z.string().optional(),
  parent_account_id: z.string().uuid().optional()
});

const createTransactionSchema = z.object({
  account_id: z.string().uuid(),
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().optional(),
  date: z.string().datetime(),
  counterparty: z.string().optional(),
  reference: z.string().optional()
});

const updateTransactionSchema = z.object({
  is_reconciled: z.boolean().optional(),
  category: z.string().optional()
});

const createInvoiceSchema = z.object({
  client_id: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  issued_at: z.string().datetime(),
  due_at: z.string().datetime()
});

const updateInvoiceSchema = z.object({
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
  paid_at: z.string().datetime().optional(),
  notes: z.string().optional()
});

const createBillSchema = z.object({
  vendor_id: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  due_at: z.string().datetime()
});

const updateBillSchema = z.object({
  status: z.enum(["draft", "pending-approval", "scheduled", "paid", "overdue"]).optional(),
  notes: z.string().optional()
});

const createJournalEntrySchema = z.object({
  description: z.string().min(1),
  reference: z.string().optional(),
  date: z.string().datetime(),
  lines: z.array(z.object({
    account_id: z.string().uuid(),
    debit: z.number().nonnegative().optional(),
    credit: z.number().nonnegative().optional(),
    description: z.string().optional()
  })).min(2)
});

const updateJournalEntrySchema = z.object({
  status: z.enum(["draft", "posted"]).optional(),
  approved_by: z.string().optional()
});

const createBudgetSchema = z.object({
  category: z.enum(["operations", "marketing", "sales", "rd", "admin", "capex", "other"]),
  budgeted_amount: z.number().positive(),
  period_start: z.string().datetime(),
  period_end: z.string().datetime(),
  description: z.string().optional(),
  notes: z.string().optional()
});

const createGoalSchema = z.object({
  name: z.string().min(1),
  target_amount: z.number().positive(),
  target_date: z.string().datetime().optional(),
  description: z.string().optional(),
  category: z.string().optional()
});

const updateGoalSchema = z.object({
  current_amount: z.number().nonnegative().optional(),
  is_active: z.boolean().optional(),
  target_date: z.string().datetime().optional()
});

// Common parameter schemas
const uuidParam = commonSchemas.uuidParam;

// Chart of Accounts endpoints
/**
 * GET /accounts
 * List chart of accounts with pagination and optional filtering
 */
router.get(
  "/accounts",
  requireAuth,
  requirePermission(["finance:read"]),
  validateRequest({ query: listAccountsQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type, is_active } = req.query as {
      page?: number;
      limit?: number;
      type?: string;
      is_active?: boolean;
    };

    const result = await financeService.listAccounts({
      page: Number(page),
      limit: Number(limit),
      type,
      is_active,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

/**
 * POST /accounts
 * Create a new account in the chart of accounts
 */
router.post(
  "/accounts",
  requireAuth,
  requirePermission(["finance:write"]),
  validateRequest({ body: createAccountSchema }),
  asyncHandler(async (req, res) => {
    const accountData = req.body;

    const result = await financeService.createAccount({
      ...accountData,
      tenantId: req.user!.tenantId
    });

    res.status(201).json(result);
  })
);

// Transaction endpoints
/**
 * GET /transactions
 * List transactions with pagination and filtering
 */
router.get(
  "/transactions",
  requireAuth,
  requirePermission(["finance:read"]),
  validateRequest({ query: listTransactionsQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, account_id, category, is_reconciled, date_from, date_to } = req.query as {
      page?: number;
      limit?: number;
      account_id?: string;
      category?: string;
      is_reconciled?: boolean;
      date_from?: string;
      date_to?: string;
    };

    const result = await financeService.listTransactions({
      page: Number(page),
      limit: Number(limit),
      account_id,
      category,
      is_reconciled,
      date_from: date_from ? new Date(date_from) : undefined,
      date_to: date_to ? new Date(date_to) : undefined,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

/**
 * POST /transactions
 * Create a new transaction
 */
router.post(
  "/transactions",
  requireAuth,
  requirePermission(["finance:write"]),
  validateRequest({ body: createTransactionSchema }),
  asyncHandler(async (req, res) => {
    const transactionData = req.body;

    const result = await financeService.createTransaction({
      ...transactionData,
      tenantId: req.user!.tenantId
    });

    res.status(201).json(result);
  })
);

/**
 * PATCH /transactions/:id
 * Update transaction (for reconciliation)
 */
router.patch(
  "/transactions/:id",
  requireAuth,
  requirePermission(["finance:write"]),
  validateRequest({ params: uuidParam, body: updateTransactionSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const updateData = req.body;

    const result = await financeService.updateTransaction({
      transactionId: id,
      ...updateData,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

// Invoice endpoints
/**
 * GET /invoices
 * List invoices with pagination and optional filtering
 */
router.get(
  "/invoices",
  requireAuth,
  requirePermission(["finance:read"]),
  validateRequest({ query: listInvoicesQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, client_id } = req.query as {
      page?: number;
      limit?: number;
      status?: string;
      client_id?: string;
    };

    const result = await financeService.listInvoices({
      page: Number(page),
      limit: Number(limit),
      status,
      client_id,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

/**
 * POST /invoices
 * Create a new invoice
 */
router.post(
  "/invoices",
  requireAuth,
  requirePermission(["finance:write"]),
  validateRequest({ body: createInvoiceSchema }),
  asyncHandler(async (req, res) => {
    const invoiceData = req.body;

    const result = await financeService.createInvoice({
      ...invoiceData,
      tenantId: req.user!.tenantId
    });

    res.status(201).json(result);
  })
);

/**
 * GET /invoices/:id
 * Get a specific invoice
 */
router.get(
  "/invoices/:id",
  requireAuth,
  requirePermission(["finance:read"]),
  validateRequest({ params: uuidParam }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    const result = await financeService.getInvoice({
      invoiceId: id,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

/**
 * PATCH /invoices/:id
 * Update invoice status or record payment
 */
router.patch(
  "/invoices/:id",
  requireAuth,
  requirePermission(["finance:write"]),
  validateRequest({ params: uuidParam, body: updateInvoiceSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const updateData = req.body;

    const result = await financeService.updateInvoice({
      invoiceId: id,
      ...updateData,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

// Bill endpoints
/**
 * GET /bills
 * List bills with pagination and optional filtering
 */
router.get(
  "/bills",
  requireAuth,
  requirePermission(["finance:read"]),
  validateRequest({ query: listBillsQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, vendor_id } = req.query as {
      page?: number;
      limit?: number;
      status?: string;
      vendor_id?: string;
    };

    const result = await financeService.listBills({
      page: Number(page),
      limit: Number(limit),
      status,
      vendor_id,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

/**
 * POST /bills
 * Create a new bill
 */
router.post(
  "/bills",
  requireAuth,
  requirePermission(["finance:write"]),
  validateRequest({ body: createBillSchema }),
  asyncHandler(async (req, res) => {
    const billData = req.body;

    const result = await financeService.createBill({
      ...billData,
      tenantId: req.user!.tenantId
    });

    res.status(201).json(result);
  })
);

/**
 * GET /bills/:id
 * Get a specific bill
 */
router.get(
  "/bills/:id",
  requireAuth,
  requirePermission(["finance:read"]),
  validateRequest({ params: uuidParam }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    const result = await financeService.getBill({
      billId: id,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

/**
 * PATCH /bills/:id
 * Update bill status or schedule payment
 */
router.patch(
  "/bills/:id",
  requireAuth,
  requirePermission(["finance:write"]),
  validateRequest({ params: uuidParam, body: updateBillSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const updateData = req.body;

    const result = await financeService.updateBill({
      billId: id,
      ...updateData,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

// Journal Entry endpoints
/**
 * GET /journal-entries
 * List journal entries with pagination and optional filtering
 */
router.get(
  "/journal-entries",
  requireAuth,
  requirePermission(["finance:read"]),
  validateRequest({ query: listJournalEntriesQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, date_from, date_to } = req.query as {
      page?: number;
      limit?: number;
      status?: string;
      date_from?: string;
      date_to?: string;
    };

    const result = await financeService.listJournalEntries({
      page: Number(page),
      limit: Number(limit),
      status,
      date_from: date_from ? new Date(date_from) : undefined,
      date_to: date_to ? new Date(date_to) : undefined,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

/**
 * POST /journal-entries
 * Create a new balanced journal entry
 */
router.post(
  "/journal-entries",
  requireAuth,
  requirePermission(["finance:write"]),
  validateRequest({ body: createJournalEntrySchema }),
  asyncHandler(async (req, res) => {
    const journalEntryData = req.body;

    const result = await financeService.createJournalEntry({
      ...journalEntryData,
      created_by: req.user!.id,
      tenantId: req.user!.tenantId
    });

    res.status(201).json(result);
  })
);

/**
 * GET /journal-entries/:id
 * Get a specific journal entry with lines
 */
router.get(
  "/journal-entries/:id",
  requireAuth,
  requirePermission(["finance:read"]),
  validateRequest({ params: uuidParam }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    const result = await financeService.getJournalEntry({
      journalEntryId: id,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

/**
 * PATCH /journal-entries/:id
 * Update journal entry status (posting)
 */
router.patch(
  "/journal-entries/:id",
  requireAuth,
  requirePermission(["finance:write"]),
  validateRequest({ params: uuidParam, body: updateJournalEntrySchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const updateData = req.body;

    const result = await financeService.updateJournalEntry({
      journalEntryId: id,
      ...updateData,
      approved_by: updateData.approved_by || req.user!.id,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

// Budget endpoints
/**
 * GET /budgets
 * List budgets with pagination and optional filtering
 */
router.get(
  "/budgets",
  requireAuth,
  requirePermission(["finance:read"]),
  validateRequest({ query: listBudgetsQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, category } = req.query as {
      page?: number;
      limit?: number;
      category?: string;
    };

    const result = await financeService.listBudgets({
      page: Number(page),
      limit: Number(limit),
      category,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

/**
 * POST /budgets
 * Create a new budget
 */
router.post(
  "/budgets",
  requireAuth,
  requirePermission(["finance:write"]),
  validateRequest({ body: createBudgetSchema }),
  asyncHandler(async (req, res) => {
    const budgetData = req.body;

    const result = await financeService.createBudget({
      ...budgetData,
      tenantId: req.user!.tenantId
    });

    res.status(201).json(result);
  })
);

// Goal endpoints
/**
 * GET /goals
 * List financial goals with pagination and optional filtering
 */
router.get(
  "/goals",
  requireAuth,
  requirePermission(["finance:read"]),
  validateRequest({ query: listGoalsQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, is_active, category } = req.query as {
      page?: number;
      limit?: number;
      is_active?: boolean;
      category?: string;
    };

    const result = await financeService.listGoals({
      page: Number(page),
      limit: Number(limit),
      is_active,
      category,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

/**
 * POST /goals
 * Create a new financial goal
 */
router.post(
  "/goals",
  requireAuth,
  requirePermission(["finance:write"]),
  validateRequest({ body: createGoalSchema }),
  asyncHandler(async (req, res) => {
    const goalData = req.body;

    const result = await financeService.createGoal({
      ...goalData,
      tenantId: req.user!.tenantId
    });

    res.status(201).json(result);
  })
);

/**
 * PATCH /goals/:id
 * Update goal current amount or status
 */
router.patch(
  "/goals/:id",
  requireAuth,
  requirePermission(["finance:write"]),
  validateRequest({ params: uuidParam, body: updateGoalSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const updateData = req.body;

    const result = await financeService.updateGoal({
      goalId: id,
      ...updateData,
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

// Report endpoints
/**
 * GET /reports/income-statement
 * Get income statement for specified period
 */
router.get(
  "/reports/income-statement",
  requireAuth,
  requirePermission(["finance:read"]),
  validateRequest({ query: incomeStatementQuerySchema }),
  asyncHandler(async (req, res) => {
    const { period_start, period_end } = req.query as {
      period_start: string;
      period_end: string;
    };

    const result = await financeService.getIncomeStatement({
      periodStart: new Date(period_start),
      periodEnd: new Date(period_end),
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

/**
 * GET /reports/balance-sheet
 * Get balance sheet as of specified date
 */
router.get(
  "/reports/balance-sheet",
  requireAuth,
  requirePermission(["finance:read"]),
  validateRequest({ query: balanceSheetQuerySchema }),
  asyncHandler(async (req, res) => {
    const { as_of_date } = req.query as {
      as_of_date: string;
    };

    const result = await financeService.getBalanceSheet({
      asOfDate: new Date(as_of_date),
      tenantId: req.user!.tenantId
    });

    res.json(result);
  })
);

export default router;
