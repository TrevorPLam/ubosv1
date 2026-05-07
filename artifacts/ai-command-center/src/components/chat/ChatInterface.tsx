import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getThreads, Message } from "@/api/chat";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckpointBanner } from "./CheckpointBanner";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Simulated streaming responses keyed by rough topic
const STREAM_RESPONSES = [
  "I'll analyze that for you right now. Let me start by reviewing the relevant context...\n\nBased on my analysis, here are the key findings:\n\n1. The current implementation has a critical gap in input validation on lines 42-58. An attacker could exploit this with a crafted payload to bypass authentication checks.\n\n2. The token refresh logic doesn't properly invalidate old sessions — this means a compromised refresh token remains valid indefinitely.\n\n3. Secrets are being logged at the DEBUG level in `auth/middleware.ts`. This could expose credentials in log aggregation systems.\n\nRecommended actions: patch the validation layer first (high severity), then rotate all existing refresh tokens, and scrub the logging calls. I can draft the fix for any of these if you'd like.",
  "Understood. I'll coordinate with the pipeline and begin working on this task.\n\nFirst, I'll need to gather some context. Running a quick audit of the relevant subsystems now...\n\nInitial scan complete. I found 3 items worth flagging before we proceed:\n\n- **Dependency drift**: 4 packages are more than 2 major versions behind. Two of them have known CVEs.\n- **Test coverage**: The module in question has 41% coverage. I'd recommend at minimum covering the happy path before making changes.\n- **Config drift**: The staging and production configs have diverged in 6 places.\n\nWould you like me to address any of these before proceeding, or should I push forward with the original request?",
  "On it. I'll break this down into discrete steps so you can track progress.\n\n**Step 1 — Schema validation** ✓ Complete\nThe proposed schema is backward compatible. No breaking changes detected.\n\n**Step 2 — Migration script generation** ⟳ In progress\nGenerating SQL migration with rollback support...\n\n```sql\nBEGIN;\nALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;\nALTER TABLE users ADD COLUMN mfa_secret TEXT;\nCREATE INDEX CONCURRENTLY idx_users_mfa ON users(mfa_enabled) WHERE mfa_enabled = TRUE;\nCOMMIT;\n```\n\n**Step 3 — Dry run on staging** — Pending approval\n\nThe migration looks clean. Estimated runtime on production: ~4 minutes with zero downtime using CONCURRENTLY. Shall I proceed?",
];

let streamIdx = 0;

function simulateStream(
  onToken: (token: string) => void,
  onComplete: (fullText: string) => void,
  signal: AbortSignal
) {
  const response = STREAM_RESPONSES[streamIdx % STREAM_RESPONSES.length];
  streamIdx++;
  let i = 0;

  // Thinking delay before first token
  const thinkingDelay = 800 + Math.random() * 600;

  const startStreaming = () => {
    function emitNext() {
      if (signal.aborted || i >= response.length) {
        if (!signal.aborted) onComplete(response);
        return;
      }
      const chunkSize = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 2 : 1;
      const chunk = response.slice(i, i + chunkSize);
      i += chunk.length;
      onToken(chunk);
      const delay = chunk.includes('\n') ? 60 + Math.random() * 80 : 18 + Math.random() * 35;
      setTimeout(emitNext, delay);
    }
    emitNext();
  };

  const thinkTimer = setTimeout(startStreaming, thinkingDelay);
  signal.addEventListener('abort', () => clearTimeout(thinkTimer));
}

export function ChatInterface() {
  const { data: threads = [] } = useQuery({
    queryKey: ['chat-threads'],
    queryFn: getThreads,
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Streaming state
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages, streamingText, scrollToBottom]);

  const handleSend = (content: string) => {
    if (!activeThread || isThinking || streamingMsgId) return;

    // Abort any in-progress stream
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    // Add user message
    queryClient.setQueryData(['chat-threads'], (old: typeof threads) => {
      if (!old) return old;
      return old.map(t => {
        if (t.id !== activeThread.id) return t;
        const userMsg: Message = {
          id: userMsgId,
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        };
        return { ...t, messages: [...t.messages, userMsg], updatedAt: new Date().toISOString() };
      });
    });

    setIsThinking(true);
    setStreamingMsgId(assistantMsgId);
    setStreamingText('');

    let accumulated = '';

    simulateStream(
      (token) => {
        if (ctrl.signal.aborted) return;
        accumulated += token;
        setStreamingText(accumulated);
        setIsThinking(false);
      },
      (fullText) => {
        if (ctrl.signal.aborted) return;
        // Commit final message into query cache
        queryClient.setQueryData(['chat-threads'], (old: typeof threads) => {
          if (!old) return old;
          return old.map(t => {
            if (t.id !== activeThread.id) return t;
            const assistantMsg: Message = {
              id: assistantMsgId,
              role: 'assistant',
              content: fullText,
              timestamp: new Date().toISOString(),
              agentId: 'agent-3',
            };
            return { ...t, messages: [...t.messages, assistantMsg], updatedAt: new Date().toISOString() };
          });
        });
        setStreamingMsgId(null);
        setStreamingText('');
        setIsThinking(false);
      },
      ctrl.signal
    );
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const isBusy = isThinking || !!streamingMsgId;

  return (
    <div className="flex h-full bg-background overflow-hidden" data-testid="chat-interface">
      {/* Thread list */}
      <div className="w-64 border-r bg-card flex flex-col shrink-0">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Threads
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="New thread"
            data-testid="button-new-thread"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {threads.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                data-testid={`thread-item-${t.id}`}
                className={cn(
                  "w-full text-left px-3 py-3 rounded-lg text-sm transition-colors",
                  t.id === activeThread?.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <div className="truncate text-[13px]">{t.title}</div>
                <div className="text-[10px] mt-0.5 opacity-60">
                  {formatDistanceToNow(new Date(t.updatedAt))} ago
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {activeThread ? (
          <>
            <div className="px-6 py-3.5 border-b bg-card/60 backdrop-blur-sm sticky top-0 z-10">
              <h3 className="font-semibold text-sm">{activeThread.title}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Project: {activeThread.projectId}
                {isBusy && (
                  <span className="ml-3 text-primary inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {isThinking ? 'Thinking...' : 'Generating...'}
                  </span>
                )}
              </p>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl mx-auto space-y-6 pb-4">
                {activeThread.messages.map((msg, i) => (
                  <div key={msg.id}>
                    {i === 2 && <CheckpointBanner title="Initial context gathered" time="10:45 AM" />}
                    <MessageBubble message={msg} />
                  </div>
                ))}

                {/* Streaming / thinking bubble */}
                <AnimatePresence>
                  {isThinking && (
                    <motion.div
                      key="thinking"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-4"
                    >
                      <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0 mt-1">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                      <div className="flex flex-col gap-1 items-start">
                        <div className="text-xs text-muted-foreground px-1 font-medium">CodeReviewer</div>
                        <div className="bg-card border rounded-lg px-4 py-2 text-sm flex items-center gap-1.5 text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {streamingMsgId && streamingText && (
                    <motion.div
                      key="streaming"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4"
                    >
                      <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0 mt-1">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                      <div className="flex flex-col gap-1 items-start min-w-0">
                        <div className="text-xs text-muted-foreground px-1 font-medium">
                          CodeReviewer
                          <span className="ml-2 text-primary text-[10px]">streaming</span>
                        </div>
                        <div className="bg-card border rounded-lg px-4 py-3 text-sm max-w-prose whitespace-pre-wrap break-words shadow-sm">
                          {streamingText}
                          <span className="inline-block w-0.5 h-3.5 bg-primary ml-0.5 animate-pulse align-text-bottom" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={bottomRef} className="h-1" />
              </div>
            </ScrollArea>

            <ChatInput
              onSend={handleSend}
              isLoading={isBusy}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a thread to begin
          </div>
        )}
      </div>
    </div>
  );
}
