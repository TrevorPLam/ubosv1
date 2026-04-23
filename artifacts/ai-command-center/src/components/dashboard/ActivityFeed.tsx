import { useSSE } from "@/hooks/useSSE";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import { Terminal, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ActivityFeed() {
  const [isPaused, setIsPaused] = useState(false);
  const events = useSSE("/api/events", { enabled: !isPaused });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [events, isPaused]);

  return (
    <div className="h-full flex flex-col border-t bg-zinc-950 text-zinc-300 font-mono text-[11px] sm:text-xs">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-2 text-zinc-400 font-sans text-xs">
          <Terminal className="w-3.5 h-3.5" />
          <span className="font-semibold tracking-wider">SYSTEM.LOG</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          onClick={() => setIsPaused(!isPaused)}
          aria-label={isPaused ? "Resume updates" : "Pause updates"}
        >
          {isPaused ? <Play className="w-3 h-3 mr-1" /> : <Pause className="w-3 h-3 mr-1" />}
          {isPaused ? "Resume" : "Pause"}
        </Button>
      </div>
      <ScrollArea ref={scrollRef} className="flex-1 p-4" type="always">
        <div role="log" aria-live={isPaused ? "off" : "polite"} className="space-y-1.5">
          {events.length === 0 ? (
            <div className="text-zinc-600 italic">Waiting for events...</div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="flex gap-3 hover:bg-zinc-900/50 py-0.5 px-1 rounded transition-colors group">
                <span className="text-zinc-500 shrink-0 select-none">
                  {new Date(event.timestamp).toLocaleTimeString(undefined, { hour12: false, fractionalSecondDigits: 3 })}
                </span>
                <span className={`shrink-0 uppercase w-12 ${
                  event.type === 'error' ? 'text-red-400' :
                  event.type === 'status' ? 'text-blue-400' :
                  event.type === 'metric' ? 'text-purple-400' : 'text-zinc-400'
                }`}>
                  [{event.type}]
                </span>
                <span className="text-zinc-300 break-all group-hover:text-zinc-100 transition-colors">
                  {event.data.message}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
