/**
 * @file        artifacts/api-server/src/middlewares/module-guard.ts
 * @module      API Server / Middlewares / Module Guard
 * @purpose     Architectural enforcement to prevent cross-module database access
 *
 * @ai_instructions
 *   - This is a TypeScript lint-level enforcement (optional)
 *   - In production, use architectural tests to validate module boundaries
 *   - Log violations for architectural compliance monitoring
 *   - DO NOT block requests in production - this is for development feedback
 *
 * @exports     moduleGuard middleware
 * @imports     express, pino
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { type Request, type Response, type NextFunction } from "express";
import { logger } from "../lib/logger";

// Module ownership mapping
const MODULE_TABLE_OWNERSHIP: Record<string, string> = {
  // AgentsModule tables
  "agents": "AgentsModule",
  "agent_runs": "AgentsModule", 
  "tool_calls": "AgentsModule",
  "mcp_server_bindings": "AgentsModule",
  
  // ChatModule tables
  "chat_threads": "ChatModule",
  "messages": "ChatModule",
  "citations": "ChatModule",
  "summaries": "ChatModule",
  
  // WorkModule tables
  "tasks": "WorkModule",
  "projects": "WorkModule",
  "milestones": "WorkModule",
  
  // CRMModule tables
  "clients": "CRMModule",
  "deals": "CRMModule",
  "contacts": "CRMModule",
  
  // FinanceModule tables
  "invoices": "FinanceModule",
  "payments": "FinanceModule",
  "expenses": "FinanceModule",
  
  // CalendarModule tables
  "events": "CalendarModule",
  "calendars": "CalendarModule",
  "attendees": "CalendarModule",
  
  // MarketingModule tables
  "campaigns": "MarketingModule",
  "leads": "MarketingModule",
  "automations": "MarketingModule",
  
  // TeamModule tables
  "employees": "TeamModule",
  "roles": "TeamModule",
  "permissions": "TeamModule",
  
  // KnowledgeModule tables
  "documents": "KnowledgeModule",
  "embeddings": "KnowledgeModule",
  "knowledge_bases": "KnowledgeModule",
  
  // VendorsModule tables
  "vendors": "VendorsModule",
  "contracts": "VendorsModule",
  "integrations": "VendorsModule",
  
  // AssetsModule tables
  "files": "AssetsModule",
  "images": "AssetsModule",
  "media": "AssetsModule",
  
  // System tables (accessible by all)
  "tenants": "System",
  "outbox_messages": "System",
  "processed_events": "System"
};

// Route to module mapping (based on file paths and route prefixes)
const ROUTE_MODULE_MAPPING: Record<string, string> = {
  "/agents": "AgentsModule",
  "/chat": "ChatModule", 
  "/work": "WorkModule",
  "/tasks": "WorkModule",
  "/projects": "WorkModule",
  "/crm": "CRMModule",
  "/clients": "CRMModule",
  "/deals": "CRMModule",
  "/finance": "FinanceModule",
  "/invoices": "FinanceModule",
  "/payments": "FinanceModule",
  "/calendar": "CalendarModule",
  "/events": "CalendarModule",
  "/marketing": "MarketingModule",
  "/campaigns": "MarketingModule",
  "/team": "TeamModule",
  "/employees": "TeamModule",
  "/knowledge": "KnowledgeModule",
  "/documents": "KnowledgeModule",
  "/vendors": "VendorsModule",
  "/contracts": "VendorsModule",
  "/assets": "AssetsModule",
  "/files": "AssetsModule"
};

/**
 * Middleware to detect and log potential cross-module database access violations
 * This is for development/architectural compliance, not production enforcement
 */
export function moduleGuard(req: Request, res: Response, next: NextFunction): void {
  // Skip in production to avoid performance impact
  if (process.env.NODE_ENV === "production") {
    return next();
  }

  const requestPath = req.path;
  const requestModule = determineRequestModule(requestPath);
  
  // Log module access for architectural monitoring
  if (requestModule) {
    logger.info({
      module: requestModule,
      path: requestPath,
      method: req.method,
      userAgent: req.get("User-Agent")
    }, "Module access detected");
  }

  // This would ideally be implemented at the TypeScript/ORM level
  // For now, we log potential violations for architectural review
  next();
}

/**
 * Determine which module a request belongs to based on the path
 */
function determineRequestModule(path: string): string | undefined {
  for (const [routePrefix, module] of Object.entries(ROUTE_MODULE_MAPPING)) {
    if (path.startsWith(routePrefix)) {
      return module;
    }
  }
  return undefined;
}

/**
 * Check if a table access violates module boundaries
 * This would be used by architectural tests or ORM middleware
 */
export function checkTableAccess(tableName: string, accessingModule: string): {
  isViolation: boolean;
  owningModule?: string;
  tableName: string;
  accessingModule: string;
} {
  const owningModule = MODULE_TABLE_OWNERSHIP[tableName];
  
  // System tables are accessible by all
  if (owningModule === "System") {
    return {
      isViolation: false,
      tableName,
      accessingModule
    };
  }
  
  // No ownership defined - potential architectural gap
  if (!owningModule) {
    return {
      isViolation: true,
      tableName,
      accessingModule
    };
  }
  
  // Cross-module access detected
  const isViolation = owningModule !== accessingModule;
  
  return {
    isViolation,
    owningModule,
    tableName,
    accessingModule
  };
}

/**
 * Get all tables owned by a specific module
 */
export function getModuleTables(moduleName: string): string[] {
  return Object.entries(MODULE_TABLE_OWNERSHIP)
    .filter(([_, owner]) => owner === moduleName)
    .map(([tableName]) => tableName);
}

/**
 * Validate module boundaries (for architectural tests)
 */
export function validateModuleBoundaries(): Array<{
  type: "error" | "warning";
  message: string;
  details: Record<string, unknown>;
}> {
  const issues: Array<{
    type: "error" | "warning";
    message: string;
    details: Record<string, unknown>;
  }> = [];

  // Check for tables without ownership
  const allTables = Object.keys(MODULE_TABLE_OWNERSHIP);
  const systemTables = allTables.filter(table => MODULE_TABLE_OWNERSHIP[table] === "System");
  const ownedTables = allTables.filter(table => MODULE_TABLE_OWNERSHIP[table] !== "System");
  
  if (ownedTables.length === 0) {
    issues.push({
      type: "warning",
      message: "No module ownership defined for business tables",
      details: { totalTables: allTables.length, systemTables: systemTables.length }
    });
  }

  // Check for module consistency
  const modules = new Set(Object.values(MODULE_TABLE_OWNERSHIP));
  modules.delete("System");
  
  if (modules.size < 3) {
    issues.push({
      type: "warning", 
      message: "Few modules defined - consider better domain separation",
      details: { moduleCount: modules.size, modules: Array.from(modules) }
    });
  }

  return issues;
}
