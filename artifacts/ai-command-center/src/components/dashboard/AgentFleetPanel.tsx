/**
 * @file        artifacts/ai-command-center/src/components/dashboard/AgentFleetPanel.tsx
 * @module      AI Command Center / Dashboard
 * @purpose     Fleet management panel displaying all agents with loading states and selection
 *
 * @ai_instructions
 *   - Fleet panel should support responsive grid layouts.
 *   - Loading state should show skeleton cards matching agent count.
 *   - Agent selection should trigger detailed view updates.
 *   - DO NOT modify fleet structure without updating agent status hooks.
 *
 * @exports     AgentFleetPanel
 * @imports     @/hooks/useAgentStatus, ./AgentCard
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { useAgentStatus } from "@/hooks/useAgentStatus";
import { AgentCard } from "./AgentCard";

export function AgentFleetPanel({ onSelectAgent }: { onSelectAgent: (id: string) => void }) {
  const { agents, isLoading } = useAgentStatus();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-5 border-b shrink-0 flex items-center justify-between bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Agent Fleet</h2>
          <p className="text-sm text-muted-foreground">Active autonomous workers</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} onClick={() => onSelectAgent(agent.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
