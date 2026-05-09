# Feature Flags Documentation

## Overview

This document describes the feature flag infrastructure implemented using Unleash for the UBOS application. Feature flags provide runtime control over AI features and experimental functionality without requiring code deployments.

## Architecture

### Components

- **Unleash Server**: Self-hosted feature flag management server (Docker)
- **Unleash Edge**: Edge proxy for frontend SDK support (optional)
- **Feature Flag Service**: TypeScript wrapper service in `artifacts/api-server/src/lib/feature-flags.ts`
- **Docker Compose**: Local development setup with PostgreSQL

### Infrastructure

```yaml
# docker-compose.yml
services:
  unleash-server:
    image: unleashorg/unleash-server:latest
    ports: ["4242:4242"]
    environment:
      DATABASE_URL: postgresql://unleash:unleash_password@unleash-postgres:5432/unleash
      UNLEASH_URL: http://localhost:4242
      UNLEASH_SECRET: default-secret-key-change-in-production
  
  unleash-postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: unleash
      POSTGRES_USER: unleash
      POSTGRES_PASSWORD: unleash_password
```

## Available Feature Flags

### AI Core Features

| Flag Name | Purpose | Default State | Target Audience |
|-----------|---------|---------------|-----------------|
| `ai-chat-streaming` | Enable real-time chat streaming via SSE | `false` | All tenants |
| `ai-content-generation` | Enable AI content generation tools | `false` | All tenants |
| `ai-supervisor` | Enable supervisor agent orchestration | `false` | All tenants |
| `mcp-tool-execution` | Enable MCP tool execution | `false` | All tenants |
| `rag-hybrid-search` | Enable hybrid RAG search capabilities | `false` | All tenants |

### Flag Types

- **Release Flags**: Temporary flags for gradual rollout (expected lifetime: 40 days)
- **Kill Switches**: Emergency disable flags for critical features
- **Operational Flags**: Long-term flags for operational control

## Usage

### Backend Integration

```typescript
import { isEnabled, FEATURE_FLAGS } from '../lib/feature-flags';

// Check if AI chat streaming is enabled
const streamingEnabled = await isEnabled(FEATURE_FLAGS.AI_CHAT_STREAMING, {
  tenantId: req.user.tenantId,
  userId: req.user.id,
});

if (!streamingEnabled) {
  return res.status(503).json({ 
    error: 'AI chat streaming is temporarily unavailable' 
  });
}
```

### Context Parameters

The feature flag service supports the following context:

```typescript
interface FeatureFlagContext {
  tenantId?: string;    // Multi-tenant isolation
  userId?: string;      // User-specific targeting
  sessionId?: string;   // Session-based targeting
  properties?: Record<string, string>; // Custom properties
}
```

## Administration

### Accessing Unleash Admin

1. Start the services: `docker-compose up -d`
2. Access admin UI: http://localhost:4242
3. Default credentials: `admin:unleash4all`

### Managing Flags

1. **Create Flag**: Use the admin UI to create new feature flags
2. **Configure Strategy**: Set activation strategies (gradual rollout, user targeting)
3. **Monitor Usage**: View flag usage statistics and adoption rates
4. **Cleanup**: Remove stale flags after their expected lifetime

### Activation Strategies

- **Default**: Enable for all users
- **Gradual Rollout**: Enable for percentage of users
- **User ID**: Enable for specific users
- **Tenant ID**: Enable for specific tenants

## Best Practices

### Code Organization

1. **Evaluate at Entry Points**: Check flags at service layer, not scattered throughout code
2. **Single Evaluation**: Evaluate flags once per request and pass results down
3. **Graceful Degradation**: Always provide fallback behavior when flags are disabled
4. **Type Safety**: Use the exported `FEATURE_FLAGS` constants

### Flag Lifecycle

1. **Planning**: Define flag purpose and expected lifetime
2. **Implementation**: Add flag checks with proper logging
3. **Testing**: Test both enabled and disabled paths
4. **Rollout**: Gradual rollout with monitoring
5. **Cleanup**: Remove flag code after feature is stable

### Error Handling

The feature flag service is designed to be resilient:

- **Network Failures**: Defaults to `false` (safe default)
- **Server Unavailable**: Graceful degradation with logging
- **Invalid Context**: Logs errors and returns `false`

## Environment Configuration

### Development

```env
UNLEASH_URL=http://localhost:4242
UNLEASH_API_TOKEN=default:token
UNLEASH_APP_NAME=ubos-api-server
```

### Production

```env
UNLEASH_URL=https://unleash.yourdomain.com
UNLEASH_API_TOKEN=prod:secure-token
UNLEASH_APP_NAME=ubos-api-server-prod
```

## Monitoring

### Metrics

- Flag evaluation counts
- Enable/disable rates
- Client connection status
- Error rates and types

### Logging

Feature flag evaluations are logged at DEBUG level:

```json
{
  "level": "debug",
  "flagName": "ai-chat-streaming",
  "enabled": true,
  "context": {
    "tenantId": "tenant-123",
    "userId": "user-456"
  },
  "msg": "Feature flag evaluation"
}
```

## Security

### Access Control

- Admin UI requires authentication
- API tokens are scoped by environment
- Tenant isolation enforced at evaluation time

### Data Privacy

- No user data stored in Unleash
- Only tenant IDs and user IDs for targeting
- All evaluation logs respect existing data privacy controls

## Troubleshooting

### Common Issues

1. **Flags Always Disabled**: Check Unleash server connectivity
2. **Context Not Working**: Verify tenant/user ID format
3. **Performance Issues**: Check client initialization and refresh intervals

### Debug Commands

```bash
# Check Unleash server status
curl http://localhost:4242/api/admin/features

# Check Docker services
docker-compose ps

# View logs
docker-compose logs unleash-server
```

## Integration Points

### AI Services

- **Chat Service**: Streaming and content generation
- **Agent Service**: Supervisor and tool execution
- **RAG Service**: Hybrid search capabilities

### Frontend

- **React Components**: Feature-based component rendering
- **API Calls**: Conditional API endpoint usage
- **User Experience**: Graceful degradation messages

## Future Enhancements

- **Frontend SDK Integration**: Direct client-side flag evaluation
- **Advanced Targeting**: Geographic, device, and behavioral targeting
- **A/B Testing**: Statistical experiment analysis
- **Automated Cleanup**: Flag stale detection and cleanup automation
