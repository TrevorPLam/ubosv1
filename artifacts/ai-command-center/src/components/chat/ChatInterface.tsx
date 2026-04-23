import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getThreads, sendMessage, Message } from "@/api/chat";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckpointBanner } from "./CheckpointBanner";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ChatInterface() {
  const { data: threads = [] } = useQuery({
    queryKey: ['chat-threads'],
    queryFn: getThreads,
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessage(activeThread?.id || '', content),
    onMutate: async (content) => {
      const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      };

      queryClient.setQueryData(['chat-threads'], (old: any) => {
        if (!old) return old;
        return old.map((t: any) => {
          if (t.id === activeThread?.id) {
            return { ...t, messages: [...t.messages, tempMsg] };
          }
          return t;
        });
      });
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [activeThread?.messages]);

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Sidebar Threads List */}
      <div className="w-72 border-r bg-card flex flex-col shrink-0">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Threads
          </h2>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {threads.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={cn(
                  "w-full text-left px-3 py-3 rounded-lg text-sm transition-colors",
                  t.id === activeThread?.id 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <div className="truncate">{t.title}</div>
                <div className="text-[10px] mt-1 opacity-70">
                  {formatDistanceToNow(new Date(t.updatedAt))} ago
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {activeThread ? (
          <>
            <div className="px-6 py-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
              <h3 className="font-semibold">{activeThread.title}</h3>
              <p className="text-xs text-muted-foreground">Project: {activeThread.projectId}</p>
            </div>
            
            <ScrollArea ref={scrollRef} className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-6 pb-4">
                {activeThread.messages.map((msg, i) => (
                  <div key={msg.id}>
                    {i === 2 && <CheckpointBanner title="Initial Context Gathered" time="10:45 AM" />}
                    <MessageBubble message={msg} />
                  </div>
                ))}
              </div>
            </ScrollArea>

            <ChatInput onSend={(text) => sendMutation.mutate(text)} isLoading={sendMutation.isPending} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a thread to begin
          </div>
        )}
      </div>
    </div>
  );
}
