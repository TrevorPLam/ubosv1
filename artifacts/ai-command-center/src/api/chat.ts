import { mockFetch } from "./client";

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'tool_call' | 'tool_result' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: { name: string; args: string }[];
  toolResult?: { success: boolean; result: string };
  agentId?: string;
  attachments?: FileAttachment[];
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

export const sendMessage = (threadId: string, content: string, attachments?: FileAttachment[]) => {
  return mockFetch({
    id: `m-new-${Date.now()}`,
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
    attachments: attachments || []
  } as Message, 500);
};

export const uploadFile = (file: File, onProgress?: (progress: number) => void): Promise<{ url: string }> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(Math.round(progress));
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.url || `/uploads/${file.name}`
          });
        } catch (error) {
          reject(new Error('Invalid server response'));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
};

export const sendMessageWithFiles = async (
  threadId: string, 
  content: string, 
  files: File[],
  onProgress?: (fileId: string, progress: number) => void
): Promise<Message> => {
  // Upload files first
  const uploadPromises = files.map(async (file, index) => {
    const fileId = `file-${index}-${Date.now()}`;
    
    const uploadResult = await uploadFile(file, (progress) => {
      onProgress?.(fileId, progress);
    });

    return {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      url: uploadResult.url
    } as FileAttachment;
  });

  try {
    const attachments = await Promise.all(uploadPromises);
    
    // Send message with attachments
    return await sendMessage(threadId, content, attachments);
  } catch (error) {
    throw new Error(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteThread = (threadId: string): Promise<void> => {
  return mockFetch(undefined, 500).then(() => {
    // In a real implementation, this would make a DELETE request to the server
    // For now, we'll simulate the deletion
    const index = mockThreads.findIndex(t => t.id === threadId);
    if (index > -1) {
      mockThreads.splice(index, 1);
    }
  });
};

export const renameThread = (threadId: string, newTitle: string): Promise<Thread> => {
  return mockFetch(undefined, 300).then(() => {
    // In a real implementation, this would make a PATCH request to the server
    const thread = mockThreads.find(t => t.id === threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }
    
    thread.title = newTitle;
    thread.updatedAt = new Date().toISOString();
    
    return { ...thread };
  });
};
