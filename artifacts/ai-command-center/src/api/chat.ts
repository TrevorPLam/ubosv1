import { mockFetch } from "./client";

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: { name: string; args: string }[];
  toolResult?: { success: boolean; result: string };
  agentId?: string;
}

export interface Thread {
  id: string;
  title: string;
  projectId: string;
  messages: Message[];
  updatedAt: string;
}

export const mockThreads: Thread[] = [
  {
    id: "thread-1",
    title: "Code Review: Authentication Service",
    projectId: "proj-1",
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: "m1",
        role: "user",
        content: "Can you review the new OAuth2 implementation in the auth service? Specifically check for token leakage vulnerabilities.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
      {
        id: "m2",
        role: "assistant",
        content: "I will review the authentication service for you, focusing on the OAuth2 implementation and token security.",
        timestamp: new Date(Date.now() - 1000 * 60 * 59).toISOString(),
        agentId: "agent-3" // CodeReviewer
      },
      {
        id: "m3",
        role: "tool_call",
        content: "Checking out repository",
        timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
        toolCalls: [{ name: "git_clone", args: '{"repo":"auth-service", "branch":"feature/oauth2"}' }],
        agentId: "agent-3"
      },
      {
        id: "m4",
        role: "tool_result",
        content: "Repository cloned successfully to /tmp/workspace/auth-service",
        timestamp: new Date(Date.now() - 1000 * 60 * 57).toISOString(),
        toolResult: { success: true, result: "Cloned 45 objects." }
      },
      {
        id: "m5",
        role: "tool_call",
        content: "Analyzing token handlers",
        timestamp: new Date(Date.now() - 1000 * 60 * 56).toISOString(),
        toolCalls: [{ name: "grep_code", args: '{"pattern":"localStorage", "path":"src/utils/token.ts"}' }],
        agentId: "agent-3"
      },
      {
        id: "m6",
        role: "tool_result",
        content: "Found 2 instances of localStorage usage",
        timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
        toolResult: { success: true, result: "12: localStorage.setItem('access_token', token);\n13: localStorage.setItem('refresh_token', refresh);" }
      },
      {
        id: "m7",
        role: "assistant",
        content: "I found a critical security issue in `src/utils/token.ts`. You are storing both the access token and the refresh token in `localStorage`. This makes them vulnerable to XSS attacks. I strongly recommend moving them to HttpOnly, Secure cookies.",
        timestamp: new Date(Date.now() - 1000 * 60 * 54).toISOString(),
        agentId: "agent-3"
      }
    ]
  },
  {
    id: "thread-2",
    title: "Data Migration Plan",
    projectId: "proj-2",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    messages: [
      {
        id: "m21",
        role: "user",
        content: "We need to migrate the legacy users table to the new schema. Can you outline a plan?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
      },
      {
        id: "m22",
        role: "assistant",
        content: "I'll analyze the current schema and propose a migration strategy.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25 + 5000).toISOString(),
        agentId: "agent-4" // DataAnalyst
      }
    ]
  }
];

export const getThreads = () => mockFetch(mockThreads, 300);
export const getThread = (id: string) => {
  const t = mockThreads.find(x => x.id === id);
  if (!t) return Promise.reject(new Error("Thread not found"));
  return mockFetch(t, 200);
};

export const sendMessage = (threadId: string, content: string) => {
  return mockFetch({
    id: `m-new-${Date.now()}`,
    role: 'user',
    content,
    timestamp: new Date().toISOString()
  } as Message, 500);
};
