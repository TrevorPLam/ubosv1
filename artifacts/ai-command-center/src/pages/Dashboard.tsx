import { useState } from "react";
import { AgentFleetPanel } from "@/components/dashboard/AgentFleetPanel";
import { AttentionQueue } from "@/components/dashboard/AttentionQueue";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { AmbientStatusBanner } from "@/components/dashboard/AmbientStatusBanner";
import { AgentDetailDrawer } from "@/components/agents/AgentDetailDrawer";
import { useAgentStatus } from "@/hooks/useAgentStatus";

export function Dashboard() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { agents } = useAgentStatus();

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <AmbientStatusBanner />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden border-r">
          <AgentFleetPanel onSelectAgent={setSelectedAgentId} />
        </div>
        
        <div className="w-80 2xl:w-96 shrink-0 hidden lg:block">
          <AttentionQueue />
        </div>
      </div>
      
      <div className="h-64 shrink-0">
        <ActivityFeed />
      </div>

      <AgentDetailDrawer 
        agentId={selectedAgentId} 
        onClose={() => setSelectedAgentId(null)} 
        agents={agents} 
      />
    </div>
  );
}
