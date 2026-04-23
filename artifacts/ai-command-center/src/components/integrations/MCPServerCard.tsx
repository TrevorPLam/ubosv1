import { CheckCircle2, XCircle, ShieldAlert, ShieldCheck, Box } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  status: "connected" | "disconnected" | "error";
  trustTier: "trusted" | "restricted";
  tools: string[];
}

export function MCPServerCard({ server }: { server: MCPServer }) {
  const isConnected = server.status === "connected";
  
  return (
    <div className="border rounded-xl p-5 bg-card flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${isConnected ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">{server.name}</h3>
            <div className="flex items-center gap-2 text-xs mt-0.5">
              <span className={`flex items-center gap-1 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                {isConnected ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {server.status}
              </span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className={`flex gap-1 ${server.trustTier === 'trusted' ? 'text-blue-500 border-blue-500/30 bg-blue-500/5' : 'text-amber-500 border-amber-500/30 bg-amber-500/5'}`}>
          {server.trustTier === 'trusted' ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
          {server.trustTier}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2">
        {server.description}
      </p>

      <div className="mt-auto pt-4 border-t border-border/50">
        <div className="text-xs font-medium mb-2 text-muted-foreground">Exposed Tools ({server.tools.length})</div>
        <div className="flex flex-wrap gap-1.5">
          {server.tools.slice(0, 4).map(t => (
            <span key={t} className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-foreground">
              {t}
            </span>
          ))}
          {server.tools.length > 4 && (
            <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
              +{server.tools.length - 4} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
