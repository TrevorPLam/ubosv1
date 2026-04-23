import { useState } from 'react';

export interface QueueItem {
  id: string;
  title: string;
  agentId: string;
  agentName: string;
  description: string;
  timestamp: string;
}

const INITIAL_QUEUE: QueueItem[] = [
  {
    id: "q1",
    title: "Deploy to production",
    agentId: "agent-3",
    agentName: "CodeReviewer",
    description: "Ready to deploy feature/oauth2 to production environment.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "q2",
    title: "Execute SQL migration",
    agentId: "agent-4",
    agentName: "DataAnalyst",
    description: "Pending execution of 004_users_schema_update.sql on primary database.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "q3",
    title: "Send email to 500 users",
    agentId: "agent-5",
    agentName: "DocumentWriter",
    description: "Mass email campaign for 'Q3 Product Update' is staged.",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  }
];

export const useAttentionQueue = () => {
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);

  const approve = (id: string) => {
    setQueue(q => q.filter(item => item.id !== id));
  };

  const reject = (id: string) => {
    setQueue(q => q.filter(item => item.id !== id));
  };

  return {
    queue,
    approve,
    reject,
    count: queue.length
  };
};
