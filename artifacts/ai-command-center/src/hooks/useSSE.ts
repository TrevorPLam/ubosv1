import { useEffect, useState } from "react";
import { startSimulator, eventBus, SSELogEvent } from "@/lib/eventBus";

const INITIAL_LOGS: SSELogEvent[] = [
  {
    id: 'init-1',
    type: 'status',
    agentId: 'agent-1',
    agentName: 'Orchestrator',
    message: 'Pipeline initialized — 6 agents online',
    timestamp: new Date(Date.now() - 1000 * 90).toISOString(),
  },
  {
    id: 'init-2',
    type: 'info',
    agentId: 'agent-2',
    agentName: 'ResearchBot',
    message: 'Loaded 48 items from long-term memory store',
    timestamp: new Date(Date.now() - 1000 * 82).toISOString(),
  },
  {
    id: 'init-3',
    type: 'tool',
    agentId: 'agent-3',
    agentName: 'CodeReviewer',
    message: 'Calling git_clone {"repo":"auth-service","branch":"feature/oauth2"}',
    timestamp: new Date(Date.now() - 1000 * 75).toISOString(),
  },
  {
    id: 'init-4',
    type: 'tool',
    agentId: 'agent-3',
    agentName: 'CodeReviewer',
    message: 'Calling grep_code {"pattern":"localStorage","path":"src/utils/token.ts"}',
    timestamp: new Date(Date.now() - 1000 * 68).toISOString(),
  },
  {
    id: 'init-5',
    type: 'info',
    agentId: 'agent-4',
    agentName: 'DataAnalyst',
    message: 'Connected to database — 2.3M rows in users table',
    timestamp: new Date(Date.now() - 1000 * 60).toISOString(),
  },
  {
    id: 'init-6',
    type: 'checkpoint',
    agentId: 'agent-3',
    agentName: 'CodeReviewer',
    message: 'Checkpoint saved: "post-clone-analysis"',
    timestamp: new Date(Date.now() - 1000 * 52).toISOString(),
  },
  {
    id: 'init-7',
    type: 'approval',
    agentId: 'agent-1',
    agentName: 'Orchestrator',
    message: 'Approval requested: "Deploy to production"',
    timestamp: new Date(Date.now() - 1000 * 45).toISOString(),
  },
  {
    id: 'init-8',
    type: 'error',
    agentId: 'agent-6',
    agentName: 'SecurityScanner',
    message: 'Connection refused: container runtime unreachable',
    timestamp: new Date(Date.now() - 1000 * 38).toISOString(),
  },
  {
    id: 'init-9',
    type: 'info',
    agentId: 'agent-2',
    agentName: 'ResearchBot',
    message: 'Fetched 12 arxiv papers on "multi-agent coordination"',
    timestamp: new Date(Date.now() - 1000 * 28).toISOString(),
  },
  {
    id: 'init-10',
    type: 'tool',
    agentId: 'agent-4',
    agentName: 'DataAnalyst',
    message: 'Calling execute_sql {"query":"SELECT COUNT(*) FROM users WHERE active=true"}',
    timestamp: new Date(Date.now() - 1000 * 18).toISOString(),
  },
  {
    id: 'init-11',
    type: 'status',
    agentId: 'agent-4',
    agentName: 'DataAnalyst',
    message: 'Status change: running-tool → awaiting-approval — Requested human approval',
    timestamp: new Date(Date.now() - 1000 * 10).toISOString(),
  },
  {
    id: 'init-12',
    type: 'info',
    agentId: 'agent-5',
    agentName: 'DocumentWriter',
    message: 'Drafting release notes — 1,240 tokens generated so far',
    timestamp: new Date(Date.now() - 1000 * 5).toISOString(),
  },
];

export const useSSE = (_endpoint?: string, options?: { enabled?: boolean }) => {
  const [events, setEvents] = useState<SSELogEvent[]>(INITIAL_LOGS);
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    startSimulator();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const unsub = eventBus.on('log', (event) => {
      setEvents(prev => [...prev.slice(-99), event]);
    });

    return unsub;
  }, [enabled]);

  return events;
};
