/**
 * @file        artifacts/ai-command-center/src/components/agents/AgentDetailDrawer.tsx
 * @module      AI Command Center / Agents
 * @purpose     Drawer component displaying detailed agent information and metrics
 *
 * @ai_instructions
 *   - Agent data must be found from the provided agents array.
 *   - Metrics should use proper formatting functions for readability.
 *   - Drawer must handle null agentId gracefully.
 *   - DO NOT modify the status indicator implementation without updating Agent type.
 *
 * @exports     AgentDetailDrawer
 * @imports     @/components/ui/sheet, @/api/agents, @/components/ui/StatusIndicator, @/lib/formatters, lucide-react, @/components/ui/scroll-area
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Agent } from "@/api/agents";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { formatBytes, formatNumber } from "@/lib/formatters";
import { Cpu, MemoryStick, Activity, Network } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentDetailDrawerProps {
  agentId: string | null;
  onClose: () => void;
  agents: Agent[];
}

export function AgentDetailDrawer({ agentId, onClose, agents }: AgentDetailDrawerProps) {
  const agent = agents.find(a => a.id === agentId);

  return (
    <Sheet open={!!agentId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] border-l sm:max-w-md p-0 flex flex-col gap-0 bg-card">
        {agent ? (
          <>
            <SheetHeader className="p-6 border-b text-left space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-xl">{agent.name}</SheetTitle>
                  <p className="text-sm text-muted-foreground font-mono mt-1">{agent.model}</p>
                </div>
                <StatusIndicator status={agent.status} showLabel />
              </div>
            </SheetHeader>
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-muted-foreground" /> Metrics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted p-3 rounded-lg border">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><MemoryStick className="w-3.5 h-3.5"/> Memory Usage</div>
                      <div className="text-lg font-mono">{formatBytes(agent.memoryUsageMB * 1024 * 1024)}</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg border">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5"/> Context Tokens</div>
                      <div className="text-lg font-mono">{formatNumber(agent.tokenCount)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><Network className="w-4 h-4 text-muted-foreground" /> Recent Actions</h4>
                  <div className="space-y-3">
                    {agent.recentActions.map((action, i) => (
                      <div key={i} className="text-sm p-3 rounded-lg border bg-background/50 relative pl-4">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 rounded-l-lg" />
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="p-6 text-muted-foreground">Agent not found.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
