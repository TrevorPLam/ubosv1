import { Agent } from "@/api/agents";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { formatBytes, formatNumber } from "@/lib/formatters";
import { Cpu, MemoryStick } from "lucide-react";
import { motion } from "framer-motion";

interface AgentCardProps {
  agent: Agent;
  onClick: () => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const isActive = agent.status === 'thinking' || agent.status === 'running-tool';

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left bg-card border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all relative overflow-hidden group flex flex-col gap-4"
      aria-label={`View details for ${agent.name}`}
      data-testid={`agent-card-${agent.id}`}
    >
      {/* Animated background glow for active agents */}
      {isActive && (
        <div className="absolute -inset-x-20 -inset-y-20 bg-primary/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
      )}

      <div className="flex items-start justify-between relative z-10">
        <div>
          <h3 className="font-semibold text-foreground">{agent.name}</h3>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{agent.model}</p>
        </div>
        <StatusIndicator status={agent.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground relative z-10 mt-auto">
        <div className="flex items-center gap-1.5 bg-muted/50 p-2 rounded-md">
          <MemoryStick className="w-3.5 h-3.5" />
          <span className="font-mono">{formatBytes(agent.memoryUsageMB * 1024 * 1024)}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-muted/50 p-2 rounded-md">
          <Cpu className="w-3.5 h-3.5" />
          <span className="font-mono">{formatNumber(agent.tokenCount)}</span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground truncate relative z-10">
        Last: <span className="text-foreground">{agent.recentActions[0]}</span>
      </div>
    </motion.button>
  );
}
