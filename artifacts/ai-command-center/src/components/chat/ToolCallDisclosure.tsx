import { useState } from "react";
import { ChevronRight, ChevronDown, Wrench, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCallDisclosureProps {
  toolCalls: { name: string; args: string }[];
  result?: { success: boolean; result: string };
  defaultOpen?: boolean;
}

export function ToolCallDisclosure({ toolCalls, result, defaultOpen = false }: ToolCallDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-md bg-muted/30 overflow-hidden my-2 font-mono text-sm max-w-2xl">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left"
        aria-expanded={open}
      >
        {open ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
        <Wrench className="w-3 h-3 shrink-0" />
        <span className="truncate flex-1">
          {toolCalls.length} tool {toolCalls.length === 1 ? 'call' : 'calls'} 
          {result && (result.success ? " • Success" : " • Failed")}
        </span>
        {result && <CheckCircle className={cn("w-3 h-3 shrink-0", result.success ? "text-green-500" : "text-red-500")} />}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-border/50 text-xs space-y-3">
          <div className="space-y-2">
            {toolCalls.map((tc, i) => (
              <div key={i} className="space-y-1">
                <div className="text-primary font-semibold">{tc.name}</div>
                <div className="bg-background rounded p-2 text-muted-foreground break-all border overflow-x-auto">
                  {tc.args}
                </div>
              </div>
            ))}
          </div>

          {result && (
            <div className="space-y-1">
              <div className="text-muted-foreground font-semibold">Result</div>
              <div className={cn(
                "bg-background rounded p-2 break-all border overflow-x-auto whitespace-pre-wrap",
                result.success ? "text-green-400 border-green-500/20" : "text-red-400 border-red-500/20"
              )}>
                {result.result}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
