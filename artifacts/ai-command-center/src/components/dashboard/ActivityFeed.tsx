import { useSSE } from "@/hooks/useSSE";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import { Terminal, Pause, Play, Wrench, Info, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { SSELogEvent } from "@/lib/eventBus";
import { cn } from "@/lib/utils";

const TYPE_CONFIG: Record<SSELogEvent['type'], {
  color: string;
  bg: string;
  label: string;
  icon: React.ReactNode;
}> = {
  tool:       { color: 'text-teal-400',   bg: 'bg-teal-500/10',   label: 'TOOL',   icon: <Wrench className="w-3 h-3" /> },
  info:       { color: 'text-blue-400',   bg: 'bg-blue-500/10',   label: 'INFO',   icon: <Info className="w-3 h-3" /> },
  status:     { color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'STAT',   icon: <Clock className="w-3 h-3" /> },
  checkpoint: { color: 'text-green-400',  bg: 'bg-green-500/10',  label: 'CKPT',   icon: <CheckCircle2 className="w-3 h-3" /> },
  approval:   { color: 'text-amber-400',  bg: 'bg-amber-500/10',  label: 'APPR',   icon: <AlertTriangle className="w-3 h-3" /> },
  error:      { color: 'text-red-400',    bg: 'bg-red-500/10',    label: 'ERR',    icon: <XCircle className="w-3 h-3" /> },
  token:      { color: 'text-zinc-400',   bg: 'bg-zinc-500/10',   label: 'TOKEN',  icon: <Terminal className="w-3 h-3" /> },
};

const AGENT_COLOR: Record<string, string> = {
  'agent-1': 'text-violet-400',
  'agent-2': 'text-sky-400',
  'agent-3': 'text-teal-400',
  'agent-4': 'text-orange-400',
  'agent-5': 'text-pink-400',
  'agent-6': 'text-red-400',
};

function LogRow({ event, isNew }: { event: SSELogEvent; isNew: boolean }) {
  const cfg = TYPE_CONFIG[event.type];
  const agentColor = AGENT_COLOR[event.agentId] ?? 'text-zinc-400';

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, x: -8 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "flex items-start gap-2.5 py-1 px-2 rounded hover:bg-white/5 transition-colors group text-[11px] font-mono leading-5",
      )}
      data-testid={`log-row-${event.id}`}
    >
      {/* Timestamp */}
      <span className="text-zinc-600 shrink-0 select-none tabular-nums pt-px">
        {new Date(event.timestamp).toLocaleTimeString(undefined, {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>

      {/* Type badge */}
      <span className={cn(
        "inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider",
        cfg.color, cfg.bg
      )}>
        {cfg.icon}
        {cfg.label}
      </span>

      {/* Agent name */}
      <span className={cn("shrink-0 font-semibold", agentColor)}>
        [{event.agentName}]
      </span>

      {/* Message */}
      <span className="text-zinc-300 group-hover:text-zinc-100 transition-colors break-all min-w-0">
        {event.message}
      </span>
    </motion.div>
  );
}

export function ActivityFeed() {
  const [isPaused, setIsPaused] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const rawEvents = useSSE("/api/events", { enabled: !isPaused });
  const [displayedEvents, setDisplayedEvents] = useState(rawEvents);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // When paused, freeze the displayed events
  useEffect(() => {
    if (!isPaused) {
      setDisplayedEvents(rawEvents);
    }
  }, [rawEvents, isPaused]);

  // Track new event IDs for entrance animation
  useEffect(() => {
    setSeenIds(prev => {
      const next = new Set(prev);
      rawEvents.forEach(e => next.add(e.id));
      return next;
    });
  }, [rawEvents]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isPaused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [displayedEvents, isPaused]);

  const newIds = new Set(
    rawEvents.slice(-3).map(e => e.id).filter(id => !seenIds.has(id))
  );

  return (
    <div className="h-full flex flex-col border-t bg-zinc-950 text-zinc-300 font-mono" data-testid="activity-feed">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80 shrink-0">
        <div className="flex items-center gap-2 text-zinc-400 font-sans text-xs">
          <Terminal className="w-3.5 h-3.5" />
          <span className="font-semibold tracking-widest text-[11px]">SYSTEM.LOG</span>
          <span className="text-zinc-600 text-[10px] tabular-nums">
            {displayedEvents.length} entries
          </span>
          {!isPaused && (
            <span className="flex items-center gap-1 text-green-500 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              LIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Type legend */}
          <div className="hidden sm:flex items-center gap-3 mr-3">
            {(['tool', 'info', 'checkpoint', 'approval', 'error'] as const).map(t => (
              <span key={t} className={cn("flex items-center gap-1 text-[10px]", TYPE_CONFIG[t].color)}>
                {TYPE_CONFIG[t].icon}
                {TYPE_CONFIG[t].label}
              </span>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 font-sans text-xs"
            onClick={() => setIsPaused(p => !p)}
            aria-label={isPaused ? "Resume live updates" : "Pause live updates"}
            data-testid="activity-feed-pause-button"
          >
            {isPaused
              ? <><Play className="w-3 h-3 mr-1.5" />Resume</>
              : <><Pause className="w-3 h-3 mr-1.5" />Pause</>
            }
          </Button>
        </div>
      </div>

      {/* Log area */}
      <ScrollArea ref={scrollRef} className="flex-1" type="scroll">
        <div
          role="log"
          aria-live={isPaused ? "off" : "polite"}
          aria-label="System activity log"
          className="px-2 py-2 space-y-0.5 min-h-full"
        >
          <AnimatePresence initial={false} mode="popLayout">
            {displayedEvents.map((event) => (
              <LogRow
                key={event.id}
                event={event}
                isNew={newIds.has(event.id)}
              />
            ))}
          </AnimatePresence>
          <div ref={bottomRef} className="h-px" />
        </div>
      </ScrollArea>

      {/* Paused overlay banner */}
      {isPaused && (
        <div className="px-4 py-1.5 bg-amber-900/30 border-t border-amber-800/50 text-amber-400 text-[11px] font-sans flex items-center gap-2 shrink-0">
          <Pause className="w-3 h-3" />
          Updates paused — {rawEvents.length - displayedEvents.length > 0
            ? `${rawEvents.length - displayedEvents.length} new events buffered`
            : 'click Resume to continue'}
        </div>
      )}
    </div>
  );
}
