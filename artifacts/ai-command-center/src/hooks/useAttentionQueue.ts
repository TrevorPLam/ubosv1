/**
 * @file        artifacts/ai-command-center/src/hooks/useAttentionQueue.ts
 * @module      Agent Management / Approval
 * @purpose     React hook to manage attention queue for agent approval requests
 *
 * @ai_instructions
 *   - Must subscribe to eventBus for approval_requested events
 *   - Must prevent duplicate queue items with same ID
 *   - Must provide approve and reject functions that remove items
 *   - DO NOT modify INITIAL_QUEUE without updating business logic
 *
 * @exports     useAttentionQueue, QueueItem
 * @imports     @/lib/eventBus
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { useState, useEffect } from 'react';
import { startSimulator, eventBus, ApprovalRequestedEvent } from '@/lib/eventBus';

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

  useEffect(() => {
    startSimulator();
  }, []);

  useEffect(() => {
    const unsub = eventBus.on('approval_requested', (event: ApprovalRequestedEvent) => {
      setQueue(q => {
        // Avoid duplicates
        if (q.some(item => item.id === event.id)) return q;
        return [event, ...q];
      });
    });
    return unsub;
  }, []);

  const approve = (id: string) => {
    setQueue(q => q.filter(item => item.id !== id));
  };

  const reject = (id: string) => {
    setQueue(q => q.filter(item => item.id !== id));
  };

  return { queue, approve, reject, count: queue.length };
};
