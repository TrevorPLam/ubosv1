# UBOS - Unified Business Operating System

A comprehensive business management platform built with modern web technologies.

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm package manager
- PostgreSQL database
- Redis (optional, for caching)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd ubosv1
   pnpm install
   ```

2. **Environment setup**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your actual configuration values
   # See Environment Variables section below
   ```

3. **Database setup**
   ```bash
   # Push database schema (requires DATABASE_URL in .env)
   pnpm --filter @workspace/db run push
   ```

4. **Start development servers**
   ```bash
   # Start API server
   pnpm --filter @workspace/api-server run dev
   
   # Start frontend (in separate terminal)
   pnpm --filter @workspace/ai-command-center run dev
   ```

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

### Core Application
- `PORT` - Frontend application port (e.g., 3000)
- `BASE_PATH` - Frontend base path for routing (e.g., /)

### Database
- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://username:password@host:port/database`

### Authentication (Clerk)
- `CLERK_PUBLISHABLE_KEY` - Frontend authentication key
- `CLERK_SECRET_KEY` - Backend authentication secret

### AI Services
- `OPENAI_API_KEY` - OpenAI API key for GPT models
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude models

### File Storage
- `S3_ACCESS_KEY` - S3-compatible storage access key
- `S3_SECRET_KEY` - S3-compatible storage secret key
- `S3_BUCKET` - Storage bucket name
- `S3_ENDPOINT` - S3 endpoint URL

### Optional Services
- `REDIS_URL` - Redis connection for caching
- `SENDGRID_API_KEY` - Email service API key
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` - SMS service
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` - Payment processing

## Development

### Type Checking
```bash
# Type check all packages
pnpm run typecheck

# Type check specific package
pnpm --filter @workspace/api-server run typecheck
```

### Building
```bash
# Build all packages
pnpm run build

# Build specific package
pnpm --filter @workspace/api-server run build
```

### Database Operations
```bash
# Push schema changes
pnpm --filter @workspace/db run push

# Force push (destructive)
pnpm --filter @workspace/db run push-force
```

## Architecture

This is a modular monolith with the following structure:

- `artifacts/ai-command-center/` - React frontend application
- `artifacts/api-server/` - Node.js/Express API server
- `lib/` - Shared libraries
  - `db/` - Database ORM and schema
  - `api-client-react/` - Generated API client
  - `api-spec/` - OpenAPI specification
  - `api-zod/` - Generated TypeScript types

## Configuration Management

Environment variables are centrally validated using Zod schemas. The application will fail fast at startup if required variables are missing or invalid, preventing runtime errors.

### Frontend Configuration
The frontend (Vite) validates `PORT` and `BASE_PATH` before starting the development server.

### Backend Configuration  
The API server validates all environment variables through `src/lib/config.ts` using Zod schemas for type safety and validation.

### Database Configuration
Database connections use the validated `DATABASE_URL` from the centralized configuration.

## Contributing

1. Follow the established file header and commenting standards (see `INDEX.md`)
2. Ensure all TypeScript types are properly defined
3. Run `pnpm run typecheck` before committing
4. Update documentation for any configuration changes

## License

MIT License - see LICENSE file for details.
