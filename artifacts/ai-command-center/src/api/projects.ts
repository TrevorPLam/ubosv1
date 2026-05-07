import { mockFetch } from "./client";

export type TaskStatus = 'backlog' | 'in-progress' | 'in-review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  commentCount: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  color: string;
  createdAt: string;
  taskCount: number;
}

export const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "Alpha Pipeline",
    description: "Core multi-agent orchestration pipeline with approval gates and memory.",
    status: "active",
    color: "#3b82f6",
    createdAt: "2024-10-01T00:00:00Z",
    taskCount: 7,
  },
  {
    id: "proj-2",
    name: "Data Ingestion v2",
    description: "Rebuild the ETL pipeline with schema validation and streaming support.",
    status: "active",
    color: "#10b981",
    createdAt: "2024-11-15T00:00:00Z",
    taskCount: 5,
  },
  {
    id: "proj-3",
    name: "Security Audit",
    description: "Automated security scanning across all production services.",
    status: "active",
    color: "#f59e0b",
    createdAt: "2024-12-05T00:00:00Z",
    taskCount: 4,
  },
];

export const mockTasks: Task[] = [
  // Alpha Pipeline
  {
    id: "task-1",
    projectId: "proj-1",
    title: "Implement approval gate for deploy actions",
    description: "Before any agent can trigger a production deploy, it must pause and request human approval via the attention queue.",
    status: "done",
    priority: "critical",
    assignedAgentId: "agent-1",
    assignedAgentName: "Orchestrator",
    createdAt: "2024-10-02T09:00:00Z",
    updatedAt: "2024-10-10T14:30:00Z",
    tags: ["safety", "orchestration"],
    commentCount: 4,
  },
  {
    id: "task-2",
    projectId: "proj-1",
    title: "Add checkpoint persistence to long-running tasks",
    description: "Store intermediate state so tasks can resume after interruption without restarting from scratch.",
    status: "in-review",
    priority: "high",
    assignedAgentId: "agent-3",
    assignedAgentName: "CodeReviewer",
    createdAt: "2024-10-05T10:00:00Z",
    updatedAt: "2024-10-18T11:00:00Z",
    tags: ["resilience", "storage"],
    commentCount: 2,
  },
  {
    id: "task-3",
    projectId: "proj-1",
    title: "Research optimal context compression strategies",
    description: "Evaluate sliding window, summary-injection, and selective-pruning approaches for managing 128k context windows.",
    status: "in-progress",
    priority: "high",
    assignedAgentId: "agent-2",
    assignedAgentName: "ResearchBot",
    createdAt: "2024-10-08T08:00:00Z",
    updatedAt: "2024-10-20T09:45:00Z",
    tags: ["research", "memory"],
    commentCount: 6,
  },
  {
    id: "task-4",
    projectId: "proj-1",
    title: "Write integration tests for agent handoff protocol",
    description: "Cover edge cases: agent crashes mid-task, token budget exhaustion, and concurrent approval requests.",
    status: "backlog",
    priority: "medium",
    assignedAgentId: null,
    assignedAgentName: null,
    createdAt: "2024-10-12T13:00:00Z",
    updatedAt: "2024-10-12T13:00:00Z",
    tags: ["testing"],
    commentCount: 0,
  },
  {
    id: "task-5",
    projectId: "proj-1",
    title: "Build cost tracking dashboard",
    description: "Track per-agent, per-model, and per-project token spend with daily rollups and budget alerts.",
    status: "in-progress",
    priority: "medium",
    assignedAgentId: "agent-4",
    assignedAgentName: "DataAnalyst",
    createdAt: "2024-10-14T10:00:00Z",
    updatedAt: "2024-10-21T16:00:00Z",
    tags: ["analytics", "cost"],
    commentCount: 1,
  },
  {
    id: "task-6",
    projectId: "proj-1",
    title: "Design MCP server trust tier framework",
    description: "Define permission levels for external tool servers: read-only, sandboxed-write, trusted, and admin.",
    status: "backlog",
    priority: "high",
    assignedAgentId: null,
    assignedAgentName: null,
    createdAt: "2024-10-16T09:00:00Z",
    updatedAt: "2024-10-16T09:00:00Z",
    tags: ["security", "mcp"],
    commentCount: 3,
  },
  {
    id: "task-7",
    projectId: "proj-1",
    title: "Document agent communication protocol v1",
    description: "Write detailed spec for inter-agent message format, priority levels, and routing rules.",
    status: "backlog",
    priority: "low",
    assignedAgentId: "agent-5",
    assignedAgentName: "DocumentWriter",
    createdAt: "2024-10-18T14:00:00Z",
    updatedAt: "2024-10-18T14:00:00Z",
    tags: ["docs"],
    commentCount: 0,
  },

  // Data Ingestion v2
  {
    id: "task-8",
    projectId: "proj-2",
    title: "Schema validation layer for incoming events",
    description: "Reject or quarantine events that fail JSON schema validation before they touch the pipeline.",
    status: "done",
    priority: "critical",
    assignedAgentId: "agent-4",
    assignedAgentName: "DataAnalyst",
    createdAt: "2024-11-16T09:00:00Z",
    updatedAt: "2024-11-28T17:00:00Z",
    tags: ["validation", "etl"],
    commentCount: 5,
  },
  {
    id: "task-9",
    projectId: "proj-2",
    title: "Migrate users table to new schema",
    description: "Execute 004_users_schema_update.sql on primary — requires approval before run.",
    status: "in-review",
    priority: "critical",
    assignedAgentId: "agent-4",
    assignedAgentName: "DataAnalyst",
    createdAt: "2024-11-20T10:00:00Z",
    updatedAt: "2024-12-02T12:00:00Z",
    tags: ["migration", "database"],
    commentCount: 8,
  },
  {
    id: "task-10",
    projectId: "proj-2",
    title: "Add Kafka consumer for real-time event streaming",
    description: "Replace polling-based ingestion with a Kafka consumer group. Target: < 200ms end-to-end latency.",
    status: "in-progress",
    priority: "high",
    assignedAgentId: "agent-3",
    assignedAgentName: "CodeReviewer",
    createdAt: "2024-11-22T11:00:00Z",
    updatedAt: "2024-12-03T09:30:00Z",
    tags: ["streaming", "kafka"],
    commentCount: 2,
  },
  {
    id: "task-11",
    projectId: "proj-2",
    title: "Dead-letter queue and retry policy",
    description: "Failed events should be sent to a DLQ with exponential backoff retry up to 5 attempts.",
    status: "backlog",
    priority: "medium",
    assignedAgentId: null,
    assignedAgentName: null,
    createdAt: "2024-11-25T14:00:00Z",
    updatedAt: "2024-11-25T14:00:00Z",
    tags: ["resilience"],
    commentCount: 1,
  },
  {
    id: "task-12",
    projectId: "proj-2",
    title: "Load test at 50k events/second",
    description: "Stress test the new pipeline against synthetic load. Document bottlenecks and p99 latency.",
    status: "backlog",
    priority: "medium",
    assignedAgentId: null,
    assignedAgentName: null,
    createdAt: "2024-11-28T09:00:00Z",
    updatedAt: "2024-11-28T09:00:00Z",
    tags: ["testing", "performance"],
    commentCount: 0,
  },

  // Security Audit
  {
    id: "task-13",
    projectId: "proj-3",
    title: "Fix XSS vulnerability in auth-service token storage",
    description: "Access and refresh tokens stored in localStorage. Move to HttpOnly Secure cookies immediately.",
    status: "in-progress",
    priority: "critical",
    assignedAgentId: "agent-6",
    assignedAgentName: "SecurityScanner",
    createdAt: "2024-12-06T09:00:00Z",
    updatedAt: "2024-12-08T14:00:00Z",
    tags: ["security", "xss", "critical"],
    commentCount: 7,
  },
  {
    id: "task-14",
    projectId: "proj-3",
    title: "Rotate all production secrets",
    description: "API keys, DB passwords, and JWT signing keys must be rotated. Coordinate with ops for zero-downtime rollout.",
    status: "in-review",
    priority: "critical",
    assignedAgentId: "agent-1",
    assignedAgentName: "Orchestrator",
    createdAt: "2024-12-06T10:00:00Z",
    updatedAt: "2024-12-09T11:00:00Z",
    tags: ["secrets", "ops"],
    commentCount: 3,
  },
  {
    id: "task-15",
    projectId: "proj-3",
    title: "Enable dependency scanning in CI pipeline",
    description: "Integrate Dependabot and OWASP Dependency-Check. Block merges on critical CVEs.",
    status: "backlog",
    priority: "high",
    assignedAgentId: null,
    assignedAgentName: null,
    createdAt: "2024-12-07T09:00:00Z",
    updatedAt: "2024-12-07T09:00:00Z",
    tags: ["ci", "dependencies"],
    commentCount: 0,
  },
  {
    id: "task-16",
    projectId: "proj-3",
    title: "Write security incident response runbook",
    description: "Document step-by-step procedures for: credential leak, data breach, and ransomware scenarios.",
    status: "backlog",
    priority: "medium",
    assignedAgentId: "agent-5",
    assignedAgentName: "DocumentWriter",
    createdAt: "2024-12-08T13:00:00Z",
    updatedAt: "2024-12-08T13:00:00Z",
    tags: ["docs", "incident-response"],
    commentCount: 1,
  },
];

export const getProjects = () => mockFetch(mockProjects, 250);
export const getTasks = (projectId?: string) => {
  const result = projectId ? mockTasks.filter(t => t.projectId === projectId) : mockTasks;
  return mockFetch(result, 200);
};
export const createTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'commentCount'>) => {
  const newTask: Task = {
    ...task,
    id: `task-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    commentCount: 0,
  };
  return mockFetch(newTask, 300);
};
