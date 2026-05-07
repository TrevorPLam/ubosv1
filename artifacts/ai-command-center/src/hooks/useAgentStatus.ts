import { useEffect, useState } from 'react';
import { mockAgents } from '@/api/agents';
import { startSimulator, eventBus, getInitialAgentStatuses, AgentStatus } from '@/lib/eventBus';
import type { Agent } from '@/api/agents';

export const useAgentStatus = () => {
  const initialStatuses = getInitialAgentStatuses();

  const [agents, setAgents] = useState<Agent[]>(
    mockAgents.map(a => ({
      ...a,
      status: (initialStatuses[a.id] as AgentStatus) ?? a.status,
    }))
  );

  useEffect(() => {
    startSimulator();
  }, []);

  useEffect(() => {
    // Subscribe to status change events
    const unsubStatus = eventBus.on('agent_status_change', ({ agentId, newStatus, lastAction }) => {
      setAgents(prev =>
        prev.map(a => {
          if (a.id !== agentId) return a;
          return {
            ...a,
            status: newStatus,
            recentActions: [lastAction, ...a.recentActions].slice(0, 5),
          };
        })
      );
    });

    // Subscribe to log events to update last action text for tool calls
    const unsubLog = eventBus.on('log', ({ agentId, type, message }) => {
      if (type !== 'tool' && type !== 'info') return;
      setAgents(prev =>
        prev.map(a => {
          if (a.id !== agentId) return a;
          // Bump memory usage slightly for active agents
          const memDelta = a.status === 'thinking' || a.status === 'running-tool'
            ? Math.floor(Math.random() * 8 - 3)
            : 0;
          const newMem = Math.max(8, a.memoryUsageMB + memDelta);
          // Bump token count for thinking/running agents
          const tokDelta = a.status === 'thinking' || a.status === 'running-tool'
            ? Math.floor(Math.random() * 800 + 200)
            : 0;
          return {
            ...a,
            memoryUsageMB: newMem,
            tokenCount: a.tokenCount + tokDelta,
            recentActions: [message.slice(0, 60), ...a.recentActions].slice(0, 5),
          };
        })
      );
    });

    return () => {
      unsubStatus();
      unsubLog();
    };
  }, []);

  return { agents, isLoading: false };
};
