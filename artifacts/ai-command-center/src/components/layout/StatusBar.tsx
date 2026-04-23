import { useAgentStatus } from "@/hooks/useAgentStatus";
import { useAttentionQueue } from "@/hooks/useAttentionQueue";
import { Activity } from "lucide-react";

export function StatusBar() {
  const { agents } = useAgentStatus();
  const { count } = useAttentionQueue();
  
  const activeAgents = agents.filter(a => a.status === 'thinking' || a.status === 'running-tool').length;

  return (
    <div className="h-8 border-t bg-card text-xs flex items-center px-4 justify-between text-muted-foreground shrink-0 z-10" data-testid="status-bar">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-primary" />
          System Normal
        </span>
        <span>Active Agents: <strong className="text-foreground">{activeAgents} / {agents.length}</strong></span>
        <span>Pending Approvals: <strong className="text-foreground">{count}</strong></span>
      </div>
      <div className="flex items-center gap-4">
        <span>v2.4.1</span>
        <span>Uptime: 14d 03h 22m</span>
      </div>
    </div>
  );
}
