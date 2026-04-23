import { AgentStatus } from "@/api/agents";
import { Circle, Brain, Wrench, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: AgentStatus;
  className?: string;
  showLabel?: boolean;
}

export function StatusIndicator({ status, className, showLabel = false }: StatusIndicatorProps) {
  const config = {
    idle: { color: "text-gray-400 dark:text-gray-500", bg: "bg-gray-100 dark:bg-gray-800", icon: Circle, label: "Idle", animate: false },
    thinking: { color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", icon: Brain, label: "Thinking", animate: true },
    "running-tool": { color: "text-teal-500 dark:text-teal-400", bg: "bg-teal-100 dark:bg-teal-900/30", icon: Wrench, label: "Running Tool", animate: true },
    "awaiting-approval": { color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", icon: AlertTriangle, label: "Awaiting Approval", animate: false },
    error: { color: "text-red-500 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", icon: XCircle, label: "Error", animate: false },
  };

  const { color, bg, icon: Icon, label, animate } = config[status];

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid={`status-${status}`}>
      <div className={cn("p-1.5 rounded-md flex items-center justify-center", bg, color)}>
        <Icon className={cn("w-4 h-4", animate && "animate-pulse")} />
      </div>
      {showLabel && <span className={cn("text-sm font-medium", color)}>{label}</span>}
    </div>
  );
}
