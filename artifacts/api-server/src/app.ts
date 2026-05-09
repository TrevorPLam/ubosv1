/**
 * @file        artifacts/api-server/src/app.ts
 * @module      API Server / Core
 * @purpose     Express application setup with middleware and routing
 *
 * @ai_instructions
 *   - All middleware must be configured before routes.
 *   - CORS settings must allow the frontend origin.
 *   - Logging middleware must use the centralized logger.
 *   - DO NOT add middleware without updating security documentation.
 *
 * @module_boundaries
 *   - AgentsModule: Owns agents, agent_runs, tool_calls, mcp_server_bindings tables
 *   - ChatModule: Owns chat_threads, messages, citations, summaries tables
 *   - WorkModule: Owns tasks, projects, milestones tables
 *   - CRMModule: Owns clients, deals, contacts tables
 *   - FinanceModule: Owns invoices, payments, expenses tables
 *   - CalendarModule: Owns events, calendars, attendees tables
 *   - MarketingModule: Owns campaigns, leads, automations tables
 *   - TeamModule: Owns employees, roles, permissions tables
 *   - KnowledgeModule: Owns documents, embeddings, knowledge_bases tables
 *   - VendorsModule: Owns vendors, contracts, integrations tables
 *   - AssetsModule: Owns files, images, media tables
 *
 * @cross_module_communication
 *   - Use NestJS EventEmitter for synchronous in-process events
 *   - Use transactional outbox for asynchronous guaranteed delivery
 *   - Direct database access across modules is PROHIBITED
 *
 * @exports     Express app instance
 * @imports     express, cors, pino-http, ./routes, ./lib/logger
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { clerkAuthMiddleware } from "./middlewares/clerk-auth";
import { tenantContextMiddleware } from "./middlewares/tenant-context";
import { globalErrorHandler } from "./middlewares/error-handler";
import { createSentryRequestHandler, createSentryErrorHandler } from "./lib/observability";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Sentry request handler (must be first)
app.use(createSentryRequestHandler());

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication and tenant context middleware chain
app.use(clerkAuthMiddleware);
app.use(tenantContextMiddleware);

// API routes
app.use("/api", router);

// Sentry error handler (must be before global error handler)
app.use(createSentryErrorHandler());

// Global error handler (must be last)
app.use(globalErrorHandler);

export default app;
