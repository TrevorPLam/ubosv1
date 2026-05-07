export type AgentStatus = 'idle' | 'thinking' | 'running-tool' | 'awaiting-approval' | 'error';

export interface SSELogEvent {
  id: string;
  type: 'info' | 'tool' | 'status' | 'checkpoint' | 'approval' | 'error' | 'token';
  agentId: string;
  agentName: string;
  message: string;
  timestamp: string;
  meta?: Record<string, string | number | boolean>;
}

export interface AgentStatusChangeEvent {
  agentId: string;
  newStatus: AgentStatus;
  prevStatus: AgentStatus;
  lastAction: string;
}

export interface ApprovalRequestedEvent {
  id: string;
  title: string;
  agentId: string;
  agentName: string;
  description: string;
  timestamp: string;
}

type BusEventMap = {
  log: SSELogEvent;
  agent_status_change: AgentStatusChangeEvent;
  approval_requested: ApprovalRequestedEvent;
};

type BusEventType = keyof BusEventMap;
type Listener<T extends BusEventType> = (event: BusEventMap[T]) => void;

class EventBus {
  private listeners = new Map<BusEventType, Set<Listener<BusEventType>>>();

  on<T extends BusEventType>(type: T, listener: Listener<T>) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener as Listener<BusEventType>);
    return () => this.off(type, listener);
  }

  off<T extends BusEventType>(type: T, listener: Listener<T>) {
    this.listeners.get(type)?.delete(listener as Listener<BusEventType>);
  }

  emit<T extends BusEventType>(type: T, event: BusEventMap[T]) {
    this.listeners.get(type)?.forEach(l => l(event as BusEventMap[BusEventType]));
  }
}

export const eventBus = new EventBus();

// ── Agent definitions ─────────────────────────────────────────────────────────

const AGENTS = [
  { id: 'agent-1', name: 'Orchestrator' },
  { id: 'agent-2', name: 'ResearchBot' },
  { id: 'agent-3', name: 'CodeReviewer' },
  { id: 'agent-4', name: 'DataAnalyst' },
  { id: 'agent-5', name: 'DocumentWriter' },
  { id: 'agent-6', name: 'SecurityScanner' },
];

// Valid state machine transitions
const TRANSITIONS: Record<AgentStatus, AgentStatus[]> = {
  idle:               ['thinking'],
  thinking:           ['running-tool', 'awaiting-approval', 'idle'],
  'running-tool':     ['thinking', 'awaiting-approval', 'idle', 'error'],
  'awaiting-approval':['running-tool', 'idle'],
  error:              ['idle', 'thinking'],
};

// ── Log templates ─────────────────────────────────────────────────────────────

const LOG_TEMPLATES: Array<{
  type: SSELogEvent['type'];
  agentFilter?: string[];
  messages: string[];
  meta?: Record<string, string | number | boolean>;
}> = [
  {
    type: 'tool',
    messages: [
      'Calling git_clone {"repo":"auth-service","branch":"feature/oauth2"}',
      'Calling grep_code {"pattern":"localStorage","path":"src/utils/token.ts"}',
      'Calling run_tests {"suite":"unit","timeout":30}',
      'Calling read_file {"path":"config/database.yml"}',
      'Calling search_web {"query":"XSS attack vectors 2024"}',
      'Calling execute_sql {"query":"SELECT COUNT(*) FROM users WHERE active=true"}',
      'Calling send_http {"method":"POST","url":"https://api.internal/deploy","dry_run":true}',
      'Calling list_files {"dir":"src/","recursive":true}',
      'Calling run_linter {"target":"src/","format":"json"}',
      'Calling diff_files {"a":"schema_v3.sql","b":"schema_v4.sql"}',
    ],
  },
  {
    type: 'info',
    messages: [
      'Context window at 72% capacity — compressing memory',
      'Loaded 48 items from long-term memory store',
      'Spawning sub-task: "Validate API contract"',
      'Retry 2/3 — upstream service timeout',
      'Cache hit for embedding vector (0.94 similarity)',
      'Token budget warning: 12,400 tokens remaining',
      'Parallel sub-agents synchronized — merging results',
      'Rate limit backoff: waiting 3.2s before next request',
      'Retrieved 5 relevant documents from knowledge base',
      'Planning loop iteration 4 — refining strategy',
      'Handoff complete — passing context to DataAnalyst',
      'Injecting system prompt override for compliance mode',
    ],
  },
  {
    type: 'status',
    messages: [
      'Agent transitioned: thinking → running-tool',
      'Pipeline step 3/7 complete',
      'Heartbeat OK — latency 143ms',
      'Memory usage stabilized at 48 MB',
      'Agent resumed after approval',
      'Background indexing complete (2,341 chunks)',
    ],
  },
  {
    type: 'checkpoint',
    messages: [
      'Checkpoint saved: "post-clone-analysis"',
      'Checkpoint saved: "schema-validated"',
      'Checkpoint saved: "test-results-captured"',
      'Checkpoint saved: "approval-pending-deploy"',
    ],
  },
  {
    type: 'error',
    agentFilter: ['agent-6'],
    messages: [
      'Connection refused: container runtime unreachable',
      'Scan aborted: ruleset validation failed (code E-403)',
      'Timeout after 30s waiting for sandbox response',
      'TLS handshake error connecting to registry',
    ],
  },
  {
    type: 'info',
    agentFilter: ['agent-2'],
    messages: [
      'Fetched 12 arxiv papers on "multi-agent coordination"',
      'Summarizing paper: "Scalable Oversight of LLM Agents (2024)"',
      'Cross-referencing 3 conflicting sources — resolving ambiguity',
      'Embedding 8,400 tokens into research context',
    ],
  },
];

// ── Approval templates ────────────────────────────────────────────────────────

const APPROVAL_TEMPLATES: Array<Omit<ApprovalRequestedEvent, 'id' | 'timestamp'>> = [
  {
    title: 'Write to production config',
    agentId: 'agent-1',
    agentName: 'Orchestrator',
    description: 'Orchestrator wants to update /etc/app/config.yml in the production environment.',
  },
  {
    title: 'Publish npm package v2.4.1',
    agentId: 'agent-3',
    agentName: 'CodeReviewer',
    description: 'Ready to publish @internal/auth-sdk@2.4.1 to the private registry.',
  },
  {
    title: 'Delete stale indexes',
    agentId: 'agent-4',
    agentName: 'DataAnalyst',
    description: 'DROP INDEX idx_sessions_legacy on users table — estimated 2.1 GB freed.',
  },
  {
    title: 'Send Slack notification to #engineering',
    agentId: 'agent-5',
    agentName: 'DocumentWriter',
    description: 'Post deployment summary to 342 team members in #engineering channel.',
  },
];

// ── Simulator ─────────────────────────────────────────────────────────────────

let agentStatusMap: Record<string, AgentStatus> = {
  'agent-1': 'awaiting-approval',
  'agent-2': 'thinking',
  'agent-3': 'running-tool',
  'agent-4': 'idle',
  'agent-5': 'idle',
  'agent-6': 'error',
};

let logCounter = 0;
let approvalCounter = 0;
let approvalTemplateIdx = 0;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function scheduleNext(fn: () => void, minMs: number, maxMs: number) {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return setTimeout(fn, delay);
}

// Emit a random log event
function emitLogEvent() {
  const template = pickRandom(LOG_TEMPLATES);
  const eligibleAgents = template.agentFilter
    ? AGENTS.filter(a => template.agentFilter!.includes(a.id))
    : AGENTS;
  const agent = pickRandom(eligibleAgents);

  const event: SSELogEvent = {
    id: `log-${++logCounter}-${Date.now()}`,
    type: template.type,
    agentId: agent.id,
    agentName: agent.name,
    message: pickRandom(template.messages),
    timestamp: new Date().toISOString(),
  };

  eventBus.emit('log', event);
}

// Cycle one agent's status
function emitStatusChange() {
  const agent = pickRandom(AGENTS);
  const current = agentStatusMap[agent.id] ?? 'idle';
  const candidates = TRANSITIONS[current];
  const next = pickRandom(candidates);

  if (next === current) return;

  agentStatusMap[agent.id] = next;

  const actionMap: Partial<Record<AgentStatus, string[]>> = {
    thinking:           ['Analyzing context', 'Planning next step', 'Evaluating options', 'Reviewing chain-of-thought'],
    'running-tool':     ['Calling external tool', 'Executing shell command', 'Fetching data', 'Running validation'],
    'awaiting-approval':['Requested human approval', 'Flagged for review', 'Paused — awaiting sign-off'],
    idle:               ['Task complete', 'Standby', 'Waiting for next task'],
    error:              ['Tool call failed', 'Context overflow', 'Connection timed out'],
  };

  const lastAction = pickRandom(actionMap[next] ?? ['State change']);

  eventBus.emit('agent_status_change', {
    agentId: agent.id,
    newStatus: next,
    prevStatus: current,
    lastAction,
  });

  // Also emit a status log for the activity feed
  eventBus.emit('log', {
    id: `log-sc-${Date.now()}`,
    type: 'status',
    agentId: agent.id,
    agentName: agent.name,
    message: `Status change: ${current} → ${next} — ${lastAction}`,
    timestamp: new Date().toISOString(),
  });
}

// Emit a new approval request
function emitApprovalRequest() {
  const template = APPROVAL_TEMPLATES[approvalTemplateIdx % APPROVAL_TEMPLATES.length];
  approvalTemplateIdx++;

  const event: ApprovalRequestedEvent = {
    ...template,
    id: `q-live-${++approvalCounter}-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  eventBus.emit('approval_requested', event);
  eventBus.emit('log', {
    id: `log-apr-${Date.now()}`,
    type: 'approval',
    agentId: template.agentId,
    agentName: template.agentName,
    message: `Approval requested: "${template.title}"`,
    timestamp: new Date().toISOString(),
  });
}

// ── Start / stop ──────────────────────────────────────────────────────────────

let logTimer: ReturnType<typeof setTimeout> | null = null;
let statusTimer: ReturnType<typeof setTimeout> | null = null;
let approvalTimer: ReturnType<typeof setTimeout> | null = null;
let started = false;

function scheduleLog() {
  logTimer = scheduleNext(() => { emitLogEvent(); scheduleLog(); }, 2500, 5500);
}
function scheduleStatus() {
  statusTimer = scheduleNext(() => { emitStatusChange(); scheduleStatus(); }, 8000, 18000);
}
function scheduleApproval() {
  approvalTimer = scheduleNext(() => { emitApprovalRequest(); scheduleApproval(); }, 40000, 90000);
}

export function startSimulator() {
  if (started) return;
  started = true;
  scheduleLog();
  scheduleStatus();
  scheduleApproval();
}

export function stopSimulator() {
  if (logTimer) clearTimeout(logTimer);
  if (statusTimer) clearTimeout(statusTimer);
  if (approvalTimer) clearTimeout(approvalTimer);
  started = false;
}

export function getInitialAgentStatuses() {
  return { ...agentStatusMap };
}
