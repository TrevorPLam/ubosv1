# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### AI Command Center (`artifacts/ai-command-center`)
- **Type**: React + Vite frontend (UI shell only)
- **Preview path**: `/`
- **Stack**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query v5, Zustand, wouter, framer-motion, recharts
- **Purpose**: Local-first multi-agent AI orchestration dashboard
- **Pages**:
  - `/` — Dashboard (AgentFleetPanel + AttentionQueue + ActivityFeed)
  - `/chat` — Chat interface with thread list
  - `/analytics/cost` — Cost analytics with recharts
  - `/analytics/audit` — Audit log table
  - `/memory` — Knowledge base / memory items
  - `/integrations` — MCP server integrations
  - `/settings` — Settings form
  - `/settings/export` — Export/import config
- **Data**: All mock data (no real backend) — targets `http://localhost:8000` API contract
- **Features**: Command palette (⌘K), collapsible sidebar, agent status indicators (5 states), live activity feed, attention queue with approve/reject

### API Server (`artifacts/api-server`)
- **Type**: Express API server
- **Preview path**: `/api`
