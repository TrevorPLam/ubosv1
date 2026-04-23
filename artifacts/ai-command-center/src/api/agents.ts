import { mockFetch } from "./client";

export type AgentStatus = 'idle' | 'thinking' | 'running-tool' | 'awaiting-approval' | 'error';

export interface Agent {
  id: string;
  name: string;
  model: string;
  status: AgentStatus;
  memoryUsageMB: number;
  tokenCount: number;
  recentActions: string[];
}

export const mockAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Orchestrator",
    model: "gpt-4o",
    status: "awaiting-approval",
    memoryUsageMB: 124,
    tokenCount: 450230,
    recentActions: ["Requested deployment approval", "Parsed pipeline config", "Initialized sub-agents"],
  },
  {
    id: "agent-2",
    name: "ResearchBot",
    model: "claude-3.5-sonnet",
    status: "thinking",
    memoryUsageMB: 48,
    tokenCount: 89012,
    recentActions: ["Searching academic papers", "Summarizing context", "Reading external documentation"],
  },
  {
    id: "agent-3",
    name: "CodeReviewer",
    model: "gemini-1.5-pro",
    status: "running-tool",
    memoryUsageMB: 210,
    tokenCount: 1560040,
    recentActions: ["Running linter", "Checking type definitions", "Cloning repository"],
  },
  {
    id: "agent-4",
    name: "DataAnalyst",
    model: "gpt-4-turbo",
    status: "idle",
    memoryUsageMB: 65,
    tokenCount: 30120,
    recentActions: ["Finished SQL migration script", "Exported CSV", "Connected to database"],
  },
  {
    id: "agent-5",
    name: "DocumentWriter",
    model: "claude-3-haiku",
    status: "idle",
    memoryUsageMB: 32,
    tokenCount: 12050,
    recentActions: ["Drafted release notes", "Saved document to project", "Generated outline"],
  },
  {
    id: "agent-6",
    name: "SecurityScanner",
    model: "gpt-4o-mini",
    status: "error",
    memoryUsageMB: 89,
    tokenCount: 65400,
    recentActions: ["Failed to connect to container", "Initiated scan", "Loaded ruleset"],
  }
];

export const getAgents = () => mockFetch(mockAgents, 400);

export const getAgent = (id: string) => {
  const agent = mockAgents.find(a => a.id === id);
  if (!agent) return Promise.reject(new Error("Agent not found"));
  return mockFetch(agent, 200);
}
