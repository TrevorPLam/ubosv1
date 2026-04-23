import { Activity } from "lucide-react";

export function AmbientStatusBanner() {
  return (
    <div className="bg-primary/10 border-b border-primary/20 px-6 py-2.5 flex items-center justify-between text-xs shrink-0 z-20 sticky top-0" role="status">
      <div className="flex items-center gap-3">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </div>
        <span className="font-medium text-primary">System Normal</span>
        <span className="text-muted-foreground hidden sm:inline-block">All 6 orchestrators active</span>
      </div>
      <div className="flex items-center gap-4 text-muted-foreground">
        <span className="hidden md:flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> 145 ms ping</span>
        <span className="font-mono bg-background/50 px-2 py-0.5 rounded border border-border/50">v2.1.0-alpha</span>
      </div>
    </div>
  );
}
