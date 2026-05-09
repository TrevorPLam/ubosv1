# Phase 1 — Foundation

---

## [ ] TASK-001 — Workspace TypeScript & Build Cleanup

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
N/A

### TDD
- Run `pnpm run typecheck` from the repository root to get the current set of errors.
- After each fix, re-run typecheck and confirm all previously failing checks pass.

### BDD
- Scenario: A developer clones the repository, runs `pnpm install`, `pnpm run typecheck`, and `pnpm run build` without encountering any TypeScript errors or invalid CSS.

### Deep Module
- Frontend compile boundary in `artifacts/ai-command-center/src`

### Depends On
N/A

### Blocks
- All subsequent implementation tasks that require a green workspace build

### Imports From
- `artifacts/ai-command-center/src/components/calendar/CalendarPage.tsx`
- `artifacts/ai-command-center/src/components/chat/VoiceWaveform.tsx`
- `artifacts/ai-command-center/src/components/clients/ClientDetailPage.tsx`
- `artifacts/ai-command-center/src/components/chat/SummaryPanel.tsx`
- `artifacts/ai-command-center/src/components/knowledge/CertificationsPage.tsx`

### Exports To
- Every task that depends on a passing typecheck (TASK-002 through end of project)

### Definition of Done
- `pnpm run typecheck` passes from the repository root with zero errors.
- All existing TypeScript errors (calendar, waveform, client draft) are resolved without using `any` or type assertions.
- The following deprecated/invalid CSS classes are replaced:
  - `bg-linear-to-r` → `bg-gradient-to-r` in `SummaryPanel.tsx`
  - `LinkIcon` → `Link` in `CertificationsPage.tsx`
- All deprecated Tailwind v4 utility classes identified in the codebase are replaced with their current equivalents.
- The `VoiceWaveform.tsx` error is resolved with a proper type guard for `window.AudioContext`.

### Out of Scope
- Major component refactors
- Redesigning UI
- Adding new features

### Advanced Code Patterns
- Type guards for browser API availability
- Narrow type refinements instead of type assertions

### Anti‑Patterns
- Disabling TypeScript rules to pass the build
- Adding `any` or unsafe casts as a shortcut
- Reformatting unrelated files

### Subtasks

- [ ] `TASK-001.1` Fix the calendar type error in `artifacts/ai-command-center/src/components/calendar/CalendarPage.tsx`. Replace the unsafe cast with a properly typed variable or narrow the union type.
- [ ] `TASK-001.2` Fix the VoiceWaveform type error in `artifacts/ai-command-center/src/components/chat/VoiceWaveform.tsx`. Add a type guard for `window.AudioContext` (including `webkitAudioContext` fallback) using declaration merging.
- [ ] `TASK-001.3` Fix the client draft type error in `artifacts/ai-command-center/src/components/clients/ClientDetailPage.tsx`. Narrow the `Address` field access with optional chaining and a default fallback.
- [ ] `TASK-001.4` Fix the invalid gradient class in `artifacts/ai-command-center/src/components/chat/SummaryPanel.tsx`. Replace `bg-linear-to-r` with `bg-gradient-to-r`.
- [ ] `TASK-001.5` Fix the non-existent Lucide icon import in `artifacts/ai-command-center/src/components/knowledge/CertificationsPage.tsx`. Replace `LinkIcon` with `Link`.
- [ ] `TASK-001.6` Scan all component files for deprecated Tailwind v4 classes (e.g., removed `@apply` utilities, renamed variants) and update to current equivalents.
- [ ] `TASK-001.7` Re-run `pnpm run typecheck` and `pnpm run build` from root; confirm all packages pass.

---

## [ ] TASK-002 — Environment Configuration & Local Setup

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
N/A

### TDD
- Add a startup script that fails fast with a clear error message when any required environment variable is missing.

### BDD
- Scenario: A new developer clones the repository, creates the required environment files from provided examples, and can start every workspace package successfully using `pnpm run dev`.
- Scenario: Running the API server without `DATABASE_URL` produces an immediate, descriptive error at startup.

### Deep Module
- Runtime boot configuration in `artifacts/ai-command-center/vite.config.ts`, `artifacts/api-server/src/index.ts`, and `lib/db/src/index.ts`

### Depends On
- TASK-001

### Blocks
- TASK-003, TASK-004, TASK-005, all backend tasks, all CI/CD tasks

### Imports From
- `artifacts/ai-command-center/vite.config.ts`
- `artifacts/api-server/src/index.ts`
- `lib/db/drizzle.config.ts`
- `lib/db/src/index.ts`

### Exports To
- All backend, database, and deployment tasks

### Definition of Done
- A `.env.example` file exists at the repository root listing every required variable, its purpose, and example values:
  - `PORT`, `BASE_PATH` (frontend)
  - `DATABASE_URL` (database connection)
  - `LOG_LEVEL` (logging verbosity)
  - `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (authentication)
  - `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (AI models)
  - `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_ENDPOINT` (file storage)
  - `REDIS_URL` (cache and queues)
  - `SENDGRID_API_KEY` (email)
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (SMS)
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (payments)
- A runtime configuration helper exists in `artifacts/api-server/src/lib/config.ts` that loads and validates all required variables at bootstrap.
- `README.md` documents local setup steps and how to create the environment file.
- Frontend `PORT` and `BASE_PATH` enforcement is documented alongside the existing enforcement.

### Out of Scope
- Secret rotation automation
- Managed secret-store rollout (e.g., Vault)

### Advanced Code Patterns
- Single-source runtime config parsing with Zod validation
- Explicit validation at process bootstrap, failing fast on missing required values

### Anti‑Patterns
- Reading `process.env` ad hoc throughout the codebase
- Hiding required configuration behind silent defaults or fallback values

### Subtasks

- [ ] `TASK-002.1` Create `.env.example` in the repository root with all required variables, descriptions, and example values.
- [ ] `TASK-002.2` Create a runtime configuration helper at `artifacts/api-server/src/lib/config.ts` using Zod for schema validation of environment variables.
- [ ] `TASK-002.3` Update `artifacts/api-server/src/index.ts` to import and use the new config helper instead of inline `process.env` reads.
- [ ] `TASK-002.4` Update `lib/db/src/index.ts` and `lib/db/drizzle.config.ts` to use the centralized configuration.
- [ ] `TASK-002.5` Document local setup and environment bootstrapping steps in `README.md`.

---

## [ ] TASK-003 — Database Provisioning & Extensions

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
N/A

### TDD
- Write a migration that enables each required extension; verify by querying `pg_extension` after migration application.
- Add a startup health check that verifies all required extensions are available.

### BDD
- Scenario: Running the database push or migration command creates all extensions needed for application functionality.

### Deep Module
- Database provisioning boundary in `lib/db`

### Depends On
- TASK-002

### Blocks
- TASK-004 (RLS), TASK-007 (agents schema), TASK-009 (chat schema), TASK-015 (documents/knowledge schema with pgvector)

### Imports From
- `lib/db/drizzle.config.ts`
- `lib/db/src/index.ts`

### Exports To
- All schema definition tasks, RAG pipeline, hybrid search

### Definition of Done
- A SQL migration file exists that enables the following PostgreSQL extensions:
  - `pgvector` (vector embeddings for RAG)
  - `pgvectorscale` (scalable vector indexing)
  - `pg_cron` (database-level job scheduling)
  - `pg_textsearch` (full-text search)
  - `anon` (PostgreSQL Anonymizer for GDPR compliance)
- The migration can be applied via `pnpm --filter @workspace/db run push`.
- A health check query confirms all extensions are installed and active.
- `lib/db/package.json` includes a script to verify extension status.

### Out of Scope
- Index creation (handled per-schema in subsequent tasks)
- pgvector index tuning

### Advanced Code Patterns
- Extensions managed through Drizzle migrations
- Health check endpoint queries `pg_extension` catalog

### Anti‑Patterns
- Relying on manual SQL execution without migration versioning
- Assuming extensions are available without explicit verification

### Subtasks

- [ ] `TASK-003.1` Create `lib/db/src/schema/extensions.ts` with SQL statements to enable `pgvector`, `pgvectorscale`, `pg_cron`, `pg_textsearch`, and `anon`.
- [ ] `TASK-003.2` Export the extensions migration from `lib/db/src/schema/index.ts`.
- [ ] `TASK-003.3` Run the migration and verify all extensions appear in `pg_extension` catalog.
- [ ] `TASK-003.4` Add a health check query in `lib/db/src/index.ts` that verifies extension availability on connection.

---

## [ ] TASK-004 — Multi-Tenant Isolation & Row-Level Security

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Identity and Access (cross-cutting concern)
- Core concept: Tenant isolation enforced at the database level

### TDD
- Integration tests that attempt cross-tenant access are rejected with empty result sets.
- Performance regression test: complex JOIN queries must not exceed 10× execution time with RLS enabled (vs. application-level filtering).

### BDD
- Scenario: A user authenticated for Tenant A queries any table; rows belonging to Tenant B are never returned.
- Scenario: An administrator can query across tenants only when explicitly authorized.

### Deep Module
- Database authorization boundary in `lib/db/src`

### Depends On
- TASK-003 (extensions)

### Blocks
- All schema definition tasks (TASK-007, TASK-009, TASK-011, TASK-013, TASK-015, etc.)
- TASK-006 (auth middleware)

### Imports From
- `lib/db/src/index.ts`

### Exports To
- Every table creation task, auth middleware, API routes

### Definition of Done
- All tables include a `tenant_id` column with a foreign key to a `tenants` table.
- Row-Level Security policies with `FORCE ROW LEVEL SECURITY` are enabled on every tenant-scoped table.
- Composite indexes on `(tenant_id, *)` exist for all frequently queried columns.
- `@usebetterdev/tenant` is integrated into the Drizzle ORM configuration for transaction-scoped tenant context.
- The tenant identification middleware sets the PostgreSQL session variable `app.current_tenant` from the authenticated user's JWT.
- Cross-tenant isolation is verified via integration tests.
- A performance baseline test confirms that RLS with composite indexes does not degrade complex query performance beyond the defined threshold.

### Out of Scope
- Creating the actual domain tables (covered by later tasks)
- Complex `security_barrier` view definitions (can be optimized later)

### Advanced Code Patterns
- PostgreSQL RLS with `FORCE` to prevent table owner bypass
- Composite `(tenant_id, id)` indexes as default for primary key lookups under RLS
- Application-layer `WHERE tenant_id = ?` on hot-path queries where RLS demonstrably degrades JOIN strategy

### Anti‑Patterns
- Trusting middleware alone for authorization without database enforcement
- Defining RLS policies that cause the optimizer to switch to Nested Loop plans without indexes

### Subtasks

- [ ] `TASK-004.1` Create a `tenants` table in `lib/db/src/schema/tenants.ts` with columns for `id`, `name`, `created_at`.
- [ ] `TASK-004.2` Add a `tenant_id` column to all future table definitions. Create a utility type/function in `lib/db/src/schema/helpers.ts` for consistent column definition.
- [ ] `TASK-004.3` Create RLS policy helper functions in `lib/db/src/schema/helpers.ts` that generate `FORCE ROW LEVEL SECURITY` and `USING (tenant_id = current_setting('app.current_tenant')::uuid)` policies.
- [ ] `TASK-004.4` Integrate `@usebetterdev/tenant` into the Drizzle ORM configuration in `lib/db/src/index.ts`.
- [ ] `TASK-004.5` Create tenant identification middleware in `artifacts/api-server/src/middlewares/tenant-context.ts` that extracts `tenant_id` from the JWT and sets the PostgreSQL session variable.
- [ ] `TASK-004.6` Write integration tests verifying Tenant A cannot read Tenant B rows across representative table queries.

---

## [ ] TASK-005 — Modular Monolith Architecture & Transactional Outbox

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded contexts: All (cross-cutting infrastructure)
- Pattern: Domain events via transactional outbox

### TDD
- Integration test: when a business operation writes to a domain table, an outbox event is created in the same transaction and is subsequently delivered to registered handlers.

### BDD
- Scenario: A task is marked as "done" in the Work module. A `task.completed` event is persisted atomically with the status change. The Finance module receives this event asynchronously and creates an invoice if the task is billable.

### Deep Module
- Application service and event infrastructure boundary in `artifacts/api-server/src`

### Depends On
- TASK-003, TASK-004

### Blocks
- All domain API tasks (TASK-008, TASK-010, TASK-012, TASK-014, etc.)

### Imports From
- `lib/db/src/index.ts`

### Exports To
- All domain service implementations, cross-module integrations

### Definition of Done
- Module boundaries are documented: `AgentsModule`, `ChatModule`, `WorkModule`, `CRMModule`, `FinanceModule`, `CalendarModule`, `MarketingModule`, `TeamModule`, `KnowledgeModule`, `VendorsModule`, `AssetsModule`.
- Each module owns its tables exclusively; no module can directly import or query another module's database tables.
- Cross-module communication uses NestJS `EventEmitter` for synchronous in-process events and the transactional outbox for asynchronous guaranteed delivery.
- `pg-transactional-outbox` is configured with a poller and `LISTEN/NOTIFY` for low-latency delivery.
- Outbox events include `task.completed`, `deal.closed_won`, `client.created`, `invoice.paid`, `employee.onboarded`, `article.published`, `asset.depreciated`, `contract.expiring`.
- Idempotency handlers track processed event IDs, ensuring at-least-once delivery with effectively exactly-once processing.

### Out of Scope
- Extracting modules into separate microservices
- Event sourcing (full event store)

### Advanced Code Patterns
- Transactional outbox pattern for guaranteed delivery
- Domain events as integration contracts between bounded contexts
- Idempotency via `processed_events` table with UNIQUE constraint on `event_id`

### Anti‑Patterns
- Direct cross-module JOINs
- Modules sharing tables
- Relying on in-process EventEmitter alone for critical cross-module consistency

### Subtasks

- [ ] `TASK-005.1` Document module ownership boundaries in `artifacts/api-server/src/app.ts` — list which tables each module owns.
- [ ] `TASK-005.2` Install and configure `pg-transactional-outbox` in `artifacts/api-server/src/lib/outbox.ts` with PostgreSQL-backed poller.
- [ ] `TASK-005.3` Create the outbox table schema in `lib/db/src/schema/outbox.ts` and the `processed_events` idempotency table.
- [ ] `TASK-005.4` Create an `artifacts/api-server/src/lib/domain-events.ts` module defining typed event objects for all cross-module events.
- [ ] `TASK-005.5` Create an event bus abstraction in `artifacts/api-server/src/lib/event-bus.ts` wrapping the outbox publisher and subscriber interfaces.
- [ ] `TASK-005.6` Implement a NestJS guard in `artifacts/api-server/src/middlewares/module-guard.ts` that prevents cross-module direct database access at the TypeScript lint level (optional enforcement with architectural tests).

---

## [ ] TASK-006 — Authentication & Session Management (Clerk)

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Identity and Access
- External identity provider: Clerk

### TDD
- Integration test: unauthenticated request to a protected endpoint returns 401.
- Integration test: authenticated request with valid session token returns the protected resource.

### BDD
- Scenario: A user visits the application, is redirected to the Clerk-hosted sign-in page, completes authentication, and is redirected back with an active session. All subsequent API calls include the session token.

### Deep Module
- Authentication boundary in `artifacts/ai-command-center/src` (frontend) and `artifacts/api-server/src` (backend middleware)

### Depends On
- TASK-002 (environment config)

### Blocks
- TASK-007 (authorization middleware), all protected API routes, frontend wiring tasks

### Imports From
- `artifacts/ai-command-center/src/main.tsx`
- `artifacts/api-server/src/app.ts`

### Exports To
- Every protected route and page

### Definition of Done
- Clerk is integrated into the React frontend using `@clerk/clerk-react`. The `ClerkProvider` wraps the application tree in `main.tsx`.
- Clerk B2B Organizations are enabled; personal accounts are disabled.
- The API server validates Clerk session tokens using the Clerk Node.js SDK middleware.
- `setAuthTokenGetter` in `lib/api-client-react/src/custom-fetch.ts` is wired to retrieve the Clerk session token for every API call.
- Session state (user, organization/tenant) is available via a React context or Zustand store.
- Login, logout, and session refresh flows work end-to-end.

### Out of Scope
- Custom user profile UI (using Clerk's hosted components initially)
- Multi-factor authentication enrollment (deferred, Clerk supports it natively)

### Advanced Code Patterns
- Session token passed via `Authorization: Bearer <token>` header
- React context for session state, consumed via `useAuth` hook
- Frontend boot: `setBaseUrl` and `setAuthTokenGetter` called once in `main.tsx`

### Anti‑Patterns
- Building a custom authentication system in parallel with Clerk
- Storing session tokens in localStorage without HttpOnly cookie fallback
- Trusting middleware alone for authorization without server-side token validation

### Subtasks

- [ ] `TASK-006.1` Install `@clerk/clerk-react` and `@clerk/backend` packages. Add the required environment variables to `.env.example`.
- [ ] `TASK-006.2` Wrap the application in `ClerkProvider` in `artifacts/ai-command-center/src/main.tsx`. Configure B2B Organizations mode, disable personal accounts.
- [ ] `TASK-006.3` Create a `useSession` hook in `artifacts/ai-command-center/src/hooks/useSession.ts` that exposes current user and active organization/tenant.
- [ ] `TASK-006.4` Update `setAuthTokenGetter` in `lib/api-client-react/src/custom-fetch.ts` to call `getToken()` from Clerk, passing the token to the API client.
- [ ] `TASK-006.5` Install and configure `@clerk/express` middleware in `artifacts/api-server/src/app.ts` to validate session tokens on incoming requests. Attach `tenant_id` context to the request object.
- [ ] `TASK-006.6` Test the full authentication flow: sign-in, token attachment to API calls, token validation on the server, sign-out.

---

## [ ] TASK-007 — Authorization & Request Middleware Stack

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Identity and Access (cross-cutting)
- Application services: authorization guards

### TDD
- Add integration tests for: unauthenticated access returns 401; insufficient permissions returns 403; valid request returns 200.
- Test that each middleware independently verifies authorization context; middleware bypass is not accepted.

### BDD
- Scenario: An authenticated user with role "member" attempts to access an "admin-only" endpoint and receives a 403 Forbidden response with a consistent error payload.

### Deep Module
- API middleware boundary in `artifacts/api-server/src/middlewares`

### Depends On
- TASK-006

### Blocks
- Every protected API route (TASK-008, TASK-010, TASK-012, TASK-014, etc.)

### Imports From
- `artifacts/api-server/src/app.ts`
- `artifacts/api-server/src/routes`
- Clerk session middleware (TASK-006)

### Exports To
- Every protected route in the API server

### Definition of Done
- `require-auth` middleware rejects requests without valid Clerk session tokens (401).
- `require-permission` middleware enforces role-based access control by checking the user's organization role against a required permission set (403 on denial).
- Request validation middleware accepts a Zod schema and validates `req.body`, `req.query`, or `req.params`, returning 422 with structured errors on failure.
- A global error handler catches unhandled exceptions and returns a consistent JSON error format `{ error: string, statusCode: number, details?: unknown }`.
- All middleware is registered in the Express app in the correct order (`tenant-context` → `require-auth` → `require-permission` → `validate-request` → route handler → `error-handler`).

### Out of Scope
- Dynamic permission evaluation based on resource ownership
- Rate limiting middleware (deferred to API Gateway or later task)

### Advanced Code Patterns
- Declarative middleware composition using Express router-level middleware
- Higher-order middleware factories for permission checks (e.g., `requirePermission('tasks:write')`)
- Zod schema inference for request body typing in route handlers

### Anti‑Patterns
- Repeating auth and permission checks inline in every route handler
- Throwing raw database errors or unhandled exceptions directly to clients
- Trusting frontend-enforced permissions without server-side verification

### Subtasks

- [ ] `TASK-007.1` Create `artifacts/api-server/src/middlewares/require-auth.ts` extending Clerk's middleware to reject unauthenticated requests with a 401 JSON response.
- [ ] `TASK-007.2` Create `artifacts/api-server/src/middlewares/require-permission.ts` that checks the user's organization role against a required permission set; returns 403 on denial.
- [ ] `TASK-007.3` Create `artifacts/api-server/src/middlewares/validate-request.ts` that accepts a Zod schema and validates `req.body`, `req.query`, or `req.params`; returns 422 with detailed errors on failure.
- [ ] `TASK-007.4` Create `artifacts/api-server/src/middlewares/error-handler.ts` that catches all unhandled errors and returns a consistent JSON error format.
- [ ] `TASK-007.5` Register all middleware in `artifacts/api-server/src/app.ts` in the correct execution order.

---

## [ ] TASK-008 — Observability & Monitoring Setup

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
N/A

### TDD
- Verify that an unhandled exception in a test route triggers a Sentry error event and an OpenTelemetry trace span.

### BDD
- Scenario: A production error occurs in an API route. The error appears in Sentry with full stack trace and request context. An operations engineer can view the trace in Grafana Cloud with linked LLM call spans.

### Deep Module
- Cross-cutting observability boundaries in `artifacts/api-server/src` and `artifacts/ai-command-center/src`

### Depends On
- TASK-002 (environment config)

### Blocks
- None directly, but strongly desired before AI feature development (Phase 2)

### Imports From
- `artifacts/api-server/src/index.ts`
- `artifacts/ai-command-center/src/main.tsx`

### Exports To
- All development and production debugging workflows

### Definition of Done
- Sentry SDK is initialized in both the API server (`artifacts/api-server/src/index.ts`) and the frontend application (`artifacts/ai-command-center/src/main.tsx`).
- Structured JSON logging (Pino) is configured in the API server and outputs to stdout; production environment uses JSON format, development uses pretty-print.
- OpenLIT SDK is initialized in the API server; it auto-instruments OpenAI and Anthropic SDK calls for later LLM observability.
- Grafana Cloud connection is configured to receive OpenTelemetry traces, logs, and metrics.
- A `/api/healthz` endpoint already exists; a `/api/ready` endpoint is added that returns 200 only when the database connection and Redis are healthy.

### Out of Scope
- Custom dashboards (out-of-the-box Grafana AI dashboards are acceptable)
- Custom log parsing rules

### Advanced Code Patterns
- OpenTelemetry SDK with auto-instrumentation for HTTP, database, and LLM providers
- Centralized error boundary in React for capturing frontend errors to Sentry

### Anti‑Patterns
- Logging sensitive data (credentials, PII) without redaction
- Silent error suppression without observable side effects

### Subtasks

- [ ] `TASK-008.1` Install and configure Sentry SDK in `artifacts/api-server/src/index.ts` and `artifacts/ai-command-center/src/main.tsx`.
- [ ] `TASK-008.2` Install OpenLIT SDK and initialize it in `artifacts/api-server/src/lib/observability.ts` with auto-instrumentation for OpenAI and Anthropic.
- [ ] `TASK-008.3` Configure Grafana Cloud endpoint and credentials in environment variables; verify trace export from local development.
- [ ] `TASK-008.4` Add a `/api/ready` endpoint in `artifacts/api-server/src/routes/health.ts` that checks database and Redis connectivity and returns 200 or 503.
- [ ] `TASK-008.5` Confirm that unhandled exceptions and LLM call traces appear in the monitoring dashboards.

# Phase 2 — Core Domain Infrastructure & AI Foundation

---

## [ ] TASK-009 — Agent & Approval Schema

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Agent Orchestration  
- Core entities: Agent, AgentRun, ToolCall, ApprovalRequest, ApprovalDecision, MCPServerBinding

### TDD
- Schema migration test: confirm all tables are created with correct columns, constraints, and foreign keys.
- Test valid state transitions: an agent's status must only change through defined paths (idle → thinking → running-tool or awaiting-approval, etc.).
- Test that an approval request references a valid agent run and can be linked to a decision.

### BDD
- Scenario: An agent enters the `awaiting-approval` state after a tool call; a corresponding approval request is automatically created. An operator approves, which records an `ApprovalDecision` and updates the agent's status to `running-tool` or `idle`.

### Deep Module
- Database schema boundary in `lib/db/src/schema/agents.ts` and `lib/db/src/schema/approvals.ts`

### Depends On
- TASK-003 (database extensions)  
- TASK-004 (multi‑tenant isolation)

### Blocks
- TASK-010 (Agent & Approval APIs)  
- TASK-019 (real‑time events)  
- TASK-028 (cost analytics)

### Imports From
- `lib/db/src/schema/helpers.ts` (tenant column, RLS helpers)

### Exports To
- Agent APIs, dashboards, audit logging, cost analytics, real‑time event streams

### Definition of Done
- `agents` table exists with columns: `id`, `tenant_id`, `name`, `model`, `system_prompt`, `status` (pgEnum: `idle`, `thinking`, `running-tool`, `awaiting-approval`, `error`), `memory_usage_mb`, `token_count`, `last_heartbeat_at`, `created_at`, `updated_at`.
- `agent_runs` table exists with: `id`, `agent_id` (FK), `task_id`, `status`, `started_at`, `completed_at`, `token_usage_input`, `token_usage_output`, `cost_estimate`.
- `tool_calls` table exists with: `id`, `agent_run_id` (FK), `mcp_server_id` (FK to integrations), `tool_name`, `args` (JSONB), `result` (JSONB), `status`, `started_at`, `finished_at`.
- `approval_requests` table exists with: `id`, `agent_run_id`, `title`, `description`, `status` (enum: `pending`, `approved`, `rejected`), `created_at`, `resolved_at`.
- `approval_decisions` table exists with: `id`, `approval_request_id`, `decision` (enum: `approved`, `rejected`), `decided_by`, `comment`, `decided_at`.
- All tables have `tenant_id` FK and RLS policies via `FORCE ROW LEVEL SECURITY`.
- `mcp_server_bindings` table exists linking agents to specific MCP servers with trust tier.
- Insert and select types are exported via Drizzle.

### Out of Scope
- Agent runtime implementation  
- Cost calculation logic (schema only)

### Advanced Code Patterns
- Immutable event log for approvals and tool calls using append‑only tables
- Explicit state‑machine enums with documented valid transitions
- Separate `cost_estimate` column for eventual aggregation without real‑time calculation

### Anti‑Patterns
- Storing agent status history only in a mutable `status` column without event records
- Encoding approval decisions as unstructured comments
- Using free‑text strings for status and type fields

### Subtasks

- [ ] `TASK-009.1` Create `lib/db/src/schema/agents.ts` with tables `agents`, `agent_runs`, `tool_calls`, and `mcp_server_bindings`. Use `pgEnum` for agent status.
- [ ] `TASK-009.2` Create `lib/db/src/schema/approvals.ts` with tables `approval_requests` and `approval_decisions`. Use `pgEnum` for status and decision.
- [ ] `TASK-009.3` Add `tenant_id` columns and RLS policies (using helpers from TASK-004) to all new tables.
- [ ] `TASK-009.4` Export the new schema from `lib/db/src/schema/index.ts` and generate Drizzle types.
- [ ] `TASK-009.5` Write schema‑level tests verifying table creation, foreign keys, and that status enum values are enforced.

---

## [ ] TASK-010 — Agent & Approval APIs

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Agent Orchestration  
- Application services: ListAgents, GetAgentDetail, ListPendingApprovals, SubmitApprovalDecision

### TDD
- Route integration tests for: GET /agents returns paginated agent list; GET /agents/:id returns detail; GET /approvals returns pending items; POST /approvals/:id/decide records decision and updates agent status.
- Test that unauthorized requests are rejected by auth middleware.

### BDD
- Scenario: An operator opens the agent fleet panel and sees real agent data from the database. They click an agent to view detail, see recent runs and tool calls. They navigate to the attention queue, see pending approvals, approve one, and the agent's status and the queue update accordingly.

### Deep Module
- API route and service boundary in `artifacts/api-server/src/routes/agents.ts`, `artifacts/api-server/src/routes/approvals.ts`, and their corresponding services in `artifacts/api-server/src/lib/`

### Depends On
- TASK-007 (authorization middleware)  
- TASK-009 (agent & approval schema)

### Blocks
- TASK-030 (agent/work frontend wiring)  
- TASK-033 (real‑time event replacement)

### Imports From
- `lib/db/src/schema/agents.ts`  
- `lib/db/src/schema/approvals.ts`  
- `artifacts/api-server/src/middlewares/*`  
- `lib/api-spec/openapi.yaml`

### Exports To
- Agent fleet panel, attention queue, agent detail drawer, status bar

### Definition of Done
- `GET /agents` – returns paginated list of agents with current status, model, memory/token usage.
- `GET /agents/:id` – returns agent detail including recent runs (last 10) and tool calls.
- `GET /approvals` – returns pending approval requests with agent name and description.
- `POST /approvals/:id/decide` – accepts `{ decision: "approved" | "rejected", comment?: string }`; creates an `ApprovalDecision`, updates the approval request and agent status.
- All endpoints are protected by `require-auth` and `require-permission`.
- `openapi.yaml` is updated with agent and approval paths and schemas.
- `pnpm run codegen` regenerates `lib/api-client-react` and `lib/api-zod`; workspace typecheck passes.

### Out of Scope
- Full tool‑execution runtime  
- Agent spawning/configuration management (read‑only APIs for now)

### Advanced Code Patterns
- Thin controllers delegating to typed application services
- Approval decision wrapped in a database transaction that updates both the request and the agent
- Zod‑validated request bodies using schemas from `@workspace/api-zod`

### Anti‑Patterns
- Updating agent status directly without recording an approval decision
- Returning ad‑hoc payloads that differ from the OpenAPI contract
- Bypassing the service layer with raw database queries in controllers

### Subtasks

- [ ] `TASK-010.1` Add agent endpoints (`GET /agents`, `GET /agents/:id`) and approval endpoints (`GET /approvals`, `POST /approvals/:id/decide`) to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-010.2` Create `artifacts/api-server/src/routes/agents.ts` with listing and detail routes. Mount under `/agents`.
- [ ] `TASK-010.3` Create `artifacts/api-server/src/routes/approvals.ts` with listing and decision routes. Mount under `/approvals`.
- [ ] `TASK-010.4` Create `artifacts/api-server/src/lib/agent-service.ts` and `artifacts/api-server/src/lib/approval-service.ts` containing business logic.
- [ ] `TASK-010.5` Register the new routers in `artifacts/api-server/src/routes/index.ts`.
- [ ] `TASK-010.6` Run `pnpm --filter @workspace/api-spec run codegen` to regenerate client libraries; verify `pnpm run typecheck` passes.
- [ ] `TASK-010.7` Write integration tests for all endpoints confirming auth, pagination, and decision flow.

---

## [ ] TASK-011 — Chat & Message Schema

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Conversation Management  
- Core entities: ChatThread, Message, MessageVersion, Citation, Summary, Feedback, Attachment, GroundingContext, EmbeddingChunk

### TDD
- Schema tests: a thread can have many messages; editing a message creates a new version with `is_current` flag; feedback references a unique message-user pair.
- Migration can be applied cleanly.

### BDD
- Scenario: A user opens a chat thread, sends a message, and the assistant responds with grounded citations. The user edits their message; a version history is preserved. The user submits feedback on an assistant response.

### Deep Module
- Database schema boundary in `lib/db/src/schema/chat.ts`

### Depends On
- TASK-003 (pgvector, pg_textsearch)  
- TASK-004 (multi‑tenant isolation)

### Blocks
- TASK-012 (Chat APIs & Streaming)  
- TASK-016 (RAG pipeline)  
- TASK-031 (frontend chat wiring)

### Imports From
- `lib/db/src/schema/helpers.ts`

### Exports To
- Chat APIs, document attachment flows, analytics, grounding, and RAG retrieval

### Definition of Done
- `chat_threads` table exists with `id`, `tenant_id`, `title`, `project_id`, `parent_thread_id`, `branch_point_message_id`, `grounding_mode` (enum: `none`, `web`, `knowledge_base`), `summary_id`, `created_at`, `updated_at`.
- `messages` table exists with `id`, `thread_id` (FK), `role` (enum: `user`, `assistant`, `tool_call`, `tool_result`, `system`), `content` (text), `agent_id`, `is_edited`, `edited_at`, `grounding_mode`, `confidence_score` (numeric 3,2), `created_at`.
- `message_versions` table stores previous content with `message_id`, `content`, `timestamp`, and `is_current` flag.
- `citations` table: `id`, `message_id`, `number`, `title`, `url`, `snippet`, `source_type` (enum: `web`, `knowledge_base`, `document`), `domain`, `published_at`.
- `summaries` table: `id`, `thread_id`, `key_points` (JSONB array), `action_items` (JSONB array), `overall_summary`, `message_count`, `generated_at`, `last_updated`, `is_auto_generated`.
- `feedback` table: `id`, `message_id`, `user_id`, `rating` (enum: `positive`, `negative`), `category` (enum), `comment`, `created_at`.
- `attachments` table: `id`, `message_id`, `storage_reference_id`, `name`, `type`, `size`.
- `embeddings_chunks` table: `id`, `thread_id`, `message_id`, `chunk_text`, `embedding` (vector(1536)) — for RAG.
- All tables have `tenant_id` and RLS policies.

### Out of Scope
- Full‑text search index tuning (defined later)  
- Attachment virus scanning (in upload pipeline)

### Advanced Code Patterns
- Immutable message history via versioning with `is_current` flag
- Separate tables for citations and feedback instead of JSONB blobs
- Embedding storage alongside message content for efficient RAG retrieval

### Anti‑Patterns
- Overwriting messages without preserving history
- Storing chat metadata in a single unstructured JSON column
- Using one giant messages table without normalized attachments or citations

### Subtasks

- [ ] `TASK-011.1` Create `lib/db/src/schema/chat.ts` with tables `chat_threads`, `messages`, `message_versions`, `citations`, `summaries`, `feedback`, `attachments`, and `embeddings_chunks`. Use `pgEnum` for roles, grounding modes, and source types.
- [ ] `TASK-011.2` Enable pgvector on the `embedding` column in `embeddings_chunks` using `vector(1536)`.
- [ ] `TASK-011.3` Add `tenant_id` and RLS policies to all new tables.
- [ ] `TASK-011.4` Export the chat schema from `lib/db/src/schema/index.ts` and generate Drizzle types.
- [ ] `TASK-011.5` Write schema tests for versioning and feedback constraints.

---

## [ ] TASK-012 — Chat APIs & SSE Streaming Contract

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Conversation Management  
- Application services: CreateThread, SendMessage, EditMessage, RecordFeedback, GenerateSummary, StreamResponse

### TDD
- Integration tests for: thread CRUD, message send, message edit with version creation, feedback submission, summary generation.
- Streaming transport test: SSE connection receives partial tokens and a final `[DONE]` event.

### BDD
- Scenario: A user creates a thread, sends a message, and receives real‑time token chunks via SSE until the full response is delivered. The user can edit their message, creating a version, and the assistant's response regenerates. Feedback is submitted and persisted.

### Deep Module
- Chat route, service, and stream boundary in `artifacts/api-server/src`

### Depends On
- TASK-007 (authorization)  
- TASK-011 (chat schema)  
- TASK-008 (SSE infrastructure from Phase 1 — Nginx config)

### Blocks
- TASK-031 (frontend chat wiring)  
- TASK-032 (chat streaming replacement on frontend)

### Imports From
- `lib/db/src/schema/chat.ts`  
- `lib/api-spec/openapi.yaml`  
- `artifacts/api-server/src/lib/chat-service.ts`

### Exports To
- Chat interface, summaries, feedback, analytics, and grounding features

### Definition of Done
- `POST /threads` – create a new thread, returns thread object.
- `GET /threads` – list threads for tenant, paginated.
- `GET /threads/:id` – get thread with messages.
- `PATCH /threads/:id` – rename thread.
- `DELETE /threads/:id` – soft‑delete thread.
- `POST /threads/:id/messages` – send a user message; initiates assistant response; returns the user message immediately.
- `GET /threads/:id/stream` – SSE endpoint that streams assistant response tokens; after streaming completes, the full assistant message is persisted and emitted as a final event.
- `PATCH /messages/:id` – edit a user message, creating a new version.
- `POST /messages/:id/feedback` – record feedback.
- `POST /threads/:id/summarize` – generate (or regenerate) summary.
- `POST /threads/:id/grounding` – update grounding mode.
- All endpoints protected by auth middleware.
- Nginx configuration (from TASK-008) ensures `proxy_buffering off`, `proxy_cache off`, `chunked_transfer_encoding on` for the streaming path.
- `openapi.yaml` updated; client libraries regenerated; workspace typecheck passes.

### Out of Scope
- Multi‑provider LLM routing  
- Voice input processing (frontend will consume `MediaRecorder` + WebSocket separately)

### Advanced Code Patterns
- SSE endpoint managed by a dedicated streaming service; token delivery piped from LLM SDK via `Observable` or `AsyncGenerator`
- Optimistic concurrency via `updatedAt` for thread title changes
- Feedback and summary generation run as background tasks via BullMQ

### Anti‑Patterns
- Returning mock responses or simulated delays in production code
- Coupling route handlers directly to LLM provider SDKs without an abstraction layer
- Using long‑polling instead of SSE for token streaming

### Subtasks

- [ ] `TASK-012.1` Add chat endpoints (threads, messages, feedback, summaries, grounding) and SSE streaming path to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-012.2` Create `artifacts/api-server/src/routes/chat.ts` with REST routes for CRUD operations and a `/threads/:id/stream` endpoint.
- [ ] `TASK-012.3` Create `artifacts/api-server/src/lib/chat-service.ts` with business logic for message persistence, versioning, and validation.
- [ ] `TASK-012.4` Create `artifacts/api-server/src/lib/chat-stream.ts` implementing SSE token delivery; accepts an LLM response stream and pipes tokens with proper event formatting.
- [ ] `TASK-012.5` Implement the background jobs for summary generation and feedback processing in `artifacts/api-server/src/lib/jobs/chat-jobs.ts`.
- [ ] `TASK-012.6` Register the chat router in `artifacts/api-server/src/routes/index.ts`.
- [ ] `TASK-012.7` Run `codegen`; verify typecheck; write integration tests for message edit versioning and streaming delivery.

---

## [ ] TASK-013 — Work, Project & Task Schema

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Work Management  
- Core entities: Project, Task, TaskComment, TaskDependency, ProjectTemplate, TaskTemplate

### TDD
- Schema tests: a task belongs to a project; task status must be one of the defined enum values; dependencies reference valid tasks.
- Migration applies without errors.

### BDD
- Scenario: A project manager creates a project, adds tasks with priorities and statuses, writes comments, and sets dependencies between tasks. A template project can be instantiated to create a new project with cloned tasks.

### Deep Module
- Database schema boundary in `lib/db/src/schema/work.ts`

### Depends On
- TASK-003, TASK-004

### Blocks
- TASK-014 (Work APIs)  
- TASK-030 (work frontend wiring)  
- TASK-040 (cross‑module integration)

### Imports From
- `lib/db/src/schema/helpers.ts`

### Exports To
- Work board (all views), calendar task loading, triage, templates, client linking

### Definition of Done
- `projects` table: `id`, `tenant_id`, `name`, `description`, `status` (enum: `active`, `archived`), `color`, `client_id` (FK nullable), `created_at`, `updated_at`.
- `tasks` table: `id`, `tenant_id`, `project_id` (FK), `title`, `description`, `status` (enum: `backlog`, `in-progress`, `in-review`, `done`), `priority` (enum: `low`, `medium`, `high`, `critical`), `assigned_agent_id`, `due_date`, `billable` (boolean), `order_index` (integer), `created_at`, `updated_at`.
- `task_comments` table: `id`, `task_id`, `author_id`, `content`, `created_at`.
- `task_dependencies` table: `id`, `dependent_task_id`, `dependency_task_id`, with a CHECK constraint preventing self‑references.
- `project_templates` table: `id`, `tenant_id`, `name`, `description`, `category`, `created_at`.
- `template_tasks` table: `id`, `template_id`, `title`, `description`, `status`, `priority`, `order_index`.
- All tables include `tenant_id` and RLS policies.
- Insert and select types exported.

### Out of Scope
- Time entries / timesheet tracking (schema for logging time can be added later)
- Kanban drag‑and‑drop persistence of `order_index` (will use API)

### Advanced Code Patterns
- Separate template task definitions from active tasks to avoid accidental mutation
- Self‑referencing foreign key for dependencies with a check to prevent cycles (application‑level enforcement initially)
- `order_index` column for explicit ordering within a status column

### Anti‑Patterns
- Storing task comments as a JSON array
- Using free‑text status without a defined state machine
- Duplicating task data across projects without normalization

### Subtasks

- [ ] `TASK-013.1` Create `lib/db/src/schema/work.ts` with tables `projects`, `tasks`, `task_comments`, `task_dependencies`, `project_templates`, `template_tasks`. Use `pgEnum` for status and priority.
- [ ] `TASK-013.2` Add `tenant_id` and RLS policies to all tables.
- [ ] `TASK-013.3` Add a CHECK constraint on `task_dependencies` to prevent `dependent_task_id = dependency_task_id`.
- [ ] `TASK-013.4` Export the work schema from `lib/db/src/schema/index.ts` and generate Drizzle types.
- [ ] `TASK-013.5` Write schema tests for task lifecycle constraints and dependency integrity.

---

## [ ] TASK-014 — Work, Project & Task APIs

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Work Management  
- Application services: CreateProject, ListTasks, MoveTask, AddComment, CreateTemplate, InstantiateTemplate

### TDD
- Integration tests: project CRUD, task creation within a project, task status change via move endpoint, commenting, dependency creation, and template instantiation.

### BDD
- Scenario: A user creates a project, adds tasks, moves a task between columns, adds a comment, links a dependency, and uses a template to spin up a new project with pre‑defined tasks.

### Deep Module
- Work route and service boundary in `artifacts/api-server/src`

### Depends On
- TASK-007 (authorization)  
- TASK-013 (work schema)

### Blocks
- TASK-030 (work frontend wiring)  
- TASK-040 (cross‑module integration)

### Imports From
- `lib/db/src/schema/work.ts`  
- `lib/api-spec/openapi.yaml`

### Exports To
- Work board (all views), calendar task loading, triage, templates

### Definition of Done
- `POST /projects` – create project.
- `GET /projects` – list projects.
- `GET /projects/:id` – project detail with task summary counts.
- `POST /projects/:id/tasks` – create task.
- `GET /projects/:id/tasks` – list tasks for project, filterable by status/priority/search.
- `PATCH /tasks/:id` – update task fields.
- `POST /tasks/:id/move` – change task status and optionally set `order_index`.
- `POST /tasks/:id/comments` – add comment.
- `POST /tasks/:id/dependencies` – add dependency.
- `GET /templates` – list project templates.
- `POST /templates` – create template with tasks.
- `POST /templates/:id/instantiate` – create a new project from a template, cloning all template tasks.
- All endpoints are protected and validated.
- `openapi.yaml` updated; client libraries regenerated; workspace typecheck passes.

### Out of Scope
- Drag‑and‑drop reordering persistence of `order_index` across all tasks in a column (can be done with bulk update endpoint later, or via individual move calls)
- Complex workload/capacity calculations

### Advanced Code Patterns
- Explicit command‑style endpoints for state transitions (`POST /tasks/:id/move`)
- Optimistic concurrency via `updatedAt` timestamp checks
- Template instantiation in a database transaction to ensure all cloned tasks are created atomically

### Anti‑Patterns
- Mutating board state only client‑side and syncing later
- Combining unrelated task mutations into a single generic endpoint
- Creating tasks without project association

### Subtasks

- [ ] `TASK-014.1` Add project, task, template, and comment endpoints to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-014.2` Create `artifacts/api-server/src/routes/projects.ts` with CRUD and template instantiation.
- [ ] `TASK-014.3` Create `artifacts/api-server/src/routes/tasks.ts` with CRUD, move, comments, and dependencies.
- [ ] `TASK-014.4` Create `artifacts/api-server/src/lib/work-service.ts` containing all business logic.
- [ ] `TASK-014.5` Register the new routers in `artifacts/api-server/src/routes/index.ts`.
- [ ] `TASK-014.6` Run `codegen`; verify typecheck; write integration tests for task lifecycle and template cloning.

---

## [ ] TASK-015 — MCP Server Runtime & Tool Integration

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Integration Management  
- Core entities: MCPServer, MCPTool, TrustTier

### TDD
- Integration test: register an MCP server, list its tools, invoke a tool via the runtime, and verify the result.
- Security test: a tool invocation from a `restricted` trust tier must be sandboxed; a `trusted` tier invocation may write.

### BDD
- Scenario: An administrator adds a new MCP server (e.g., PostgreSQL Read‑only). The system discovers tools. An AI agent later calls a tool, and the runtime executes it within a containerized sandbox, logging the call and result.

### Deep Module
- MCP runtime service in `artifacts/api-server/src/lib/mcp/`  
- Tool execution engine using `@modelcontextprotocol/sdk`

### Depends On
- TASK-002 (environment config)  
- TASK-009 (schema for integrations, if any — we'll create a minimal one here)

### Blocks
- TASK-017 (supervisory agent)  
- TASK-024 (integrations API, if split out)

### Imports From
- `@modelcontextprotocol/sdk` external package

### Exports To
- Agent tool‑calling capabilities, integrations page, audit logs

### Definition of Done
- MCP server definitions are stored in a `mcp_servers` table (or we can extend TASK-024 later; for now, a minimal table in a new schema file `integrations.ts` or directly in agent schema).
- A runtime module `artifacts/api-server/src/lib/mcp/runtime.ts` provides:
  - `registerServer(serverConfig)` — loads an MCP server via stdio or HTTP/SSE.
  - `listTools(serverId)` — returns available tool schemas.
  - `invokeTool(serverId, toolName, args)` — executes a tool, returns result.
- Trust tiers are enforced: `trusted` tools can read/write; `restricted` tools are executed in an isolated environment with input/output validation.
- DNS rebinding protection is enabled for HTTP‑based servers (`enableDnsRebindingProtection: true`).
- `hostHeaderValidation` middleware is applied to all MCP server HTTP connections.
- All tool calls are logged to the `tool_calls` table (from TASK-009) with full args and results.
- Containerization for sandboxing is optional for this phase but architecturally prepared (Docker socket or sandbox script placeholder).

### Out of Scope
- Private MCP registry with vetting (deferred)
- Container orchestration (Kubernetes) — local Docker or direct process execution acceptable

### Advanced Code Patterns
- Tool execution behind a typed `ToolInvoker` interface, enabling stubbing in tests
- Structured JSON tool definitions with input schemas for validation
- Centralized logging and error handling for tool invocations

### Anti‑Patterns
- Executing tool calls in the same process as the API server without sandboxing
- Exposing raw `exec` or `spawn` without timeout and output size limits
- Hardcoding tool lists in code without runtime discovery from MCP

### Subtasks

- [ ] `TASK-015.1` Create `lib/db/src/schema/integrations.ts` with tables `mcp_servers` (id, tenant_id, name, description, transport_type, endpoint_url, trust_tier, status) and `mcp_tools` (id, server_id, name, description, input_schema JSONB).
- [ ] `TASK-015.2` Export the integration schema and add tenant isolation.
- [ ] `TASK-015.3` Install `@modelcontextprotocol/server` and `@modelcontextprotocol/client` SDK packages in `artifacts/api-server/package.json`.
- [ ] `TASK-015.4` Implement `artifacts/api-server/src/lib/mcp/runtime.ts` with `registerServer`, `listTools`, and `invokeTool`.
- [ ] `TASK-015.5` Implement security: `enableDnsRebindingProtection`, `hostHeaderValidation`, and basic sandboxing (process timeout, output cap).
- [ ] `TASK-015.6` Write integration tests for tool listing and invocation with mocked MCP server.

---

## [ ] TASK-016 — RAG Pipeline & Vector Knowledge Base

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Knowledge Management (shared memory)
- Core concept: Hybrid search (BM25 + vector) over knowledge articles and chat messages

### TDD
- Integration test: after indexing a knowledge article, a search query returns the article in top results.
- Test hybrid search: a keyword match and a semantic match both return relevant results.

### BDD
- Scenario: A knowledge article is published; its content is chunked, embedded, and stored in pgvector. An AI agent queries the knowledge base and receives the most relevant chunks as context, boosting response accuracy.

### Deep Module
- RAG service boundary in `artifacts/api-server/src/lib/rag/`  
- Embedding pipeline using OpenAI `text-embedding-3-small` (1536 dimensions)

### Depends On
- TASK-003 (pgvector)  
- TASK-011 (chat schema for embeddings table) — or we can create a dedicated knowledge schema

### Blocks
- TASK-017 (supervisory agent uses RAG for grounding)
- Future: hybrid search endpoint for command palette and knowledge pages

### Imports From
- `lib/db/src/schema/chat.ts` (embeddings_chunks table)  
- `lib/db/src/schema/knowledge.ts` (to be created in later task; for now, we can index chat messages as a start)

### Exports To
- AI grounding (web search + knowledge base retrieval), knowledge search API

### Definition of Done
- A RAG pipeline exists in `artifacts/api-server/src/lib/rag/pipeline.ts` with:
  - `chunkText(text: string, maxChunkSize: number): string[]`
  - `embedChunks(chunks: string[]): Promise<number[][]>` (calls OpenAI embeddings API, uses `text-embedding-3-small` with explicit `dimensions: 1536`)
  - `indexChunks(entityType, entityId, chunks, embeddings): Promise<void>` (inserts into `embeddings_chunks`)
- Hybrid search function `search(query: string, topK: number)`:
  - Computes query embedding
  - Performs pgvector cosine similarity search over `embeddings_chunks`
  - Performs PostgreSQL full‑text search (`tsvector`/`tsquery`) over the same table
  - Merges results using Reciprocal Rank Fusion (RRF)
- Parent‑document retrieval pattern: small child chunks are stored for search, linked to parent entity IDs; when a chunk matches, the full parent content is returned.
- A background job (via BullMQ) is scheduled weekly via `pg_cron` to rebuild HNSW indexes during off‑peak.
- Multi‑stage filtering: a similarity threshold at the database level excludes low‑quality matches before RRF merging.

### Out of Scope
- Full knowledge article CRUD (later phase)
- UI for viewing indexed chunks
- OCR pipeline

### Advanced Code Patterns
- Hybrid search combining dense vector search and sparse BM25 with RRF fusion
- Parent‑document retrieval for preserving full context
- HNSW index scheduled rebuilds via `pg_cron`
- Embedding caching (if a chunk text hasn't changed, skip re‑embedding) using content hash

### Anti‑Patterns
- Storing embeddings without dimension validation
- Using raw vector distance alone without hybrid scoring
- Not setting a similarity threshold, returning low‑quality noise to the LLM

### Subtasks

- [ ] `TASK-016.1` Install `openai` SDK in `artifacts/api-server/package.json` (if not already present). Create config for embedding model.
- [ ] `TASK-016.2` Implement `artifacts/api-server/src/lib/rag/chunker.ts` for recursive character text splitting.
- [ ] `TASK-016.3` Implement `artifacts/api-server/src/lib/rag/embedder.ts` to call OpenAI embeddings API with explicit `dimensions: 1536`.
- [ ] `TASK-016.4` Implement `artifacts/api-server/src/lib/rag/indexer.ts` to insert chunks and embeddings into the `embeddings_chunks` table.
- [ ] `TASK-016.5` Implement `artifacts/api-server/src/lib/rag/searcher.ts` with hybrid search: pgvector cosine similarity + `ts_rank` over `content_tsv` column, fused with RRF.
- [ ] `TASK-016.6` Create a BullMQ job `index-content` that triggers on new knowledge article or message creation; schedule HNSW rebuild via `pg_cron`.
- [ ] `TASK-016.7` Write integration tests: index sample content, search, validate top‑k results.

---

## [ ] TASK-017 — AI Supervisory Agent Orchestration

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Agent Orchestration  
- Core pattern: Hierarchical supervisor‑worker agent coordination

### TDD
- Integration test: dispatch a task to the supervisor; supervisor decomposes and delegates to a worker agent; worker agent invokes a tool via MCP; supervisor synthesizes final response.

### BDD
- Scenario: A user asks the AI to "review the authentication service code and create a summary report." The supervisor agent delegates code review to the CodeReviewer agent and report writing to the DocumentWriter. Results flow back, and a final combined response is delivered.

### Deep Module
- Supervisor agent runtime in `artifacts/api-server/src/lib/agents/supervisor.ts`  
- Worker agent wrappers in `artifacts/api-server/src/lib/agents/workers/`

### Depends On
- TASK-015 (MCP runtime)  
- TASK-016 (RAG pipeline)  
- TASK-010 (agent APIs — to read agent definitions from DB)

### Blocks
- TASK-030 (work "Ask AI" integration)  
- Advanced chat features

### Imports From
- `langgraph` (or port to TypeScript using custom logic)  
- `@modelcontextprotocol/sdk`

### Exports To
- AI‑powered work assignment, chat with tool use, autonomous task execution

### Definition of Done
- A `SupervisorAgent` class/factory can:
  - Accept a user intent (text + context).
  - Decompose into subtasks using an LLM (e.g., GPT‑4o).
  - Delegate subtasks to specialist worker agents based on capability matching (CodeReviewer, ResearchBot, etc.).
  - Coordinate parallel worker execution.
  - Synthesize final output from worker results.
- Each worker agent can invoke MCP tools through the runtime (TASK-015).
- Orchestration state is checkpointed to PostgreSQL using `langgraph-checkpoint-postgres` (or equivalent custom implementation) to survive server restarts.
- The supervisor loop handles ABORT signals and timeouts gracefully.
- All LLM calls are instrumented with OpenTelemetry `gen_ai.*` span attributes.
- A simple test harness verifies: dispatch a request → worker invokes tool → supervisor returns response.

### Out of Scope
- Full multi‑step approval gating within a run (human‑in‑the‑loop for each tool call)
- Advanced agent memory across sessions (RAG already provides some context)

### Advanced Code Patterns
- Hierarchical supervisor‑worker pattern with typed message passing
- Checkpointing to PostgreSQL for durability (using "exit" mode)
- Tool schema compilation into natural‑language descriptions for smaller models (TSCG optional)

### Anti‑Patterns
- Running the entire orchestration loop synchronously in a single HTTP request without timeout handling
- Hardcoding agent capability matching without a dynamic registry
- Omitting checkpointing, leading to lost state on server restart

### Subtasks

- [ ] `TASK-017.1` Implement `artifacts/api-server/src/lib/agents/registry.ts` that loads agent definitions from the DB and provides capability matching.
- [ ] `TASK-017.2` Implement `artifacts/api-server/src/lib/agents/supervisor.ts` with decomposition, delegation, and synthesis logic.
- [ ] `TASK-017.3` Implement `artifacts/api-server/src/lib/agents/worker.ts` that executes tasks with MCP tool access.
- [ ] `TASK-017.4` Integrate `langgraph-checkpoint-postgres` (or custom equivalent) to persist orchestration state.
- [ ] `TASK-017.5` Instrument all LLM calls and tool invocations with OpenTelemetry spans.
- [ ] `TASK-017.6` Write an integration test simulating a full supervisor‑worker‑tool run.

---

## [ ] TASK-018 — AI Evaluation Framework & Golden Dataset

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- N/A (Quality Assurance / AI Governance)

### TDD
- Evaluation runner: given a golden dataset of input‑expected‑output pairs, execute the AI pipeline and compute correctness, groundedness, safety scores.
- CI integration: a script in `package.json` runs evaluations and exits non‑zero if scores fall below thresholds.

### BDD
- Scenario: After modifying the system prompt, the developer runs `pnpm run eval`. The evaluation shows groundedness dropped from 0.92 to 0.81; the CI blocks merge until the regression is resolved.

### Deep Module
- Evaluation runner in `artifacts/api-server/src/lib/eval/`  
- Golden dataset stored in `data/eval/` directory

### Depends On
- TASK-012 (chat streaming API for running test completions)  
- TASK-017 (supervisor agent for complex evaluations)

### Blocks
- Production deployment gates for any prompt or model change

### Imports From
- `artifacts/api-server/src/lib/chat-service.ts`

### Exports To
- CI pipeline, developer workflow

### Definition of Done
- A golden dataset directory `data/eval/` contains at least 20 examples per AI feature (chat Q&A, task summarization, code review).
- Each example is a JSON file with `input`, `expected_output`, and `evaluation_criteria`.
- An evaluation runner `artifacts/api-server/src/lib/eval/runner.ts` loads examples, invokes the AI pipeline, and scores outputs across five dimensions:
  1. **Correctness** – automated comparison against expected output (exact match, BLEU, etc.)
  2. **Groundedness** – verifies that answer claims can be traced to source citations
  3. **Safety** – checks for PII leaks, toxic content, prompt injection vulnerabilities
  4. **Cost & Latency** – records token usage and response time per example
  5. **Regression Stability** – compares current scores against a stored baseline
- `pnpm run eval` executes the suite and outputs a summary report.
- A GitHub Actions workflow (or similar) runs evaluations on every PR that modifies prompt templates or model configuration; it blocks merge if any score regresses >5%.
- Baseline scores are stored in `data/eval/baselines/` and updated on approved merges.

### Out of Scope
- Continuous evaluation in production (monitoring for drift)
- LLM‑as‑judge for nuanced evaluations (optional future enhancement)

### Advanced Code Patterns
- Scorer interface allowing pluggable evaluation strategies
- Deterministic evaluation for correctness; statistical stability via multiple runs for non‑deterministic scores
- CI‑gated deployment using `eval` script exit codes

### Anti‑Patterns
- Relying solely on manual QA without automated regression detection
- Using a golden dataset that doesn't cover diverse edge cases
- Skipping groundedness evaluation (the most expensive failure at enterprise scale)

### Subtasks

- [ ] `TASK-018.1` Create the evaluation runner framework in `artifacts/api-server/src/lib/eval/runner.ts` with a pluggable scorer interface.
- [ ] `TASK-018.2` Implement the five scorers: correctness, groundedness, safety, cost‑latency, regression.
- [ ] `TASK-018.3` Curate a golden dataset of at least 20 examples for chat Q&A and save in `data/eval/chat/`.
- [ ] `TASK-018.4` Add the `eval` script to `artifacts/api-server/package.json` that runs the runner.
- [ ] `TASK-018.5` Integrate the eval script into CI (GitHub Actions) with a regression threshold of 5%.
- [ ] `TASK-018.6` Document how to add new examples and update baselines in a contributing guide.

# Phase 3 — CRM, Documents, Knowledge & Content Domains

---

## [ ] TASK-019 — CRM, Client & Agreement Schema

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Relationship Management  
- Core entities: Client, Contact, Opportunity (Deal), Agreement, AgreementVersion, SignatureRequest

### TDD
- Schema migration tests: confirm all tables exist with correct columns, enums, foreign keys, and constraints.
- Test that an agreement version chain is immutable and properly references its parent agreement.

### BDD
- Scenario: A sales user creates a client record, adds contacts, tracks an opportunity through pipeline stages, drafts an agreement, publishes versions, and sends a signature request — all relational data is stored correctly.

### Deep Module
- Database schema boundary in `lib/db/src/schema/crm.ts` and `lib/db/src/schema/agreements.ts`

### Depends On
- TASK-003 (extensions)  
- TASK-004 (multi‑tenant isolation)

### Blocks
- TASK-020 (CRM & Agreement APIs)  
- TASK-034 (frontend CRM wiring)  
- TASK-040 (cross‑module integration)

### Imports From
- `lib/db/src/schema/helpers.ts`

### Exports To
- CRM pages, client detail, agreements, marketing attribution, finance links

### Definition of Done
- `clients` table exists with: `id`, `tenant_id`, `salutation`, `first_name`, `middle_name`, `last_name`, `suffix`, `preferred_name`, `date_of_birth`, `gender`, `preferred_language`, `company`, `job_title`, `status` (enum: `active`, `inactive`, `at-risk`, `new`), `source`, `crm_contact_id` (nullable), `client_owner`, `notes`, `last_activity_at`, `created_at`, `updated_at`.
- `client_emails`, `client_phones`, `client_websites`, `client_social_profiles` as separate tables with FK to `clients`.
- `client_addresses` table for physical, mailing, business addresses with `address_type` enum.
- `contacts` table (CRM contacts) with: `id`, `tenant_id`, `client_id` (nullable FK — a CRM contact can be converted to a client), `name`, `email`, `company`, `phone`, `lead_score`, `status` (enum: `hot`, `warm`, `cold`), `tags` (text array), `last_activity_at`.
- `opportunities` table (deals): `id`, `tenant_id`, `client_id`, `contact_id`, `name`, `value`, `stage` (enum: `prospecting`, `qualification`, `proposal`, `negotiation`, `closed-won`, `closed-lost`), `win_probability` (integer 0–100), `expected_close_date`, `created_at`, `updated_at`.
- `agreements` table: `id`, `tenant_id`, `client_id`, `title`, `status` (enum: `draft`, `sent`, `viewed`, `signed`, `expired`), `value`, `sent_at`, `opened_count`, `engagement_score`, `created_at`, `updated_at`.
- `agreement_versions` table: `id`, `agreement_id`, `version_number`, `content` (or storage_ref), `created_by`, `created_at`.
- `signature_requests` table: `id`, `agreement_version_id`, `signer_email`, `status` (enum: `pending`, `completed`, `declined`), `external_envelope_id`, `requested_at`, `signed_at`.
- All tables include `tenant_id` and RLS policies.
- Insert and select types exported.

### Out of Scope
- Full e‑signature provider integration (DocuSign/HelloSign — we store envelope ID and status)
- Email campaign execution (outreach schema in a later task)

### Advanced Code Patterns
- Separate contact details into normalized tables for emails, phones, websites, socials
- Agreement version chain with immutable `version_number`
- Explicit pipeline stage enum with documented valid transitions

### Anti‑Patterns
- Storing all client details in one monolithic JSON column
- Encoding pipeline stages as free‑text strings
- Using a single "CRM" table for contacts, clients, and deals without boundaries

### Subtasks

- [ ] `TASK-019.1` Create `lib/db/src/schema/clients.ts` with tables `clients`, `client_emails`, `client_phones`, `client_websites`, `client_social_profiles`, `client_addresses`. Use `pgEnum` for client status, email type, phone type, gender, salutation, address type.
- [ ] `TASK-019.2` Create `lib/db/src/schema/crm.ts` with tables `contacts` and `opportunities`. Use `pgEnum` for contact status and opportunity stage.
- [ ] `TASK-019.3` Create `lib/db/src/schema/agreements.ts` with tables `agreements`, `agreement_versions`, `signature_requests`. Use `pgEnum` for agreement status and signature status.
- [ ] `TASK-019.4` Add `tenant_id` and RLS policies to all tables.
- [ ] `TASK-019.5` Add foreign keys: `clients` → optional `crm_contact_id`; `opportunities` → `client_id` and `contact_id`; `agreements` → `client_id`; `signature_requests` → `agreement_version_id`.
- [ ] `TASK-019.6` Export all new schemas from `lib/db/src/schema/index.ts`; generate Drizzle types.
- [ ] `TASK-019.7` Write schema tests for client-contact relationships and agreement version chains.

---

## [ ] TASK-020 — CRM, Client & Agreement APIs

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Relationship Management  
- Application services: ManageClients, ManageContacts, ManageOpportunities, ManageAgreements, RecordSignatureState

### TDD
- Integration tests: CRUD for clients, contacts, and agreements; pipeline movement of opportunities; versioned agreement creation; signature request recording.

### BDD
- Scenario: A salesperson opens the CRM page, sees the contact list and pipeline. They create a new client from a CRM contact, add a deal, advance it through stages. They draft an agreement, send it for signature, and track its status until signed.

### Deep Module
- API route and service boundary in `artifacts/api-server/src/routes/clients.ts`, `artifacts/api-server/src/routes/crm.ts`, `artifacts/api-server/src/routes/agreements.ts`

### Depends On
- TASK-007 (authorization middleware)  
- TASK-019 (CRM schema)

### Blocks
- TASK-034 (frontend CRM & client wiring)  
- TASK-040 (cross‑module integration)

### Imports From
- `lib/db/src/schema/clients.ts`  
- `lib/db/src/schema/crm.ts`  
- `lib/db/src/schema/agreements.ts`  
- `lib/api-spec/openapi.yaml`

### Exports To
- CRM pages, client detail, agreements page, pipeline board

### Definition of Done
- `POST/GET/PUT/DELETE /clients` and `/clients/:id` endpoints with full CRUD.
- `GET /clients/:id/contacts` – list contacts for a client.
- `GET /clients/:id/projects`, `GET /clients/:id/documents`, `GET /clients/:id/agreements`, `GET /clients/:id/appointments` – cross‑linked endpoints (using entity linker).
- `POST/GET /contacts` – contact CRUD.
- `GET /pipeline` – returns opportunities grouped by stage.
- `POST /opportunities`, `PATCH /opportunities/:id` – create and move deals.
- `POST/GET /agreements` – create/read agreements.
- `POST /agreements/:id/versions` – create a new version.
- `PATCH /agreements/:id/signature` – update signature state.
- All endpoints protected and validated.
- `openapi.yaml` updated; client libraries regenerated; workspace typecheck passes.

### Out of Scope
- Full multi‑touch attribution (marketing analytics schema)
- Automated reminder emails for expiring agreements

### Advanced Code Patterns
- Cross‑module entity linking via dedicated endpoints
- Optimistic concurrency for pipeline stage changes
- Signature state machine with valid transitions

### Anti‑Patterns
- Returning client detail with full relational data in one giant response without pagination
- Allowing direct mutation of agreement versions without version chaining

### Subtasks

- [ ] `TASK-020.1` Add client, contact, opportunity, and agreement endpoints to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-020.2` Create `artifacts/api-server/src/routes/clients.ts` with CRUD and cross‑linked sub‑resources.
- [ ] `TASK-020.3` Create `artifacts/api-server/src/routes/crm.ts` with contacts and pipeline management routes.
- [ ] `TASK-020.4` Create `artifacts/api-server/src/routes/agreements.ts` with CRUD, versioning, and signature state updates.
- [ ] `TASK-020.5` Create service files: `artifacts/api-server/src/lib/client-service.ts`, `crm-service.ts`, `agreement-service.ts`.
- [ ] `TASK-020.6` Register routers in `artifacts/api-server/src/routes/index.ts`.
- [ ] `TASK-020.7` Run `codegen`; verify typecheck; write integration tests for pipeline movement and agreement version chaining.

---

## [ ] TASK-021 — Document, Knowledge & Storage Schema

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Knowledge & Document Management  
- Core entities: Document, DocumentVersion, StorageReference, KnowledgeEntry (SOP, Wiki, Training, Certification)

### TDD
- Schema tests: document version chains are preserved; knowledge entries are typed by category; polymorphic linking to any entity works.

### BDD
- Scenario: A user uploads a document, which creates a document record with a storage reference. A knowledge article is created with a category (SOP, Wiki) and is searchable.

### Deep Module
- Database schema boundary in `lib/db/src/schema/documents.ts`, `lib/db/src/schema/knowledge.ts`

### Depends On
- TASK-003, TASK-004

### Blocks
- TASK-022 (Document & Knowledge APIs)  
- TASK-035 (frontend wiring)

### Imports From
- `lib/db/src/schema/helpers.ts`

### Exports To
- Documents page, knowledge pages, chat attachments, client document links

### Definition of Done
- `documents` table: `id`, `tenant_id`, `name`, `type` (enum: `pdf`, `spreadsheet`, `doc`, `image`, `code`), `status` (enum: `approved`, `pending`, `draft`, `requires_signature`, `expired`), `access_level` (enum: `private`, `team`, `public`), `owner_id`, `folder`, `starred`, `created_at`, `updated_at`.
- `document_versions` table: `id`, `document_id`, `version_number`, `storage_reference_id`, `created_by`, `created_at`.
- `storage_references` table: `id`, `tenant_id`, `bucket`, `key`, `original_filename`, `mime_type`, `size_bytes`, `created_at` — stores the S3/R2 object location.
- `entity_documents` polymorphic table: `id`, `document_id`, `entity_type` (text), `entity_id` (uuid), `linked_at` — enables linking documents to any entity (client, project, task, employee, etc.).
- `knowledge_entries` table: `id`, `tenant_id`, `title`, `content`, `category` (enum: `sop`, `wiki`, `training`, `certification`), `status` (enum: `current`, `needs-review`, `draft`, `published`), `role`, `department`, `tags` (text array), `author_id`, `review_due_at`, `created_at`, `updated_at`.
- `knowledge_versions` table: `id`, `knowledge_entry_id`, `content`, `edited_by`, `created_at`.
- `certification_records` table: `id`, `tenant_id`, `employee_id`, `certification_name`, `issuing_body`, `issued_at`, `expires_at`, `credential_id`, `status` (enum: `compliant`, `at-risk`, `overdue`), `created_at`, `updated_at`.
- All tables have `tenant_id` and RLS.

### Out of Scope
- Full‑text search index (built in later task using `tsvector`)
- Vector embedding for knowledge entries (can reuse RAG pipeline from TASK-016)

### Advanced Code Patterns
- Polymorphic entity linking via `entity_type` + `entity_id` pattern
- Separate storage references from business metadata
- Immutable version history

### Anti‑Patterns
- Storing file binary in the database
- Mixing document metadata and knowledge content in the same table

### Subtasks

- [ ] `TASK-021.1` Create `lib/db/src/schema/documents.ts` with `documents`, `document_versions`, `storage_references`, and `entity_documents`.
- [ ] `TASK-021.2` Create `lib/db/src/schema/knowledge.ts` with `knowledge_entries`, `knowledge_versions`, and `certification_records`.
- [ ] `TASK-021.3` Add `tenant_id` and RLS policies to all tables.
- [ ] `TASK-021.4` Export schemas from `lib/db/src/schema/index.ts` and generate Drizzle types.
- [ ] `TASK-021.5` Write schema tests for version chaining and polymorphic linking.

---

## [ ] TASK-022 — Document, Knowledge & Upload APIs

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Knowledge & Document Management  
- Application services: UploadDocument, ManageVersions, ManageKnowledgeEntries, SearchKnowledge, LinkDocumentToEntity

### TDD
- Integration tests: upload a file (using a mock storage adapter), verify document record is created; create a knowledge entry, retrieve it; link a document to a project.

### BDD
- Scenario: A user uploads a contract PDF; it appears in the documents list. Later, they link it to a client from the client detail page. In the knowledge module, they create an SOP with version history.

### Deep Module
- Upload, storage, and document/knowledge route boundary in `artifacts/api-server/src`

### Depends On
- TASK-007 (authorization)  
- TASK-021 (document/knowledge schema)  
- File storage service infrastructure (S3/R2 pre‑signed URLs from Phase 1 config)

### Blocks
- TASK-035 (frontend wiring)

### Imports From
- `lib/db/src/schema/documents.ts`  
- `lib/db/src/schema/knowledge.ts`  
- `lib/api-spec/openapi.yaml`

### Exports To
- Documents page, client detail, knowledge pages, chat attachments

### Definition of Done
- `POST /files/upload` – returns a pre‑signed URL for direct upload to S3/R2; after upload, client calls `POST /documents` with the storage key and metadata.
- `POST /documents` – creates a document record with an initial version linking to a storage reference.
- `GET /documents` – list/filter documents.
- `GET /documents/:id` – document detail with version history.
- `POST /documents/:id/versions` – upload a new version.
- `POST /documents/:id/link` – link document to an entity (client, project, task, employee).
- `GET /knowledge` – list knowledge entries with filtering by category, status, role.
- `POST /knowledge` – create knowledge entry.
- `PATCH /knowledge/:id` – update entry, creating a new version.
- `GET /knowledge/search` – full‑text search endpoint (using PostgreSQL `tsvector`).
- `GET /certifications` – list certification records; filterable by employee and status.
- All endpoints protected and validated.
- `openapi.yaml` updated; client libraries regenerated; workspace typecheck passes.

### Out of Scope
- OCR or automatic document classification
- Advanced ACL for document access beyond team/public/private levels

### Advanced Code Patterns
- Pre‑signed URL upload pattern avoiding server bandwidth
- Polymorphic linking via `/link` endpoint
- Versioned knowledge entries with audit trail

### Anti‑Patterns
- Uploading files through the API server instead of direct S3/R2
- Mutating knowledge entries without creating new versions

### Subtasks

- [ ] `TASK-022.1` Add document, upload, and knowledge endpoints to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-022.2` Create `artifacts/api-server/src/routes/documents.ts` with CRUD, versioning, and linking routes.
- [ ] `TASK-022.3` Create `artifacts/api-server/src/routes/knowledge.ts` for SOPs, wiki, training, and certification operations.
- [ ] `TASK-022.4` Create `artifacts/api-server/src/lib/storage-service.ts` (pre‑signed URL generation for S3/R2) and `artifacts/api-server/src/lib/document-service.ts`.
- [ ] `TASK-022.5` Create `artifacts/api-server/src/lib/knowledge-service.ts` with versioning and search logic.
- [ ] `TASK-022.6` Register the new routers in `artifacts/api-server/src/routes/index.ts`.
- [ ] `TASK-022.7` Run `codegen`; verify typecheck; write integration tests for upload and knowledge versioning.

---

## [ ] TASK-023 — Email Schema & API

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Communication  
- Core entities: EmailAccount, EmailMessage, EmailFolder, EmailDraft

### TDD
- Integration tests: create an email account, sync messages (mock IMAP/SMTP), retrieve inbox, send message, manage folders.

### BDD
- Scenario: A user connects their Gmail and Outlook accounts. The unified inbox shows messages from both. The user can compose, send, and see sent messages. Folders and labels are synced.

### Deep Module
- Email route and service boundary in `artifacts/api-server/src`

### Depends On
- TASK-007 (authorization)  
- Optional: external email provider integration (mock initially)

### Blocks
- TASK-037 (frontend wiring for email inbox)

### Imports From
- `lib/api-spec/openapi.yaml`

### Exports To
- Multi‑account email inbox page

### Definition of Done
- `email_accounts` table: `id`, `tenant_id`, `user_id`, `provider` (enum: `gmail`, `outlook`, `imap`), `email_address`, `display_name`, `oauth_token` (encrypted), `sync_status`, `last_synced_at`.
- `email_messages` table: `id`, `account_id`, `folder_id`, `message_id_header`, `from_address`, `to_address`, `subject`, `body_preview`, `body_full`, `is_read`, `is_starred`, `has_attachments`, `received_at`.
- `email_folders` table: `id`, `account_id`, `name`, `type` (enum: `inbox`, `sent`, `drafts`, `archive`, `trash`, `custom`).
- `email_drafts` table: `id`, `account_id`, `to`, `subject`, `body`, `created_at`, `updated_at`.
- REST endpoints: `GET /email/accounts`, `POST /email/accounts` (add account), `GET /email/accounts/:id/messages` (with folder and search filters), `POST /email/accounts/:id/send`, `POST /email/drafts`, `PATCH /email/drafts/:id`, `POST /email/messages/:id/star`, etc.
- All endpoints protected.
- `openapi.yaml` updated; client libraries regenerated; workspace typecheck passes.

### Out of Scope
- Real‑time mail sync via Google Pub/Sub or Microsoft Graph webhooks (polling or manual sync is acceptable)
- Email‑to‑CRM automatic linking

### Advanced Code Patterns
- Encrypted storage of OAuth tokens
- Server‑side pagination for message lists
- Draft auto‑save via debounced PATCH

### Anti‑Patterns
- Storing email content without considering storage size (use `body_preview` for lists and lazy‑load full body)
- Mixing email operations from different accounts without account‑scoped queries

### Subtasks

- [ ] `TASK-023.1` Create `lib/db/src/schema/email.ts` with tables `email_accounts`, `email_messages`, `email_folders`, `email_drafts`. Use `pgEnum` for provider, folder type.
- [ ] `TASK-023.2` Add email endpoints to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-023.3` Create `artifacts/api-server/src/routes/email.ts` with CRUD routes for accounts, messages, drafts, and folders.
- [ ] `TASK-023.4` Create `artifacts/api-server/src/lib/email-service.ts` with business logic (mock provider initially).
- [ ] `TASK-023.5` Register email router; run `codegen`; verify typecheck; write integration tests.

---

## [ ] TASK-024 — Asset Schema & API

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Asset Management  
- Core entities: Asset, AssetCategory, DepreciationSchedule, MaintenanceRecord

### TDD
- Integration tests: create asset, view catalog, calculate depreciation, record maintenance, filter by industry.

### BDD
- Scenario: An operations manager adds a new asset (e.g., a vehicle), categorizes it, views its current value and depreciation schedule, logs a maintenance event, and sees it in the maintenance queue.

### Deep Module
- Asset route and service boundary in `artifacts/api-server/src`

### Depends On
- TASK-007 (authorization)  
- TASK-003, TASK-004

### Blocks
- TASK-037 (frontend wiring for assets)

### Imports From
- `lib/api-spec/openapi.yaml`

### Exports To
- Assets page (all tabs), asset valuation, maintenance tracking

### Definition of Done
- `assets` table: `id`, `tenant_id`, `name`, `category_id`, `industry` (enum: `digital`, `food`, `product`, `equipment`, `real_estate`, `fleet`), `sku`, `quantity`, `unit`, `current_value`, `purchase_cost`, `location`, `status` (enum: `active`, `low_stock`, `expiring`, `maintenance`, `inactive`, `critical`), `condition` (enum: `excellent`, `good`, `fair`, `poor`), `serial_number`, `supplier`, `reorder_point`, `depreciation_rate_pct`, `notes`, `created_at`, `updated_at`.
- `asset_categories` table: `id`, `tenant_id`, `name`.
- `depreciation_schedules` table: `id`, `asset_id`, `period` (date), `depreciation_amount`, `accumulated_depreciation`.
- `maintenance_records` table: `id`, `asset_id`, `description`, `performed_by`, `performed_at`, `next_due_at`.
- REST endpoints: `GET /assets` with industry/status filters, `POST /assets`, `PATCH /assets/:id`, `GET /assets/:id/depreciation`, `POST /assets/:id/maintenance`.
- All endpoints protected.
- `openapi.yaml` updated; client libraries regenerated; workspace typecheck passes.

### Out of Scope
- External depreciation calculation engines
- Barcode/QR scanning

### Advanced Code Patterns
- Server‑side depreciation calculation on request
- Industry‑preset metadata stored as lookup table
- Maintenance records as append‑only log

### Anti‑Patterns
- Storing all asset attributes in a single JSON column
- Computing depreciation only on the frontend

### Subtasks

- [ ] `TASK-024.1` Create `lib/db/src/schema/assets.ts` with tables `assets`, `asset_categories`, `depreciation_schedules`, `maintenance_records`. Use `pgEnum` for status, condition, industry.
- [ ] `TASK-024.2` Add asset endpoints to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-024.3` Create `artifacts/api-server/src/routes/assets.ts` and `artifacts/api-server/src/lib/asset-service.ts`.
- [ ] `TASK-024.4` Register asset router; run `codegen`; verify typecheck; write integration tests for depreciation and maintenance flows.

---

## [ ] TASK-025 — Feature Flag & Kill Switch Infrastructure

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- N/A (Infrastructure / Operations)

### TDD
- Test that a feature flag set to `false` prevents the gated code path from executing; toggling it `true` enables it within the same request.

### BDD
- Scenario: The AI content generator is deployed but gated behind a feature flag. The product manager enables it for 10% of tenants. If an issue is detected, the flag is turned off, and the feature is disabled within seconds without a redeploy.

### Deep Module
- Feature flag service in `artifacts/api-server/src/lib/feature-flags.ts`  
- Unleash server integration (self‑hosted on Docker)

### Depends On
- TASK-002 (environment config) — Unleash server URL and API key

### Blocks
- Any AI feature deployment that needs gradual rollout or kill switches

### Imports From
- Unleash SDK client

### Exports To
- All LLM‑calling services, MCP tool invocations, and any experimental feature

### Definition of Done
- A self‑hosted Unleash instance is running (Docker Compose) and accessible to the API server.
- `artifacts/api-server/src/lib/feature-flags.ts` initializes the Unleash client and exports a typed `isEnabled(flagName, context)` function.
- Defined flags include: `ai-chat-streaming`, `ai-content-generation`, `ai-supervisor`, `mcp-tool-execution`, `rag-hybrid-search`.
- All AI‑gated code paths call `isEnabled` before executing; if disabled, the API returns a 503 or a graceful fallback.
- The Unleash admin UI is accessible for operators to toggle flags.

### Out of Scope
- A/B experiment analysis
- User‑specific targeting (initially tenant‑level)

### Advanced Code Patterns
- Feature flag service abstracting Unleash SDK for easy testing
- Gating at the service layer, not scattered across controllers
- Kill switch with 10‑second propagation delay

### Anti‑Patterns
- Hardcoding feature availability in environment variables without runtime toggle
- Wrapping every line of code in flag checks (gate at entry points only)

### Subtasks

- [ ] `TASK-025.1` Add Unleash server to Docker Compose in the repository root `docker-compose.yml`.
- [ ] `TASK-025.2` Create `artifacts/api-server/src/lib/feature-flags.ts` initializing the Unleash client with the server URL and API key.
- [ ] `TASK-025.3` Define all initial feature flags in Unleash admin UI and document them in `docs/feature-flags.md`.
- [ ] `TASK-025.4` Integrate `isEnabled` checks at the entry points of AI chat streaming, content generation, supervisor agent, MCP tool execution, and RAG hybrid search.
- [ ] `TASK-025.5` Write integration tests: verify that a disabled flag rejects requests; enabling it allows requests within the same test run.

---

## [ ] TASK-026 — Token Budget Enforcement & Cost Governance

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Agent Orchestration / Cost Analytics  
- Policy: Per‑tenant token budget with hard kill‑switch

### TDD
- Integration test: simulate a tenant exceeding their budget; subsequent LLM calls return 429 or are blocked.

### BDD
- Scenario: A tenant has a monthly token budget of 1M tokens. Mid‑month, they hit the cap. The system stops processing their AI requests and returns a clear message. The tenant can upgrade their plan via Stripe to increase the budget.

### Deep Module
- Cost tracking service in `artifacts/api-server/src/lib/cost-service.ts`  
- Middleware in `artifacts/api-server/src/middlewares/token-budget.ts`

### Depends On
- TASK-009 (agent runs with token usage columns)  
- TASK-012 (chat streaming that logs LLM tokens)

### Blocks
- Production deployment of AI features without cost runaway

### Imports From
- `lib/db/src/schema/agents.ts` (for aggregating `agent_runs.token_usage_*`)

### Exports To
- Every LLM‑calling service must check budget before invocation

### Definition of Done
- A `tenant_token_budgets` table (or a column on `tenants`/`workspace_settings`) stores `monthly_token_limit` and `current_usage` per tenant.
- Every LLM call (chat, agent, embedding) logs token usage (input + output) to a `token_usage_events` table, keyed by tenant and timestamp.
- A middleware or service method `checkBudget(tenantId)` called before LLM invocation:
  - Queries `current_usage` for the current billing period.
  - If `current_usage >= monthly_token_limit` and the tenant is not in a grace period, throws a `BudgetExceededError` (HTTP 429).
- `current_usage` is updated atomically (using database transactions or atomic increments) after each LLM call.
- Four‑layer token attribution (Prompt, Tool, Memory, Response) is logged as metadata for analytics but aggregated to total for enforcement.
- The budget can be configured via workspace settings; default limits per plan are in Stripe metadata.

### Out of Scope
- Real‑time cost alerts to tenants
- Automatic budget scaling based on Stripe subscription changes (handled via webhook in later billing task)

### Advanced Code Patterns
- Atomic increment of usage counter using `UPDATE ... SET current_usage = current_usage + $1 WHERE tenant_id = $2 RETURNING current_usage`
- Budget check as a pre‑condition in a middleware wrapping LLM calls
- Separate analytics event table for detailed token breakdown without affecting enforcement performance

### Anti‑Patterns
- Aggregating usage only periodically (allows burst spending beyond budget)
- Hardcoding budget limits in code instead of per‑tenant configuration

### Subtasks

- [ ] `TASK-026.1` Create `lib/db/src/schema/billing.ts` with tables `tenant_token_budgets` (monthly_limit, current_usage, reset_date) and `token_usage_events` (tenant_id, timestamp, model, input_tokens, output_tokens, cost, metadata JSONB).
- [ ] `TASK-026.2` Implement `artifacts/api-server/src/lib/cost-service.ts` with `recordUsage(tenantId, tokens, cost)` (atomic update) and `checkBudget(tenantId)`.
- [ ] `TASK-026.3` Create middleware `artifacts/api-server/src/middlewares/token-budget.ts` that calls `checkBudget` before LLM endpoints.
- [ ] `TASK-026.4` Integrate token recording into chat stream and agent invocation services.
- [ ] `TASK-026.5` Write integration tests: verify budget enforcement and atomic counter integrity.

# Phase 4 — Finance, Marketing, Team & Compliance Domains

---

## [ ] TASK-027 — Finance Schema

**Status:** `NOT_STARTED`  
**Size:** `MEDIUM`

### DDD
- Bounded context: Finance  
- Core entities: Account, Transaction, Invoice, Bill, JournalEntry, JournalEntryLine, Budget, Goal

### TDD
- Schema migration tests: all tables created with correct enums, foreign keys, and check constraints (e.g., journal entry lines must balance to zero).
- Test that a journal entry cannot be posted with unbalanced debits and credits.

### BDD
- Scenario: A finance user records a transaction, creates an invoice for a client, records a vendor bill, posts a balanced journal entry, sets a budget, and defines a savings goal — all data is stored with proper referential integrity.

### Deep Module
- Database schema boundary in `lib/db/src/schema/finance.ts`

### Depends On
- TASK-003 (extensions)  
- TASK-004 (multi‑tenant isolation)  
- TASK-019 (clients schema — for linking invoices to clients)  
- TASK-023 (vendors not yet created — we'll create a minimal vendors schema here or reference later)

### Blocks
- TASK-028 (Finance APIs)  
- TASK-037 (frontend wiring)

### Imports From
- `lib/db/src/schema/helpers.ts`

### Exports To
- Finance dashboard, reports, invoices, bills, budget, and goals pages

### Definition of Done
- `accounts` (Chart of Accounts): `id`, `tenant_id`, `code`, `name`, `type` (enum: `asset`, `liability`, `equity`, `income`, `expense`), `subtype`, `is_active`, `created_at`.
- `transactions`: `id`, `account_id`, `tenant_id`, `description`, `amount`, `category`, `date`, `is_reconciled`, `source` (enum: `manual`, `imported`), `counterparty`, `created_at`.
- `invoices`: `id`, `tenant_id`, `client_id`, `invoice_number`, `amount`, `status` (enum: `draft`, `sent`, `paid`, `overdue`, `cancelled`), `issued_at`, `due_at`, `paid_at`, `created_at`.
- `bills`: `id`, `tenant_id`, `vendor_id`, `bill_number`, `amount`, `due_at`, `status` (enum: `draft`, `pending-approval`, `scheduled`, `paid`, `overdue`), `category`, `created_at`.
- `journal_entries`: `id`, `tenant_id`, `description`, `reference`, `status` (enum: `draft`, `posted`), `date`, `created_at`.
- `journal_entry_lines`: `id`, `journal_entry_id`, `account_id`, `debit`, `credit` — with a CHECK constraint ensuring `debit + credit` isn't both zero and that line‑level sums are valid; a trigger or application logic ensures total debits = total credits.
- `budgets`: `id`, `tenant_id`, `category`, `budgeted_amount`, `period_start`, `period_end`, `created_at`.
- `goals`: `id`, `tenant_id`, `name`, `target_amount`, `current_amount`, `created_at`.
- All tables have `tenant_id` and RLS.
- Insert/select types exported.

### Out of Scope
- Actual bank transaction import via Plaid (schema only)  
- Full double‑entry ledger engine (pgledger integration deferred)

### Advanced Code Patterns
- Double‑entry accounting with balanced journal entries enforced at the database level
- Append‑only financial records (no mutation of posted entries)
- Separate invoice/bill status enums for lifecycle tracking

### Anti‑Patterns
- Storing financial amounts without Decimal/numeric type (use `numeric(15,2)`)
- Allowing deletion of posted journal entries

### Subtasks

- [ ] `TASK-027.1` Create `lib/db/src/schema/finance.ts` with tables `accounts`, `transactions`, `invoices`, `bills`, `journal_entries`, `journal_entry_lines`, `budgets`, `goals`.
- [ ] `TASK-027.2` Define `pgEnum` for account type, transaction source, invoice/bill status, journal entry status, and budget category.
- [ ] `TASK-027.3` Add CHECK constraints on `journal_entry_lines` to prevent zero‑value lines; add application‑level validation for balanced entries.
- [ ] `TASK-027.4` Add `tenant_id` and RLS to all tables; export schema; generate Drizzle types.
- [ ] `TASK-027.5` Write schema tests for journal entry balance constraints and invoice status transitions.

---

## [ ] TASK-028 — Finance APIs

**Status:** `NOT_STARTED`  
**Size:** `MEDIUM`

### DDD
- Bounded context: Finance  
- Application services: ManageAccounts, RecordTransaction, IssueInvoice, RecordBill, PostJournalEntry, ManageBudget, TrackGoal

### TDD
- Integration tests for: chart of accounts CRUD, transaction recording, invoice lifecycle, bill management, journal entry posting with balance validation, budget tracking, goal progress.

### BDD
- Scenario: A finance user opens the overview dashboard and sees real net worth and cash flow. They create an invoice, send it, and track payment. A vendor bill is recorded and scheduled for payment. A journal entry is posted and appears in the ledger.

### Deep Module
- API route and service boundary in `artifacts/api-server/src/routes/finance.ts`

### Depends On
- TASK-007 (authorization)  
- TASK-027 (finance schema)

### Blocks
- TASK-037 (frontend finance wiring)

### Imports From
- `lib/db/src/schema/finance.ts`  
- `lib/api-spec/openapi.yaml`

### Exports To
- Finance overview, chart of accounts, transactions, invoices, bills, journal entries, reports, budget, goals pages

### Definition of Done
- Chart of Accounts endpoints: `GET /accounts`, `POST /accounts`.
- Transaction endpoints: `GET /transactions` (filterable, paginated), `POST /transactions`, `PATCH /transactions/:id` (reconciliation).
- Invoice endpoints: `POST /invoices`, `GET /invoices`, `PATCH /invoices/:id` (status updates, recorded payment).
- Bill endpoints: `POST /bills`, `GET /bills`, `PATCH /bills/:id` (approval, payment scheduling).
- Journal Entry endpoints: `POST /journal-entries` (validates balanced lines), `GET /journal-entries`, `PATCH /journal-entries/:id` (posting).
- Budget endpoints: `GET /budgets`, `POST /budgets` (with period and category).
- Goal endpoints: `GET /goals`, `POST /goals`, `PATCH /goals/:id` (update current amount).
- Financial reports endpoint: `GET /reports/income-statement`, `GET /reports/balance-sheet` — SQL aggregation from transactions and accounts.
- All endpoints protected and validated.
- `openapi.yaml` updated; client libraries regenerated; workspace typecheck passes.

### Out of Scope
- External bank sync (Plaid)  
- Tax engine integration

### Advanced Code Patterns
- Journal entry validation at the service layer with explicit error messages
- Financial reports as server‑side SQL aggregation, not frontend computation
- Invoice/bill status state machines

### Anti‑Patterns
- Calculating financial reports client‑side from raw transaction data
- Allowing deletion or mutation of posted financial records

### Subtasks

- [ ] `TASK-028.1` Add finance endpoints to `lib/api-spec/openapi.yaml` covering accounts, transactions, invoices, bills, journal entries, budgets, goals, and reports.
- [ ] `TASK-028.2` Create `artifacts/api-server/src/routes/finance.ts` with all routes, delegating to services.
- [ ] `TASK-028.3` Create `artifacts/api-server/src/lib/finance-service.ts` with business logic for each sub‑domain.
- [ ] `TASK-028.4` Register the finance router in `artifacts/api-server/src/routes/index.ts`.
- [ ] `TASK-028.5` Run `codegen`; verify typecheck; write integration tests for journal entry balancing and invoice lifecycle.

---

## [ ] TASK-029 — Marketing Schema

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Marketing Operations  
- Core entities: BrandAsset, SEOCampaign, SocialPost, SocialInboxItem, ContentItem, MarketingCampaign, MarketingAnalytics

### TDD
- Schema tests: all marketing entities created with correct types and references.

### BDD
- Scenario: A marketing manager adds brand assets, tracks SEO keywords, schedules social posts, reviews a unified inbox, manages content pipeline stages, and views campaign analytics — all persisted.

### Deep Module
- Database schema in `lib/db/src/schema/marketing.ts`

### Depends On
- TASK-003, TASK-004

### Blocks
- TASK-030 (Marketing APIs)  
- TASK-037 (frontend wiring)

### Imports From
- `lib/db/src/schema/helpers.ts`

### Exports To
- Marketing pages (Brand Kit, SEO, Socials, Content Management, Analytics)

### Definition of Done
- `brand_assets`: `id`, `tenant_id`, `name`, `type` (enum: `logo`, `guide`, `image`, `template`), `file_url`, `expires_at`, `status` (enum: `active`, `expiring`, `expired`), `created_at`.
- `seo_campaigns`: `id`, `tenant_id`, `keyword`, `position`, `change`, `volume`, `platform`, `tracked_at`.
- `social_posts`: `id`, `tenant_id`, `platform`, `content`, `scheduled_at`, `status` (enum: `draft`, `scheduled`, `published`, `failed`), `created_at`.
- `social_inbox_items`: `id`, `tenant_id`, `platform`, `user_handle`, `message`, `sentiment` (enum: `positive`, `neutral`, `negative`), `received_at`, `is_read`.
- `content_items`: `id`, `tenant_id`, `title`, `type` (enum: `blog`, `email`, `social`, `landing`, `video`), `stage` (enum: `ideation`, `briefed`, `drafting`, `review`, `approved`, `published`), `assignee`, `due_at`, `published_at`, `created_at`.
- `marketing_campaigns`: `id`, `tenant_id`, `name`, `type`, `budget_spend`, `attributed_revenue`, `start_at`, `end_at`.
- `marketing_analytics`: `id`, `tenant_id`, `channel`, `spend`, `revenue`, `roas`, `date_period`.
- All tables have `tenant_id` and RLS.

### Out of Scope
- External SEO crawler integration  
- Social media API posting (stores scheduled posts)

### Advanced Code Patterns
- Unified inbox as a query across platforms
- Content workflow stages as enums with transitions
- Analytics tables for aggregated reporting

### Anti‑Patterns
- Storing social messages without sentiment categorization
- Mixing content pipeline state with final published content in the same row

### Subtasks

- [ ] `TASK-029.1` Create `lib/db/src/schema/marketing.ts` with all marketing tables; define enums for asset status, post status, content type, stage, sentiment, etc.
- [ ] `TASK-029.2` Add `tenant_id` and RLS; export schema; generate Drizzle types.
- [ ] `TASK-029.3` Write schema tests for content workflow stage constraints.

---

## [ ] TASK-030 — Marketing APIs

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Marketing Operations  
- Application services: ManageBrandAssets, TrackSEO, ScheduleSocialPosts, ManageInbox, ManageContent, ManageCampaigns, ViewAnalytics

### TDD
- Integration tests: brand asset CRUD, SEO keyword listing, social post scheduling, inbox retrieval, content pipeline management, campaign creation, analytics queries.

### BDD
- Scenario: A marketing user updates brand colors, views keyword rankings, schedules a tweet, reviews incoming social messages, moves a blog post to review stage, and checks campaign ROI — all through the API.

### Deep Module
- API route and service boundary in `artifacts/api-server/src/routes/marketing.ts`

### Depends On
- TASK-007 (authorization)  
- TASK-029 (marketing schema)

### Blocks
- TASK-037 (frontend wiring)

### Imports From
- `lib/db/src/schema/marketing.ts`  
- `lib/api-spec/openapi.yaml`

### Exports To
- All marketing pages

### Definition of Done
- Brand Kit endpoints: `GET /brand-assets`, `POST /brand-assets`, `PATCH /brand-assets/:id`.
- SEO endpoints: `GET /seo/keywords` (filterable), `GET /seo/ai-visibility`.
- Socials endpoints: `POST /socials/posts` (schedule), `GET /socials/posts`, `GET /socials/inbox` (filterable), `PATCH /socials/inbox/:id` (mark read/reply).
- Content endpoints: `GET /content` (filter by stage/type), `POST /content`, `PATCH /content/:id` (move stage).
- Campaign endpoints: `GET /campaigns`, `POST /campaigns`.
- Analytics endpoints: `GET /marketing-analytics` (channel breakdown, revenue trend, insights).
- All endpoints protected and validated.
- `openapi.yaml` updated; client libraries regenerated; workspace typecheck passes.

### Out of Scope
- Real‑time social media platform integration
- AI content generation (wired to flag‑gated service)

### Advanced Code Patterns
- Content workflow state machine with validation on stage transitions
- Analytics aggregation via SQL queries
- Unified inbox query across multiple platform sources

### Anti‑Patterns
- Storing analytics data as raw logs without pre‑aggregation
- Allowing direct content stage transitions without validation

### Subtasks

- [ ] `TASK-030.1` Add marketing endpoints to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-030.2` Create `artifacts/api-server/src/routes/marketing.ts` with routes for brand assets, SEO, socials, content, campaigns, and analytics.
- [ ] `TASK-030.3` Create `artifacts/api-server/src/lib/marketing-service.ts` handling business logic.
- [ ] `TASK-030.4` Register the marketing router; run `codegen`; verify typecheck; write integration tests for content workflow and inbox.

---

## [ ] TASK-031 — Team & Calendar Schema

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Workforce Operations  
- Core entities: Employee, OnboardingPlan, OffboardingPlan, TimeOffRequest, CalendarEvent

### TDD
- Schema tests: employee records link to the identity user, time‑off requests have valid date ranges, calendar events support attendees.

### BDD
- Scenario: HR adds an employee record, assigns an onboarding checklist, the employee submits a time‑off request, which is approved, and the calendar shows both time‑off blocks and scheduled meetings.

### Deep Module
- Database schema in `lib/db/src/schema/team.ts` and `lib/db/src/schema/calendar.ts`

### Depends On
- TASK-003, TASK-004  
- TASK-006 (identity users exist via Clerk)

### Blocks
- TASK-032 (Team & Calendar APIs)  
- TASK-036 (frontend team wiring)

### Imports From
- `lib/db/src/schema/helpers.ts`

### Exports To
- Team pages, directory, time‑off workflows, calendar views

### Definition of Done
- `employees` table: `id`, `tenant_id`, `user_id` (FK to Clerk or internal users table), `first_name`, `last_name`, `email`, `role`, `department`, `employment_type` (enum: `FTE`, `contractor`), `start_date`, `status` (enum: `active`, `on-leave`, `terminated`), `manager_id`, `created_at`, `updated_at`.
- `onboarding_plans`: `id`, `employee_id`, `template_id`, `start_date`, `status` (enum: `pending`, `in-progress`, `completed`).
- `onboarding_tasks`: `id`, `plan_id`, `description`, `is_done`, `due_at`, `completed_at`.
- `offboarding_plans` and `offboarding_tasks` with similar structure.
- `time_off_requests`: `id`, `employee_id`, `type` (enum: `vacation`, `sick`, `personal`, `other`), `start_date`, `end_date`, `status` (enum: `pending`, `approved`, `declined`), `approved_by`, `created_at`.
- `calendar_events`: `id`, `tenant_id`, `title`, `description`, `start_at`, `end_at`, `all_day`, `event_type` (enum: `meeting`, `call`, `demo`, `interview`, `reminder`, `task_due`), `organizer_id`, `location`, `video_link`, `color`, `created_at`.
- `calendar_event_attendees`: `id`, `event_id`, `attendee_id` (employee or contact), `status`.
- All tables have `tenant_id` and RLS.

### Out of Scope
- External calendar sync (Google/Outlook)
- Payroll data

### Advanced Code Patterns
- Time‑off approval workflow via status transitions
- Calendar events polymorphic attendee linking
- Task due‑dates integrated as synthetic calendar events (generated from tasks table on query)

### Anti‑Patterns
- Storing time‑off without date validation (start <= end)
- Embedding attendee lists as JSON instead of normalized table

### Subtasks

- [ ] `TASK-031.1` Create `lib/db/src/schema/team.ts` with `employees`, `onboarding_plans`, `onboarding_tasks`, `offboarding_plans`, `offboarding_tasks`, `time_off_requests`.
- [ ] `TASK-031.2` Create `lib/db/src/schema/calendar.ts` with `calendar_events` and `calendar_event_attendees`.
- [ ] `TASK-031.3` Add `tenant_id` and RLS; export schemas; generate Drizzle types.
- [ ] `TASK-031.4` Write schema tests for time‑off date constraints and onboarding task completion tracking.

---

## [ ] TASK-032 — Team & Calendar APIs

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Workforce Operations  
- Application services: ManageEmployees, ManageOnboarding, ManageOffboarding, ProcessTimeOff, ManageCalendarEvents

### TDD
- Integration tests: employee CRUD, onboarding plan creation and task completion, time‑off request flow, calendar event creation with attendees, listing events by date range.

### BDD
- Scenario: HR adds a new employee, creates an onboarding plan with tasks. The employee's manager approves a time‑off request. A meeting is scheduled with multiple attendees and appears on the team calendar.

### Deep Module
- API route and service boundary in `artifacts/api-server/src/routes/team.ts` and `artifacts/api-server/src/routes/calendar.ts`

### Depends On
- TASK-007 (authorization)  
- TASK-031 (team & calendar schema)

### Blocks
- TASK-036 (frontend team wiring)  
- TASK-040 (cross‑module integration)

### Imports From
- `lib/db/src/schema/team.ts`, `calendar.ts`  
- `lib/api-spec/openapi.yaml`

### Exports To
- Team pages, directory, onboarding, offboarding, time‑off, calendar views

### Definition of Done
- Employee endpoints: `GET /employees` (searchable, filterable), `GET /employees/:id`, `POST /employees`, `PATCH /employees/:id`.
- Onboarding endpoints: `POST /employees/:id/onboarding` (create plan), `GET /employees/:id/onboarding`, `PATCH /onboarding-tasks/:id` (toggle complete).
- Offboarding endpoints: similar structure.
- Time‑off endpoints: `POST /time-off` (request), `GET /time-off` (list by employee/date), `PATCH /time-off/:id` (approve/decline).
- Calendar endpoints: `GET /calendar/events` (by date range), `POST /calendar/events`, `PATCH /calendar/events/:id`, `DELETE /calendar/events/:id`.
- All endpoints protected and validated.
- `openapi.yaml` updated; client libraries regenerated; workspace typecheck passes.

### Out of Scope
- Recurring event support (single events only initially)
- External calendar sync

### Advanced Code Patterns
- Time‑off balance calculation derived from approved requests
- Synthetic calendar events from tasks via a combined API query
- Approval workflow with audit trail (who approved, when)

### Anti‑Patterns
- Returning all calendar events without date range filtering
- Allowing time‑off requests without manager approval (enforced at service layer)

### Subtasks

- [ ] `TASK-032.1` Add employee, onboarding, offboarding, time‑off, and calendar event endpoints to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-032.2` Create `artifacts/api-server/src/routes/team.ts` with employee, onboarding, offboarding, and time‑off routes.
- [ ] `TASK-032.3` Create `artifacts/api-server/src/routes/calendar.ts` with calendar CRUD and task‑due‑date synthetic events.
- [ ] `TASK-032.4` Create service files: `artifacts/api-server/src/lib/team-service.ts` and `calendar-service.ts`.
- [ ] `TASK-032.5` Register routers; run `codegen`; verify typecheck; write integration tests for time‑off approval flow and calendar event listing.

---

## [ ] TASK-033 — Vendor Management Schema & API

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Vendor Management  
- Core entities: Vendor, VendorContact, Contract, PurchaseRequest, SpendRecord

### TDD
- Integration tests: vendor CRUD, contact management, contract date tracking, purchase request creation and approval flow, spend aggregation.

### BDD
- Scenario: A procurement manager adds a vendor with contacts and payment terms. They track contract dates with renewal alerts. A purchase request is submitted, approved, and the spend is visible in the spend dashboard.

### Deep Module
- Schema in `lib/db/src/schema/vendors.ts`; routes in `artifacts/api-server/src/routes/vendors.ts`

### Depends On
- TASK-007, TASK-003, TASK-004

### Blocks
- TASK-037 (frontend vendor wiring)

### Imports From
- `lib/db/src/schema/helpers.ts`

### Exports To
- Vendor pages (records, contracts, purchase approvals, spend visibility)

### Definition of Done
- `vendors` table: `id`, `tenant_id`, `name`, `category`, `primary_contact`, `payment_terms`, `status` (enum: `active`, `under-review`), `spend_ytd`, `created_at`.
- `vendor_contacts` table: `id`, `vendor_id`, `name`, `role`, `email`, `phone`.
- `contracts` table: `id`, `vendor_id`, `title`, `start_date`, `end_date`, `notice_deadline`, `status` (enum: `ok`, `warning`, `urgent`, `expired`), `created_at`.
- `purchase_requests` table: `id`, `vendor_id`, `description`, `amount`, `requested_by`, `status` (enum: `pending`, `approved`, `declined`), `created_at`, `resolved_at`.
- `spend_records` table: `id`, `vendor_id`, `category`, `approved_amount`, `ordered_amount`, `paid_amount`, `outstanding_amount`, `period`.
- Combined REST endpoints for all entities. All protected.
- `openapi.yaml` updated; client libraries regenerated.

### Out of Scope
- External supplier network integration
- Auto‑generation of purchase orders as PDF

### Advanced Code Patterns
- Contract awareness via server‑side date calculation for `notice_deadline`
- Spend aggregation via SQL GROUP BY queries

### Anti‑Patterns
- Storing monetary amounts as string
- Duplicating vendor data across purchase requests without FK

### Subtasks

- [ ] `TASK-033.1` Create `lib/db/src/schema/vendors.ts` with all vendor tables, enums, and RLS.
- [ ] `TASK-033.2` Add vendor endpoints to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-033.3` Create `artifacts/api-server/src/routes/vendors.ts` and `artifacts/api-server/src/lib/vendor-service.ts`.
- [ ] `TASK-033.4` Register vendor router; run `codegen`; verify typecheck; write integration tests for contract awareness and purchase approval flow.

---

## [ ] TASK-034 — Integrations (MCP Server) CRUD API

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Integration Management (extends the minimal schema from TASK-015)

### TDD
- Integration tests: add MCP server, list servers, update trust tier, delete.

### BDD
- Scenario: An admin navigates to the integrations page, adds a new MCP server with its endpoint and trust tier, sees it in the list, and can edit or remove it.

### Deep Module
- Routes in `artifacts/api-server/src/routes/integrations.ts`

### Depends On
- TASK-015 (MCP runtime and minimal schema) — we'll extend the schema from that task or create a separate CRUD layer.

### Blocks
- TASK-038 (frontend wiring)

### Imports From
- `lib/db/src/schema/integrations.ts` (from TASK-015)

### Exports To
- Functional integrations page

### Definition of Done
- CRUD endpoints for `mcp_servers` and `mcp_tools`:
  - `GET /integrations/servers` – list all MCP servers for tenant.
  - `POST /integrations/servers` – register a new server (with transport, endpoint, trust tier).
  - `PATCH /integrations/servers/:id` – update status, trust tier.
  - `DELETE /integrations/servers/:id` – remove.
  - `GET /integrations/servers/:id/tools` – list discovered tools.
- All endpoints protected.
- `openapi.yaml` updated; codegen run; typecheck passes.

### Out of Scope
- Real‑time connection health checks (separate background job)
- MCP protocol implementation (covered in TASK-015)

### Advanced Code Patterns
- Status management with `health_check` endpoint for each server
- Tool listing from database (populated by MCP runtime)

### Anti‑Patterns
- Hardcoding tool lists in UI without server‑side discovery

### Subtasks

- [ ] `TASK-034.1` Add integration server CRUD endpoints to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-034.2` Create `artifacts/api-server/src/routes/integrations.ts` with CRUD routes.
- [ ] `TASK-034.3` Create `artifacts/api-server/src/lib/integration-service.ts`.
- [ ] `TASK-034.4` Register router; run `codegen`; verify typecheck; write integration tests for server CRUD.

---

## [ ] TASK-035 — Workspace Configuration & Settings API

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: System Configuration

### TDD
- Integration tests: read workspace settings, update a setting, verify persistence.

### BDD
- Scenario: An admin changes the default AI model and interface density in the settings page; after saving, the settings persist and are reflected on next login.

### Deep Module
- Routes in `artifacts/api-server/src/routes/configuration.ts`

### Depends On
- TASK-007 (authorization)

### Blocks
- TASK-038 (frontend settings wiring)

### Imports From
- `lib/api-spec/openapi.yaml`

### Exports To
- Settings page

### Definition of Done
- Workspace settings table (can be a simple `workspace_settings` with `key`/`value` JSONB or dedicated columns).
- `GET /settings` – returns current workspace settings and user preferences.
- `PATCH /settings` – updates settings; validates schema.
- User preferences endpoint: `GET /preferences`, `PATCH /preferences`.
- All endpoints protected.
- `openapi.yaml` updated; codegen run; typecheck passes.

### Out of Scope
- Per‑user UI theme customization beyond dark mode and density
- Real‑time sync of settings across tabs

### Advanced Code Patterns
- Key‑value store with typed getters/setters
- Patch semantics for partial updates
- Default values returned when no override exists

### Anti‑Patterns
- Storing user preferences only in localStorage
- Requiring full object replacement for single key changes

### Subtasks

- [ ] `TASK-035.1` Create `lib/db/src/schema/configuration.ts` with tables `workspace_settings` and `user_preferences`.
- [ ] `TASK-035.2` Add settings endpoints to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-035.3` Create `artifacts/api-server/src/routes/configuration.ts` and `artifacts/api-server/src/lib/configuration-service.ts`.
- [ ] `TASK-035.4` Register router; run `codegen`; verify typecheck; write integration tests for settings persistence.

---

## [ ] TASK-036 — CRM Outreach Schema & API (Campaigns, Automations, SMS)

**Status:** `NOT_STARTED`  
**Size:** `MEDIUM`

### DDD
- Bounded context: Relationship Management / Outreach  
- Entities: EmailCampaign, SMSCampaign, ContactList, Automation, AutomationRule, CampaignEvent

### TDD
- Integration tests: campaign CRUD, adding contacts to a list, simulating a campaign send (event creation), listing automation rules.

### BDD
- Scenario: A marketing user creates an email campaign, selects a contact list, sends a test email. An automation is set to send a welcome email when a new contact is added; contact added triggers the automation.

### Deep Module
- Schema in `lib/db/src/schema/outreach.ts`; routes in `artifacts/api-server/src/routes/outreach.ts`

### Depends On
- TASK-007 (authorization)  
- TASK-019 (CRM contacts)

### Blocks
- TASK-037 (frontend CRM wiring)

### Imports From
- `lib/db/src/schema/crm.ts`

### Exports To
- Email page, SMS page, CRM analytics

### Definition of Done
- `email_campaigns`: `id`, `tenant_id`, `name`, `type` (enum: `standard`, `sequence`, `automated`), `status` (enum: `draft`, `active`, `paused`, `completed`), `sent_count`, `open_count`, `click_count`, `conversion_count`, `sent_at`.
- `sms_campaigns`: similar with delivery metrics.
- `contact_lists`: `id`, `tenant_id`, `name`, `contact_count`.
- `contact_list_members`: `id`, `list_id`, `contact_id`.
- `automations`: `id`, `tenant_id`, `name`, `trigger` (text description of trigger condition), `status` (enum: `active`, `paused`), `enrolled_count`, `completed_count`, `goal`.
- `automation_rules`: `id`, `automation_id`, `action_type` (email, SMS, task), `config` JSONB.
- `campaign_events`: `id`, `campaign_id`, `event_type` (open, click, conversion), `contact_id`, `occurred_at`.
- REST endpoints for CRUD and campaign event tracking.
- `openapi.yaml` updated; codegen run; typecheck passes.

### Out of Scope
- Actual email/SMS sending (provider integrations deferred)
- Complex rule engine evaluation (can be simple polling or trigger‑based)

### Advanced Code Patterns
- Automation triggers as structured JSON evaluated by a background job
- Campaign analytics derived from event records via SQL aggregation
- Contact list management separate from contacts

### Anti‑Patterns
- Embedding HTML email templates directly in campaign records
- Running automations on every request without batching

### Subtasks

- [ ] `TASK-036.1` Create `lib/db/src/schema/outreach.ts` with tables for email campaigns, SMS campaigns, contact lists, automations, automation rules, and campaign events.
- [ ] `TASK-036.2` Add outreach endpoints to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-036.3` Create `artifacts/api-server/src/routes/outreach.ts` and `artifacts/api-server/src/lib/outreach-service.ts`.
- [ ] `TASK-036.4` Register outreach router; run `codegen`; verify typecheck; write integration tests for campaign creation and event tracking.

---

## [ ] TASK-037 — Audit Log Schema & API

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: System Audit

### TDD
- Integration tests: an audit event is inserted after a critical action; querying the audit log returns the event with filters.

### BDD
- Scenario: An auditor filters the audit log by agent and date range, sees all actions, and searches for a specific keyword.

### Deep Module
- Schema in `lib/db/src/schema/audit.ts`; routes in `artifacts/api-server/src/routes/audit.ts`

### Depends On
- TASK-007 (authorization, admin only)

### Blocks
- TASK-038 (frontend wiring)

### Imports From
- `lib/db/src/schema/helpers.ts`

### Exports To
- Audit log page, SSE feed for activity

### Definition of Done
- `audit_events` table: `id`, `tenant_id`, `actor_id`, `action`, `entity_type`, `entity_id`, `old_values` JSONB, `new_values` JSONB, `metadata`, `created_at`.
- Append‑only: no UPDATE or DELETE allowed on audit rows.
- REST endpoint: `GET /audit` with filters (actor, action, entity_type, date range), search, and pagination.
- SSE endpoint `GET /audit/stream` for real‑time tailing (optional, can be added later).
- `openapi.yaml` updated; codegen run; typecheck passes.

### Out of Scope
- Long‑term archival

### Advanced Code Patterns
- Append‑only model with no mutation
- Efficient composite indexes for filter queries
- SSE streaming for live audit feed

### Anti‑Patterns
- Using audit table as general application log
- Allowing modification of audit records

### Subtasks

- [ ] `TASK-037.1` Create `lib/db/src/schema/audit.ts` with `audit_events` table (append‑only).
- [ ] `TASK-037.2` Add audit endpoints to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-037.3` Create `artifacts/api-server/src/routes/audit.ts` and `artifacts/api-server/src/lib/audit-service.ts`.
- [ ] `TASK-037.4` Register audit router; run `codegen`; verify typecheck; write integration tests for log querying.

---

## [ ] TASK-038 — Cost Metrics API

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Agent Orchestration / Analytics

### TDD
- Integration test: aggregate cost by agent, day, and total returns accurate sums based on `token_usage_events` or `agent_runs`.

### BDD
- Scenario: A user views the cost analytics page, sees MTD total, per‑agent breakdown, and daily spend chart.

### Deep Module
- Routes in `artifacts/api-server/src/routes/cost-analytics.ts`

### Depends On
- TASK-010 (agent APIs), TASK-026 (token usage events table), TASK-009 (agent runs with token fields)

### Blocks
- TASK-038 (frontend wiring)

### Imports From
- `lib/db/src/schema/billing.ts` (token_usage_events)

### Exports To
- Cost analytics page

### Definition of Done
- `GET /cost/summary` – returns `{ total: number, byAgent: [{agentName, cost}], byDay: [{date, cost}] }`.
- Endpoint aggregates from `token_usage_events` and `agent_runs`.
- Supports `from`/`to` date filters.
- Protected.
- `openapi.yaml` updated; codegen run; typecheck passes.

### Out of Scope
- Real‑time cost alerts
- Integration with external billing systems

### Advanced Code Patterns
- SQL aggregation with `GROUP BY` and date truncation
- Cached results for common queries (optional)

### Anti‑Patterns
- Hardcoding costs or model pricing in the frontend
- Returning raw token counts without conversion to currency

### Subtasks

- [ ] `TASK-038.1` Add cost analytics endpoints to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-038.2` Create `artifacts/api-server/src/routes/cost-analytics.ts` and `artifacts/api-server/src/lib/cost-service.ts` (extending the existing cost service from TASK-026).
- [ ] `TASK-038.3` Register router; run `codegen`; verify typecheck; write integration tests for aggregation accuracy.

---

## [ ] TASK-039 — Export & Import API

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: System Configuration

### TDD
- Integration tests: export all configuration as JSON; import valid JSON to restore configuration.

### BDD
- Scenario: An admin exports the workspace configuration, receives a JSON file. They import it into another instance, and agents, integrations, and settings are restored.

### Deep Module
- Routes in `artifacts/api-server/src/routes/export-import.ts`

### Depends On
- TASK-007, TASK-010, TASK-034, TASK-035

### Blocks
- TASK-038 (frontend settings wiring)

### Imports From
- `lib/api-spec/openapi.yaml`

### Exports To
- Export/Import page

### Definition of Done
- `GET /export/workspace` – returns a JSON object containing all configuration: agents, MCP server definitions, workspace settings, templates.
- `POST /import/workspace` – accepts a JSON payload, validates its structure, and applies the configuration (overwrite or create). Wrapped in a transaction.
- Schema‑versioned export format to survive future changes.
- All endpoints protected (admin only).
- `openapi.yaml` updated; codegen run; typecheck passes.

### Out of Scope
- Exporting transactional data (invoices, messages, etc.)

### Advanced Code Patterns
- Schema‑versioned export format with `version` field
- Atomic import within a database transaction

### Anti‑Patterns
- Exporting raw database dumps
- Importing without JSON schema validation

### Subtasks

- [ ] `TASK-039.1` Add export/import endpoints to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-039.2` Create `artifacts/api-server/src/routes/export-import.ts` and `artifacts/api-server/src/lib/export-import-service.ts`.
- [ ] `TASK-039.3` Register router; run `codegen`; verify typecheck; write integration tests for export and import round‑trip.

---

## [ ] TASK-040 — GDPR & Data Privacy Compliance

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- N/A (Cross‑cutting regulatory)

### TDD
- Integration test: request user data export returns a structured JSON of all personal data. Request deletion anonymizes or removes data within retention policy.

### BDD
- Scenario: A user submits a data subject access request; the system returns all personal data associated with them. A deletion request is processed, and within 30 days, their personal data is removed from active databases and search indexes.

### Deep Module
- Compliance service in `artifacts/api-server/src/lib/compliance.ts`  
- Database anonymization via PostgreSQL Anonymizer

### Depends On
- TASK-003 (PostgreSQL Anonymizer extension)  
- TASK-006 (user identity mapping)

### Blocks
- Production deployment in EU

### Imports From
- `lib/db/src/schema/` (all tables containing personal data)

### Exports To
- Compliance dashboard, automated data export/deletion endpoints

### Definition of Done
- All tables containing PII columns are documented.
- PostgreSQL Anonymizer dynamic masking is configured for PII columns (e.g., `email`, `phone`, `address`).
- `POST /gdpr/export` – generates a machine‑readable export of all personal data for the requesting user.
- `POST /gdpr/delete` – initiates the deletion process: anonymizes personal data in live tables, queues deletion of related records, and logs the request for audit.
- Data retention policy is defined and enforced via `pg_cron` jobs (e.g., AI chat history older than 90 days anonymized, financial records retained for 10 years, backups excluded).
- Right‑to‑erasure process includes notification to third‑party processors (manual initially, automated via webhooks later).
- All endpoints are admin‑only.

### Out of Scope
- Full third‑party processor automation
- Backup deletion (requires manual or backup system integration)

### Advanced Code Patterns
- Dynamic masking using PostgreSQL Anonymizer
- Scheduled `pg_cron` jobs for retention enforcement
- Idempotent deletion process

### Anti‑Patterns
- Soft‑delete only without anonymization
- Ignoring backup data in deletion process

### Subtasks

- [ ] `TASK-040.1` Configure PostgreSQL Anonymizer extension and dynamic masking rules for PII columns across all schemas.
- [ ] `TASK-040.2` Create `artifacts/api-server/src/lib/compliance.ts` with `exportUserData(userId)` and `deleteUserData(userId)` functions.
- [ ] `TASK-040.3` Add GDPR endpoints `POST /gdpr/export` and `POST /gdpr/delete` to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-040.4` Implement routes in `artifacts/api-server/src/routes/compliance.ts`.
- [ ] `TASK-040.5` Define and document data retention policies per data category in `docs/data-retention.md`.
- [ ] `TASK-040.6` Set up `pg_cron` jobs for automated retention enforcement (anonymization, archival).

---

## [ ] TASK-041 — EU AI Act Compliance

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- N/A (Regulatory)

### TDD
- Integration test: any AI‑generated content returned from the API includes the required labeling metadata and human‑visible disclosure.

### BDD
- Scenario: A user receives an AI‑generated chat response. The response payload contains a machine‑readable label `ai-generated: true` and the UI displays a visible "AI‑generated content" badge.

### Deep Module
- Middleware or service wrapper in `artifacts/api-server/src/lib/ai-labeling.ts`

### Depends On
- TASK-012 (chat API)  
- All AI‑generated content endpoints

### Blocks
- Production deployment in EU (deadline Aug 2, 2026)

### Imports From
- All AI content generation services

### Exports To
- All AI‑generated responses from API

### Definition of Done
- All API responses that contain AI‑generated content include:
  - A machine‑readable metadata field `"ai_generated": true` and optional `"model": "gpt-4o"`, `"generated_at": "..."`
  - A human‑visible disclosure string in the response content (where applicable, e.g., prefixed label).
- Content provenance tracking: database records for AI‑generated content include `model_id`, `prompt_hash`, `generation_params`.
- API documentation updates note the labeling requirements.
- Compliance dashboard shows recent AI‑generated content with labels applied.

### Out of Scope
- Full C2PA integration (can be added later)

### Advanced Code Patterns
- Middleware wrapping LLM calls to inject metadata and labels
- Provenance stored as part of the message record (extending the `messages` table with `ai_generated`, `model_id` columns if needed)

### Anti‑Patterns
- Forgetting to label regenerated or edited AI content
- Applying labels only client‑side without API‑level enforcement

### Subtasks

- [ ] `TASK-041.1` Extend `messages` and any other AI‑generated content tables with `is_ai_generated`, `model_id`, `generation_params`, `label_applied` columns.
- [ ] `TASK-041.2` Create `artifacts/api-server/src/lib/ai-labeling.ts` that wraps LLM calls, adds metadata, and ensures labeling.
- [ ] `TASK-041.3` Update the chat and content generation APIs to include the labeling fields in responses.
- [ ] `TASK-041.4` Add API tests verifying labeling presence on AI‑generated responses.

---

## [ ] TASK-042 — Stripe Billing Integration

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Billing (Finance)

### TDD
- Integration tests: create a Stripe Checkout session, simulate successful payment webhook, verify subscription created/updated; idempotency tests for duplicate webhooks.

### BDD
- Scenario: A tenant upgrades from Free to Pro plan via Stripe Checkout. After payment, the tenant's subscription is activated, and they gain access to Pro features. Invoices are available in Stripe Customer Portal.

### Deep Module
- Billing service in `artifacts/api-server/src/lib/billing-service.ts`  
- Webhook handler in `artifacts/api-server/src/routes/webhooks/stripe.ts`

### Depends On
- TASK-002 (environment config)  
- TASK-025 (feature flags, for gating Pro features)  
- TASK-026 (token budget, can be updated by subscription tier)

### Blocks
- Production monetization

### Imports From
- `stripe` npm package

### Exports To
- Feature gating middleware, token budget limits

### Definition of Done
- Stripe Products and Prices configured in Stripe Dashboard for Free, Pro, Enterprise tiers.
- `POST /billing/create-checkout-session` – creates a Stripe Checkout Session for the given price ID; returns the session URL.
- `POST /billing/portal` – creates a Stripe Customer Portal session for self‑service billing management.
- `POST /webhooks/stripe` – handles Stripe webhook events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`.
- Webhook handler implements two‑tier idempotency: Redis lock (concurrency) + PostgreSQL UNIQUE constraint on `stripe_event_id`.
- Subscription status is stored in the database (e.g., `workspace_settings` or a `subscriptions` table).
- Feature gating middleware reads subscription status and enables/disables Pro features (via Unleash flag overrides or direct check).
- Usage‑based billing for AI token consumption is recorded as Stripe metered events (future enhancement; schema only for now).

### Out of Scope
- Proration logic
- Invoice PDF generation (Stripe handles it)

### Advanced Code Patterns
- Webhook idempotency using event ID deduplication
- Feature gating via subscription tier mapped to Unleash strategy constraints

### Anti‑Patterns
- Trusting webhook payloads without signature verification
- Processing webhooks synchronously without idempotency

### Subtasks

- [ ] `TASK-042.1` Install Stripe SDK; configure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` env vars.
- [ ] `TASK-042.2` Create `artifacts/api-server/src/routes/webhooks/stripe.ts` with signature verification and idempotent event processing.
- [ ] `TASK-042.3` Create `artifacts/api-server/src/lib/billing-service.ts` with methods for creating Checkout and Portal sessions, and handling subscription lifecycle.
- [ ] `TASK-042.4` Create a `subscriptions` table in `lib/db/src/schema/billing.ts` (extend existing billing schema) to track tenant subscription status.
- [ ] `TASK-042.5` Add billing endpoints to `lib/api-spec/openapi.yaml`.
- [ ] `TASK-042.6` Register billing routes; run `codegen`; write integration tests with Stripe test mode.

# Phase 5 — Frontend Wiring & Real-Time Integration

---

## [ ] TASK-043 — Frontend API Client Bootstrap & Session Wiring

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
N/A

### TDD
- Integration test: frontend application starts, calls `setBaseUrl` and `setAuthTokenGetter` during bootstrap, and the generated API client can make authenticated requests.

### BDD
- Scenario: The application starts and configures the API transport with the correct base URL and auth token. Any page that uses `useQuery` from the generated client successfully fetches data from the real API server with a valid session token attached.

### Deep Module
- Application boot boundary in `artifacts/ai-command-center/src/main.tsx` and `artifacts/ai-command-center/src/App.tsx`

### Depends On
- TASK-006 (authentication)
- All backend API tasks providing generated client hooks

### Blocks
- TASK-044 through TASK-053 (all frontend wiring tasks)

### Imports From
- `lib/api-client-react/src/custom-fetch.ts`
- `artifacts/ai-command-center/src/main.tsx`

### Exports To
- Every page and hook that uses the generated API client

### Definition of Done
- `setBaseUrl` is called once during application bootstrap in `artifacts/ai-command-center/src/main.tsx` with the value from environment configuration.
- `setAuthTokenGetter` is wired to Clerk's `getToken()` function so that all generated API calls automatically include the session token in the `Authorization` header.
- A `useSession` hook (or Zustand store) is created and provides the current user, active organization/tenant ID, and session status to the component tree.
- The existing `QueryClientProvider`, `useQuery`, and `useMutation` usage from `@tanstack/react-query` continue to work; this task only adds transport configuration.
- A central query key factory is defined in `artifacts/ai-command-center/src/lib/query-keys.ts` with conventions for all domain entities, enabling consistent cache invalidation.
- The workspace `pnpm run typecheck` passes with the new imports and usage.

### Out of Scope
- Route guards that redirect unauthenticated users (can be added later per page)
- Offline support

### Advanced Code Patterns
- Single application bootstrap function for transport and auth configuration
- Centralized query key factory preventing ad‑hoc string literals
- TanStack Query `defaultOptions` configured at the provider level for `staleTime`, `retry`, and error handling

### Anti‑Patterns
- Setting the API base URL in multiple components
- Creating ad‑hoc fetch calls alongside the generated client
- Duplicating query key definitions across hooks

### Subtasks

- [ ] `TASK-043.1` Update `artifacts/ai-command-center/src/main.tsx` to call `setBaseUrl(import.meta.env.VITE_API_URL)` and wire `setAuthTokenGetter` to Clerk's session token retrieval.
- [ ] `TASK-043.2` Create `artifacts/ai-command-center/src/hooks/useSession.ts` wrapping Clerk's `useAuth` and `useOrganization` hooks, exposing `user`, `tenantId`, `isSignedIn`, `sessionToken`.
- [ ] `TASK-043.3` Create `artifacts/ai-command-center/src/lib/query-keys.ts` with factory functions for all domain entities (agents, threads, messages, tasks, projects, clients, contacts, documents, knowledge, etc.).
- [ ] `TASK-043.4` Configure `QueryClient` defaults in `App.tsx` with sensible `staleTime` and retry policies.
- [ ] `TASK-043.5` Verify with a smoke test that the health check endpoint call succeeds via the generated client.

---

## [ ] TASK-044 — Replace Mock Agent & Work Frontend Data Flows

**Status:** `NOT_STARTED`  
**Size:** `MEDIUM`

### DDD
N/A

### TDD
- Integration tests proving that agent fleet panel, attention queue, work board (all five views), triage, templates, and calendar task loading fetch data from the API and submit mutations through the API.

### BDD
- Scenario: Opening the agents page shows the fleet list from the server. The attention queue shows pending approvals. Creating a task on the work board persists it. Moving a task between columns updates its status on the server. Approving an item in the attention queue records the decision.

### Deep Module
- Frontend agent feature boundary in `artifacts/ai-command-center/src/components/dashboard/`
- Frontend work feature boundary in `artifacts/ai-command-center/src/components/work/`
- Pages: `artifacts/ai-command-center/src/pages/AgentsPage.tsx`

### Depends On
- TASK-010 (Agent & Approval APIs)
- TASK-014 (Work, Project & Task APIs)
- TASK-043 (Frontend API client bootstrap)

### Blocks
- TASK-047 (Real‑time event replacement)
- TASK-052 (Cross‑module integration & dashboard wiring)

### Imports From
- `artifacts/ai-command-center/src/api/agents.ts` (to be replaced)
- `artifacts/ai-command-center/src/api/projects.ts` (to be replaced)
- `lib/api-client-react/src/generated/api.ts`

### Exports To
- Production‑ready agent fleet panel, attention queue, work board, calendar task loading, triage section, templates section

### Definition of Done
- `api/agents.ts` and `api/projects.ts` mock modules are replaced with imports from `@workspace/api-client-react` generated hooks.
- `AgentFleetPanel` uses `useQuery` to fetch agents; loading shows skeleton cards; error shows retry UI.
- `AgentDetailDrawer` fetches agent detail with real data (runs, tool calls).
- `AttentionQueue` fetches pending approvals from API; `approve`/`reject` mutations call the real endpoints.
- `AgentsPage` passes real agent data to all sub‑components.
- `WorkPage` (all five views: Board, List, Timeline, Workload, Table) fetches tasks from the API; task creation and status changes call real endpoints.
- `CalendarPage` task data comes from the API (replacing `TASK_DUE_DATES` hardcoded map).
- `TriageSection` converts items to tasks via API.
- `TemplatesSection` fetches real templates from API; "Use template" creates a project via the template instantiation endpoint.
- AI Assistant panel in `WorkPage` is wired to the Chat API with a project‑context system prompt.
- `CommandPalette` loads live agent data from the API.
- `StatusBar` reflects real agent counts from the API (not mocked hooks).
- The `calendarStore` Zustand store is replaced with React Query for appointments (or kept as a client cache backed by API fetches).
- Workspace typecheck passes; no remaining references to `mockAgents`, `mockTasks`, `mockProjects` in production code.

### Out of Scope
- Real‑time status updates (done in TASK-047)
- Drag‑and‑drop persistence for board reordering (done in TASK-054)

### Advanced Code Patterns
- Query invalidation aligned to project and agent aggregate boundaries
- Optimistic updates for task status changes with server rollback on failure
- Polymorphic retry for failed mutations with exponential backoff

### Anti‑Patterns
- Keeping seed data in Zustand stores as production behavior
- Updating React Query cache manually without calling the API
- Mixing mock data with real query data in the same component

### Subtasks

- [ ] `TASK-044.1` Replace `api/agents.ts` usage with generated client hooks in `AgentsPage.tsx`, `AgentFleetPanel.tsx`, `AgentCard.tsx`, `AgentDetailDrawer.tsx`, `CommandPalette.tsx`, `StatusBar.tsx`, and `Sidebar.tsx`.
- [ ] `TASK-044.2` Replace `api/projects.ts` usage with generated client hooks in `WorkPage.tsx` (Board, List, Timeline, Workload, Table views), `CalendarPage.tsx`, and `Dashboard.tsx` work summary section.
- [ ] `TASK-044.3` Replace simulated `useAgentStatus` hook with React Query `useQuery` polling (`refetchInterval`) fetching from `GET /agents`; update `useAttentionQueue` to call approval endpoints.
- [ ] `TASK-044.4` Replace `calendarStore` seed appointments with API‑fetched calendar events; update `CalendarPage.tsx`, `ClientDetailPage.tsx`, and the mini‑calendar to use real data.
- [ ] `TASK-044.5` Wire `TriageSection` "Convert to task" button to the real task creation API; update `TemplatesSection` to fetch templates and instantiate projects via API.
- [ ] `TASK-044.6` Connect the AI Assistant panel in `WorkPage.tsx` to the Chat API with project‑scoped context; replace hardcoded responses.

---

## [ ] TASK-045 — Replace Mock Chat Frontend Data Flows (Non‑Streaming)

**Status:** `NOT_STARTED`  
**Size:** `MEDIUM`

### DDD
N/A

### TDD
- Integration tests: opening chat page loads threads from server; sending a message persists it; editing a message creates a new version; submitting feedback records it; generating a summary calls the API.

### BDD
- Scenario: A user opens the chat interface and sees real threads from the server. They send a message, which persists. They edit a message, and version history is preserved. They provide feedback on an assistant response, and it is recorded.

### Deep Module
- Frontend chat feature boundary in `artifacts/ai-command-center/src/components/chat/` and `artifacts/ai-command-center/src/api/chat.ts`

### Depends On
- TASK-012 (Chat APIs)
- TASK-043 (API client bootstrap)

### Blocks
- TASK-046 (Chat streaming replacement)

### Imports From
- `artifacts/ai-command-center/src/api/chat.ts` (to be replaced)
- `lib/api-client-react/src/generated/api.ts`

### Exports To
- Fully functional chat interface with real persistence (all non‑streaming operations)

### Definition of Done
- `api/chat.ts` mock module is replaced with imports from `@workspace/api-client-react` generated hooks.
- `ChatInterface.tsx` uses `useQuery` for thread list, `useMutation` for thread CRUD (create, rename, delete, branch).
- Message send uses `useMutation` to POST to the real endpoint; the optimistic user message appears immediately.
- `MessageBubble.tsx` calls real API for feedback submission (thumbs up/down).
- `MessageEditor.tsx` calls real API for message updates, creating a new version through the server.
- `SummaryPanel.tsx` generate/update summary buttons call real API; loading states properly display.
- `ContextWindowBar.tsx` grounding mode changes call the real API.
- Search within thread uses the real search endpoint.
- Thread export (JSON, Markdown, Text) continues to work with the new data shape.
- `useVoiceInput` hook is connected to the mic button in `ChatInput.tsx`; transcript is appended to input.
- File upload flow uses the real `/api/upload` endpoint via pre‑signed URLs; progress and preview are displayed.
- Workspace typecheck passes; no remaining references to `mockThreads`, `STREAM_RESPONSES`, or `simulateStream` in production code.

### Out of Scope
- Streaming token replacement (TASK-046)
- Voice‑to‑text backend (Whisper API) — frontend integration only

### Advanced Code Patterns
- Query invalidation aligned to thread aggregate boundaries
- Optimistic updates for thread title and message editing with server rollback
- Controlled `useMutation` with `onMutate`, `onError`, `onSettled` for fine‑grained cache management

### Anti‑Patterns
- Keeping the `simulateStream` function as production behavior
- Duplicating thread state between local state and React Query cache
- Mutating React Query cache directly without calling the API

### Subtasks

- [ ] `TASK-045.1` Replace `api/chat.ts` thread and message CRUD usage with generated client hooks in `ChatInterface.tsx`, `MessageBubble.tsx`, and `MessageEditor.tsx`.
- [ ] `TASK-045.2` Replace feedback, summarization, and grounding mutation calls with real API calls.
- [ ] `TASK-045.3` Update search, export, and context window bar to use real data and API calls.
- [ ] `TASK-045.4` Wire thread list panel rename, delete, branch, and thread creation to real API endpoints.
- [ ] `TASK-045.5` Integrate the `useVoiceInput` hook into `ChatInput.tsx`; connect microphone button to toggle listening and append final transcript to the input field.
- [ ] `TASK-045.6` Replace the mock `uploadFile` flow with real pre‑signed URL upload; wire progress tracking to the UI.

---

## [ ] TASK-046 — Chat Streaming Replacement (SSE Client)

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Conversation Management (streaming sub‑domain)

### TDD
- Transport test: subscribe to SSE endpoint, receive token chunks, handle `[DONE]` event, handle abort, handle error with graceful UI feedback.

### BDD
- Scenario: A user sends a message and sees real token‑by‑token streaming from the server. A typing indicator appears during thinking, then tokens stream in. The user clicks "Stop" and the stream is cancelled.

### Deep Module
- Streaming boundary between `artifacts/api-server/src/lib/chat-stream.ts` (server) and `artifacts/ai-command-center/src/hooks/useChatStream.ts` (client)

### Depends On
- TASK-012 (Chat SSE endpoint)
- TASK-045 (Chat frontend non‑streaming wiring)

### Blocks
- N/A

### Imports From
- `artifacts/ai-command-center/src/components/chat/ChatInterface.tsx`

### Exports To
- Real‑time streaming chat experience

### Definition of Done
- A custom hook `useChatStream` is created in `artifacts/ai-command-center/src/hooks/useChatStream.ts` that:
  - Opens an SSE connection to `GET /api/threads/:id/stream`.
  - Processes `data:` events containing token chunks and appends them to the streaming state.
  - Recognizes a `[DONE]` event and triggers `onComplete` callback with the full accumulated text.
  - Supports abort via `AbortController`; cleanup on unmount.
  - Handles reconnection with exponential backoff (max 3 attempts).
- The `simulateStream` function in `ChatInterface.tsx` is completely removed.
- `ChatInterface.tsx` uses `useChatStream` for the streaming flow; the thinking bubble, streaming bubble, and stop button all work with real SSE data.
- Error states display a toast notification with a "Retry" option.

### Out of Scope
- WebSocket transport (SSE is sufficient for one‑way token streaming)
- Voice streaming

### Advanced Code Patterns
- Custom React hook encapsulating SSE lifecycle (`EventSource` or `fetch` with `ReadableStream`)
- AbortController integration for client‑side cancellation
- Reconnection with exponential backoff

### Anti‑Patterns
- Leaving the old `simulateStream` function in the codebase as a fallback for production
- Using polling as a substitute for SSE

### Subtasks

- [ ] `TASK-046.1` Create `artifacts/ai-command-center/src/hooks/useChatStream.ts` that subscribes to the server SSE endpoint and returns `{ tokens, isStreaming, error, abort }`.
- [ ] `TASK-046.2` Replace the `simulateStream` call and all associated streaming state logic in `ChatInterface.tsx` with `useChatStream`.
- [ ] `TASK-046.3` Wire the "Stop" button to `abort()` from the hook; ensure the thinking and streaming bubbles reflect the current state.
- [ ] `TASK-046.4` Test the full streaming flow: send message → thinking indicator → streamed tokens → completion → editable/feedback‑ready assistant message.

---

## [ ] TASK-047 — Event Bus Simulator Replacement with Real Server Events

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
- Bounded context: Agent Orchestration and System Monitoring  
- Event types: `AgentStatusChanged`, `ApprovalRequested`, `LogEvent`

### TDD
- Transport tests: a server‑side event emitted on agent status change is received by the frontend within 2 seconds; reconnection works after a temporary network drop.

### BDD
- Scenario: An agent's status changes on the server (e.g., `thinking` → `awaiting-approval`). The dashboard agent card and status bar update within seconds without page refresh. A new approval request appears in the attention queue in real time. The activity feed displays new log entries as they arrive.

### Deep Module
- Real‑time boundary: server SSE endpoint and `artifacts/ai-command-center/src/hooks/useSSE.ts`

### Depends On
- TASK-008 (Agent & Approval APIs — domain events emitted)
- TASK-044 (Agent & Work frontend wiring)

### Blocks
- Real‑time dashboard experience
- Removal of client‑side simulator from production bundle

### Imports From
- `artifacts/ai-command-center/src/lib/eventBus.ts`
- `artifacts/ai-command-center/src/hooks/useSSE.ts`
- `artifacts/ai-command-center/src/hooks/useAgentStatus.ts`
- `artifacts/ai-command-center/src/hooks/useAttentionQueue.ts`

### Exports To
- Dashboard activity feed, attention queue, agent status indicators, sidebar badge, status bar

### Definition of Done
- A server‑side SSE endpoint `GET /api/events/stream` is created that:
  - Authenticates the WebSocket/SSE connection using the Clerk session token.
  - Streams scoped events for the tenant: `agent_status_change`, `approval_requested`, `log`.
- The client‑side `useSSE` hook is refactored to subscribe to `GET /api/events/stream` instead of the local `eventBus`.
- `useAgentStatus` and `useAttentionQueue` are updated to receive data from the real SSE stream (via context or a shared connection).
- `ActivityFeed`, `AttentionQueue`, `Sidebar` (badge), and `StatusBar` reflect live data from the server.
- The `startSimulator` call and all simulator code in `eventBus.ts` is removed or gated behind a `devMode` flag (`import.meta.env.DEV`).
- The workspace typecheck passes.

### Out of Scope
- Cross‑region event replication
- Multi‑protocol transport abstraction

### Advanced Code Patterns
- Single shared SSE connection managed by a React context provider, consumed by multiple hooks via selectors
- Automatic reconnection with exponential backoff
- Event type filtering at the hook level

### Anti‑Patterns
- Opening a separate SSE connection for each hook
- Using the simulator as a fallback in production builds

### Subtasks

- [ ] `TASK-047.1` Define real‑time event payload types in `lib/api-spec/` or a shared types package and update `openapi.yaml` with the SSE endpoint.
- [ ] `TASK-047.2` Create `artifacts/api-server/src/routes/events.ts` with an SSE endpoint that authenticates and streams scoped events.
- [ ] `TASK-047.3` Create `artifacts/api-server/src/lib/realtime.ts` as an event publication utility that domain services call (e.g., after an approval decision, publish `approval_resolved`).
- [ ] `TASK-047.4` Refactor `useSSE.ts` to connect to the server SSE endpoint instead of the local `eventBus`; support reconnection.
- [ ] `TASK-047.5` Update `useAgentStatus.ts` and `useAttentionQueue.ts` to consume real‑time data from the SSE context instead of the simulator.
- [ ] `TASK-047.6` Remove or flag‑guard the `startSimulator` calls and simulator logic in `eventBus.ts`; verify dashboard components still function.

---

## [ ] TASK-048 — Replace Mock CRM & Client Frontend Data Flows

**Status:** `NOT_STARTED`  
**Size:** `MEDIUM`

### DDD
N/A

### TDD
- Integration tests: CRM pages (contacts, pipeline, agreements, campaigns, SMS, analytics) and client pages load data from API and submit mutations through the API.

### BDD
- Scenario: Opening the CRM pipeline shows real deals from the server. Converting a CRM contact to a client creates a real client record. The client detail page shows linked projects, documents, agreements, and appointments fetched from their respective APIs. Action dropdowns (send email, log call) are wired.

### Deep Module
- Frontend CRM and client feature boundaries in `artifacts/ai-command-center/src/components/crm/` and `artifacts/ai-command-center/src/components/clients/`

### Depends On
- TASK-020 (CRM & Client APIs)
- TASK-036 (Outreach APIs)
- TASK-043 (API client bootstrap)

### Blocks
- TASK-052 (Cross‑module integration & dashboard wiring)

### Imports From
- `artifacts/ai-command-center/src/components/clients/clientsData.ts` (to be replaced)
- `artifacts/ai-command-center/src/api/agreements.ts` (to be replaced)
- `lib/api-client-react/src/generated/api.ts`

### Exports To
- Production‑ready CRM and client workflows

### Definition of Done
- All CRM sub‑pages (`ContactsPage`, `PipelinePage`, `AgreementsPage`, `EmailPage`, `SMSPage`, `CRMAnalyticsPage`) load real data from the API and submit mutations.
- `ClientsPage` and `ClientDetailPage` load real data; inline mock modules (`clientsData.ts`, `api/agreements.ts`) are removed or flagged as dev‑only.
- Client detail tabs (Projects, Documents, Agreements, Appointments) resolve linked records through the API using the cross‑module endpoints.
- CRM contact‑to‑client conversion in the `ConvertFromCRMDialog` creates a real client record via the API and navigates to the new client detail.
- Action dropdowns (Send Email, Log Call, Add to Sequence, Edit Tags) are wired to the appropriate API endpoints or at least callable with the correct data payloads.
- Workspace typecheck passes.

### Out of Scope
- Real email/SMS sending (UI wired to API; provider integration deferred)
- Full marketing automation execution

### Advanced Code Patterns
- Route‑level data prefetch for client detail pages
- Aggregate‑aware query invalidation across linked entities (client → projects, docs, agreements)

### Anti‑Patterns
- Maintaining duplicate frontend‑only canonical copies of clients
- Triggering broad full‑app refetches for narrow mutations

### Subtasks

- [ ] `TASK-048.1` Replace mock CRM data in `ContactsPage.tsx` with generated client hooks; wire search, filter, and action dropdowns.
- [ ] `TASK-048.2` Replace mock pipeline data in `PipelinePage.tsx` with real API data; implement deal stage movement via API.
- [ ] `TASK-048.3` Replace mock agreement data in `AgreementsPage.tsx` and remove `api/agreements.ts` mock module; use real API calls.
- [ ] `TASK-048.4` Replace mock campaign and automation data in `EmailPage.tsx` and `SMSPage.tsx` with real outreach API calls.
- [ ] `TASK-048.5` Replace mock analytics data in `CRMAnalyticsPage.tsx` with real aggregation endpoints.
- [ ] `TASK-048.6` Replace mock client data in `ClientsPage.tsx`, `ClientDetailPage.tsx`, and `clientsData.ts` with generated client hooks.
- [ ] `TASK-048.7` Wire client detail tabs (projects, documents, agreements, appointments) to cross‑module API calls.
- [ ] `TASK-048.8` Update CRM contact‑to‑client conversion dialog to create real client records via the API.

---

## [ ] TASK-049 — Replace Mock Document & Knowledge Frontend Data Flows

**Status:** `NOT_STARTED`  
**Size:** `MEDIUM`

### DDD
N/A

### TDD
- Integration tests: documents page loads real files, uploads a file (using mock storage or real), knowledge sub‑pages load real data.

### BDD
- Scenario: Uploading a file shows a progress bar and the new document appears in the list. The SOPs page shows real procedures with version history. The wiki page lists real articles with view counts.

### Deep Module
- Frontend document, knowledge, and memory feature boundaries in `artifacts/ai-command-center/src/components/documents/`, `src/components/knowledge/`, `src/components/memory/`

### Depends On
- TASK-022 (Document & Knowledge APIs)
- TASK-043 (API client bootstrap)

### Blocks
- TASK-052 (Cross‑module integration & dashboard wiring)

### Imports From
- `artifacts/ai-command-center/src/components/documents/DocumentsPage.tsx`
- `artifacts/ai-command-center/src/components/knowledge/*`
- `artifacts/ai-command-center/src/components/memory/KnowledgeBasePage.tsx`
- `lib/api-client-react/src/generated/api.ts`

### Exports To
- Production‑ready document and knowledge workflows

### Definition of Done
- `DocumentsPage` loads real files with status, access levels, and folder organization from the API; folder sidebar filters work.
- The upload flow uses the real pre‑signed URL upload pipeline; a progress bar shows upload progress; on completion, a document record is created via API and the list refreshes.
- All knowledge sub‑pages (`SOPsPage`, `WikiPage`, `TrainingPage`, `CertificationsPage`) load real data from the API.
- `KnowledgeBasePage` (Shared Memory) loads real project‑linked artifacts from the API.
- `api/clientDocuments.ts` mock module is replaced with generated client hooks.
- `useFileUpload` hook is tested end‑to‑end against the real upload flow.
- Workspace typecheck passes.

### Out of Scope
- Vector search UI (search input wired to hybrid search endpoint eventually)
- OCR pipeline

### Advanced Code Patterns
- Polymorphic document‑to‑entity linking via API query parameters
- Route‑level data prefetch for document detail and knowledge article pages

### Anti‑Patterns
- Maintaining separate frontend datasets for "documents" vs. "client documents"
- Uploading to local mock endpoints in production

### Subtasks

- [ ] `TASK-049.1` Replace mock document data in `DocumentsPage.tsx` and remove `api/clientDocuments.ts`; use real API calls for list, filter, and folder navigation.
- [ ] `TASK-049.2` Replace mock data in `SOPsPage.tsx`, `WikiPage.tsx`, `TrainingPage.tsx`, and `CertificationsPage.tsx` with real API calls; wire feature‑list cards to navigation.
- [ ] `TASK-049.3` Replace mock memory data in `KnowledgeBasePage.tsx` with real API data for projects and memory artifacts.
- [ ] `TASK-049.4` Wire the `useFileUpload` hook to the real pre‑signed URL upload pipeline; test end‑to‑end file upload and list refresh.

---

## [ ] TASK-050 — Replace Mock Team & Calendar Frontend Data Flows

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
N/A

### TDD
- Integration tests: team sub‑pages load real data; time‑off request submits to API and updates status.

### BDD
- Scenario: The team directory shows real employees. A time‑off request is submitted, routed for approval, and appears in the manager's view. Calendar events are fetched from the API and displayed across all views.

### Deep Module
- Frontend team feature boundaries in `artifacts/ai-command-center/src/components/team/` and calendar in `src/components/calendar/`

### Depends On
- TASK-032 (Team & Calendar APIs)
- TASK-043 (API client bootstrap)
- TASK-044 (Calendar wiring partially covered; this completes team side)

### Blocks
- TASK-052 (Cross‑module integration & dashboard wiring)

### Imports From
- `artifacts/ai-command-center/src/components/team/*`
- `artifacts/ai-command-center/src/components/calendar/CalendarPage.tsx`
- `lib/api-client-react/src/generated/api.ts`

### Exports To
- Functional team management pages and calendar views

### Definition of Done
- `DirectoryPage` loads real employee data with search and filtering.
- `OnboardingPage` loads real onboarding plans with progress bars; task toggles update via API.
- `OffboardingPage` loads real offboarding plans with progress tracking.
- `TimeOffPage` loads real requests; new request submission and approval/decline actions call the API.
- `TeamDocumentsPage` loads real documents linked to employees.
- `ComplianceTrackingPage` loads real certification records from the API.
- Calendar appointments and task due‑dates are fully API‑driven; the `calendarStore` Zustand store is replaced with React Query.
- Workspace typecheck passes.

### Out of Scope
- External calendar sync (Google/Outlook)

### Advanced Code Patterns
- Approval workflow via API status transitions
- Calendar view driven by a single date‑range API query
- Optimistic UI for time‑off request submission

### Anti‑Patterns
- Maintaining a second calendar state in Zustand while querying the API
- Mixing mock seed data with fetched calendar events

### Subtasks

- [ ] `TASK-050.1` Replace mock data in `DirectoryPage.tsx` with real API calls; wire search and filter.
- [ ] `TASK-050.2` Replace mock data in `OnboardingPage.tsx` and `OffboardingPage.tsx` with real API calls; wire task checkboxes to API updates.
- [ ] `TASK-050.3` Replace mock data in `TimeOffPage.tsx` with real API calls; implement submit, approve, and decline workflows.
- [ ] `TASK-050.4` Replace mock data in `TeamDocumentsPage.tsx` and `ComplianceTrackingPage.tsx` with real API calls.
- [ ] `TASK-050.5` Remove `calendarStore` Zustand seed data; update `CalendarPage.tsx`, mini‑calendar, and `ClientDetailPage.tsx` to use React Query for appointments.

---

## [ ] TASK-051 — Replace Mock Finance, Marketing, Vendor, Asset & Email Frontend Data Flows

**Status:** `NOT_STARTED`  
**Size:** `MEDIUM`

### DDD
N/A

### TDD
- Integration tests: each of the named pages loads data from the API and submits mutations (where applicable).

### BDD
- Scenario: The finance overview shows real net worth and cash flow. The assets page shows real inventory with maintenance tracking. Marketing pages show real campaign performance. The email inbox shows real messages from connected accounts.

### Deep Module
- Frontend feature boundaries in `artifacts/ai-command-center/src/components/finance/`, `src/components/marketing/`, `src/components/vendors/`, `src/components/assets/`, `src/pages/EmailInboxPage.tsx`

### Depends On
- TASK-028 (Finance APIs)
- TASK-030 (Marketing APIs)
- TASK-033 (Vendor APIs)
- TASK-024 (Asset APIs)
- TASK-023 (Email APIs)
- TASK-043 (API client bootstrap)

### Blocks
- TASK-052 (Cross‑module integration & dashboard wiring)

### Imports From
- All listed page components
- `lib/api-client-react/src/generated/api.ts`

### Exports To
- Fully functional finance, marketing, vendor, asset, and email pages

### Definition of Done
- All 9 finance sub‑pages load real data and submit real mutations (invoices, bills, transactions, journal entries).
- All 5 marketing sub‑pages load real data (Brand Kit, SEO, Socials, Analytics, Content Management).
- All 4 vendor sub‑pages load real data and submit purchase requests.
- `AssetsPage` (all five tabs) loads real data; the Add Asset modal persists new assets via the API.
- `EmailInboxPage` loads real email accounts and messages; compose and send actions call the API.
- Chart data on all pages is transformed from API responses using shared formatter utilities.
- Workspace typecheck passes.

### Out of Scope
- External financial institution sync
- Real social media platform integration
- Real SMTP/IMAP send/receive

### Advanced Code Patterns
- Chart data transformed from API responses via reusable formatters in `@/lib/formatters`
- Centralized mutation hooks for each entity type (e.g., `useCreateInvoice`, `useUpdateAsset`)
- Server‑side aggregation for analytics endpoints consumed by charts

### Anti‑Patterns
- Duplicating API call logic across components without shared hooks
- Hardcoding chart dimensions or color maps that differ from the design system

### Subtasks

- [ ] `TASK-051.1` Wire `EmailInboxPage.tsx` to real email API; replace all inline mock data with generated client hooks.
- [ ] `TASK-051.2` Wire `AssetsPage.tsx` (Overview, Catalog, Categories, Valuation, Maintenance tabs) to real asset API; wire Add Asset modal to create endpoint.
- [ ] `TASK-051.3` Wire all 9 finance pages to real finance API; replace inline `formatCurrency` with centralized formatter where applicable.
- [ ] `TASK-051.4` Wire all 5 marketing pages to real marketing API; replace mock static data with fetched data.
- [ ] `TASK-051.5` Wire all 4 vendor pages to real vendor API; implement purchase request submission.

---

## [ ] TASK-052 — Replace Mock Settings, Integrations & Analytics Frontend Data Flows

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
N/A

### TDD
- Integration tests: settings page loads and saves configuration; integrations page lists servers and allows add/remove; analytics pages load real data.

### BDD
- Scenario: A user changes the default AI model in settings and saves; the change persists. They add an MCP server on the integrations page, and it appears in the list. The cost analytics page shows real MTD spend from the server.

### Deep Module
- Frontend settings, integrations, and analytics feature boundaries in `artifacts/ai-command-center/src/components/settings/`, `src/components/integrations/`, `src/components/analytics/`

### Depends On
- TASK-035 (Workspace Configuration API)
- TASK-034 (Integrations CRUD API)
- TASK-038 (Cost Metrics API)
- TASK-037 (Audit Log API)
- TASK-039 (Export/Import API)
- TASK-043 (API client bootstrap)

### Blocks
- TASK-052 completion (this is the final settings/integrations/analytics wiring)

### Imports From
- All listed page components
- `lib/api-client-react/src/generated/api.ts`

### Exports To
- Functional settings, integrations, cost analytics, and audit log pages

### Definition of Done
- `SettingsPage.tsx` loads workspace configuration via API; "Save Changes" button persists settings.
- Dark mode toggle is no longer hardcoded (reads from workspace setting or user preference API).
- Interface density and default model selectors are wired to API reads and writes.
- `ExportImportPage.tsx` export/import buttons call real API endpoints; import accepts a JSON file with validation feedback.
- `IntegrationsPage.tsx` loads real MCP server records; Add Server modal submits to API; server list reflects database state.
- `CostAnalyticsPage.tsx` loads real cost data from the API; `useCostSummary` hook is updated to call the real endpoint.
- `AuditLogPage.tsx` loads real audit events; search, filter, and pagination work against the API.
- Workspace typecheck passes.

### Out of Scope
- Real‑time connection status testing for MCP servers
- Advanced report builder

### Advanced Code Patterns
- Settings hook exposing typed getters and setters backed by API
- Audit log with cursor‑based pagination (if supported by API)
- Cost chart data transformation at the hook level

### Anti‑Patterns
- Hardcoded settings values that bypass the API
- Re‑implementing cost aggregation calculations in the browser

### Subtasks

- [ ] `TASK-052.1` Wire `SettingsPage.tsx` to the configuration API; replace hardcoded defaults with fetched settings; implement save functionality.
- [ ] `TASK-052.2` Wire `ExportImportPage.tsx` to the export/import API endpoints; implement file download for export and file upload for import with validation feedback.
- [ ] `TASK-052.3` Wire `IntegrationsPage.tsx` to the integrations API; implement add server modal with connection transport and trust tier fields.
- [ ] `TASK-052.4` Wire `CostAnalyticsPage.tsx` and the `useCostSummary` hook to the cost analytics API; replace mock data.
- [ ] `TASK-052.5` Wire `AuditLogPage.tsx` to the audit API; implement search, filter by agent/action, and pagination.
- [ ] `TASK-052.6` Wire `CommandPalette.tsx` dynamic search indexing to include agents, clients, projects, and documents from API (extend from TASK-044.1).

---

## [ ] TASK-053 — Cross‑Module Integration & Dashboard Wiring

**Status:** `NOT_STARTED`  
**Size:** `MEDIUM`

### DDD
N/A

### TDD
- Integration tests: dashboard cards show real summary data from CRM, Work, Calendar, Documents, and Finance APIs. Client detail page cross‑links (projects, agreements, documents, appointments) resolve through real foreign‑key relationships.

### BDD
- Scenario: The dashboard shows live counts: total contacts, hot leads, pipeline value from CRM; in‑progress/review/backlog tasks from Work; today's events from Calendar; pending documents from Documents; net worth and savings rate from Finance. Opening a client detail shows linked projects with real status, real agreements with signature state, real documents, and real appointments.

### Deep Module
- `artifacts/ai-command-center/src/pages/Dashboard.tsx`
- `artifacts/ai-command-center/src/components/clients/ClientDetailPage.tsx`

### Depends On
- TASK-044 through TASK-052 (all domain frontend wiring tasks)

### Blocks
- Phase 6 (testing, deployment)

### Imports From
- All domain‑specific generated API client hooks
- Dashboard and ClientDetailPage components

### Exports To
- Fully integrated, cross‑module functional application

### Definition of Done
- `Dashboard.tsx` CRM summary card shows real contact counts, pipeline value, and hot leads from API.
- `Dashboard.tsx` Work summary card shows real in‑progress, in‑review, backlog counts, and recent tasks from API.
- `Dashboard.tsx` Calendar summary card shows real today's events and upcoming task count from API.
- `Dashboard.tsx` Documents summary card shows real document counts, pending signatures, and recently modified from API.
- `Dashboard.tsx` Finance KPIs show real net worth, monthly income, expenses, cash flow, and savings rate from API.
- `ClientDetailPage.tsx` loads client data and cross‑linked sub‑resources:
  - Projects tab: fetches projects linked to the client via the API; shows real status and task counts.
  - Documents tab: fetches documents linked to the client via the API.
  - Agreements tab: fetches agreements linked to the client via the API; shows real status badges.
  - Appointments section: fetches appointments where the client is an attendee via the API.
- All hardcoded cross‑module ID references (`linkedProjectIds`, `linkedDocumentIds`, `linkedAgreementIds`) are replaced with real entity relationships from the API.
- Triage section in `WorkPage` combines email and internal request data from their respective APIs.
- Workspace typecheck passes; no mock data references remain in production code.

### Out of Scope
- Advanced dashboard customization per user
- Real‑time dashboard widgets (covered by TASK-047)

### Advanced Code Patterns
- `useQueries` for parallel independent dashboard fetches with `suspense: true` for coordinated loading states
- Centralized cross‑module relationship hooks (e.g., `useClientProjects(clientId)`)
- Dashboard skeleton loading states for each card while data is pending

### Anti‑Patterns
- Fetching entire domain datasets to compute dashboard summaries client‑side
- Hardcoding IDs to simulate cross‑module links
- Duplicating cross‑module fetch logic across dashboard and detail page

### Subtasks

- [ ] `TASK-053.1` Wire `Dashboard.tsx` CRM summary to real CRM API (top contacts, pipeline value, hot lead count).
- [ ] `TASK-053.2` Wire `Dashboard.tsx` Work summary to real Work API (in‑progress, in‑review, backlog counts, recent tasks).
- [ ] `TASK-053.3` Wire `Dashboard.tsx` Calendar summary to real Calendar API (today's events, upcoming task count).
- [ ] `TASK-053.4` Wire `Dashboard.tsx` Documents summary to real Documents API (recently modified, pending signatures).
- [ ] `TASK-053.5` Wire `Dashboard.tsx` Finance KPIs to real Finance API (net worth, income, expenses, cash flow, savings rate).
- [ ] `TASK-053.6` Verify `ClientDetailPage.tsx` cross‑links (projects, agreements, documents, appointments) resolve through real FK relationships from the API.
- [ ] `TASK-053.7` Verify triage section in `WorkPage.tsx` combines email and internal request data from their respective APIs.

---

## [ ] TASK-054 — WorkPage Drag‑and‑Drop & Board Persistence

**Status:** `NOT_STARTED`  
**Size:** `SMALL`

### DDD
N/A

### TDD
- Integration test: drag a task from "Backlog" to "In Progress" in the board view; the task's status is updated via the API and the UI reflects the change without a full page reload.

### BDD
- Scenario: A user drags a task card from one column to another on the kanban board. The task immediately moves in the UI (optimistic) and the status is persisted on the server. If the API call fails, the card returns to its original position.

### Deep Module
- `artifacts/ai-command-center/src/components/work/WorkPage.tsx` (Board view and `KanbanColumn` sub‑components)

### Depends On
- TASK-044 (Work frontend wiring — board already shows real data)
- TASK-014 (Work APIs — `POST /tasks/:id/move` endpoint)

### Blocks
- Complete work board UX

### Imports From
- `@dnd-kit/core` and `@dnd-kit/sortable` (npm packages to be added)
- `lib/api-client-react/src/generated/api.ts`

### Exports To
- Fully interactive kanban board with drag‑and‑drop

### Definition of Done
- `@dnd-kit/core` and `@dnd-kit/sortable` are installed in `artifacts/ai-command-center/package.json`.
- The board view in `WorkPage.tsx` is refactored to use `DndContext`, `SortableContext` per column, and `useSortable` per task card.
- Dragging a task from one column to another calls `PATCH /tasks/:id/move` with the new status (and optionally `order_index`).
- Optimistic update: the task moves immediately in the React Query cache; on API error, the cache is rolled back and a toast error is shown.
- Within‑column reordering is also supported; the new `order_index` is sent to the API for persistence.
- Visual feedback during drag (drop shadows, highlight of target column) is implemented.
- The existing list, timeline, workload, and table views continue to function without regression.
- Workspace typecheck passes.

### Out of Scope
- Multi‑select drag of multiple tasks
- Touch‑based drag support (can be added later)

### Advanced Code Patterns
- `@dnd-kit` context with custom collision detection for cross‑column moves
- Optimistic cache mutation with `onMutate` snapshot and `onError` rollback using React Query
- Custom `DragOverlay` for the dragged card appearance

### Anti‑Patterns
- Using deprecated `react-beautiful-dnd` (use `@dnd-kit` instead)
- Mutating only the React Query cache without calling the API
- Forcing a full task list refetch after each move

### Subtasks

- [ ] `TASK-054.1` Install `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` in `artifacts/ai-command-center/package.json`.
- [ ] `TASK-054.2` Refactor `KanbanColumn` and `TaskCard` to use `useSortable` and `useDroppable`; wrap the board in a `DndContext` with `onDragEnd` handler.
- [ ] `TASK-054.3` Implement the `onDragEnd` logic: determine source and destination columns; call `PATCH /tasks/:id/move`; perform optimistic cache update.
- [ ] `TASK-054.4` Add `DragOverlay` component for visual drag feedback; style drop zones with highlight colors.
- [ ] `TASK-054.5` Test cross‑column moves and within‑column reordering; verify API persistence and error rollback.