import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getThreads, deleteThread, renameThread, createThread, generateThreadTitle, searchMessages, Message, Thread } from "@/api/chat";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckpointBanner } from "./CheckpointBanner";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Plus, Loader2, PanelRightClose, PanelRightOpen, Trash2, Edit, Search, X, ChevronUp, ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatToJSON, formatToMarkdown, formatToText } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useClipboard } from "@/hooks/useClipboard";
import { toast } from "sonner";
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const [threadsPanelOpen, setThreadsPanelOpen] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Streaming state
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Clipboard functionality
  const { copy, isLoading, isSupported } = useClipboard();

  // Thread management state
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search logic
  useEffect(() => {
    if (!activeThreadId || !searchQuery.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchMessages(activeThreadId, searchQuery);
        setSearchResults(results);
        setCurrentSearchIndex(results.length > 0 ? 0 : -1);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeThreadId]);

  // Navigate to search result
  useEffect(() => {
    if (currentSearchIndex >= 0 && searchResults[currentSearchIndex]) {
      const messageId = searchResults[currentSearchIndex];
      const element = messageRefs.current[messageId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary highlight effect
        element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
        }, 2000);
      }
    }
  }, [currentSearchIndex, searchResults]);

  const handleNextSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;
    setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
  }, [searchResults]);

  const handlePrevSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;
    setCurrentSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
  }, [searchResults]);

  const toggleSearch = useCallback(() => {
    setIsSearchOpen(prev => {
      if (!prev) {
        // Focus input when opening
        setTimeout(() => searchInputRef.current?.focus(), 100);
      } else {
        setSearchQuery("");
      }
      return !prev;
    });
  }, []);

  const handleExport = useCallback((format: 'json' | 'markdown' | 'text') => {
    if (!activeThread) return;

    let content = "";
    let extension = "";
    let mimeType = "";

    switch (format) {
      case 'json':
        content = formatToJSON(activeThread);
        extension = "json";
        mimeType = "application/json";
        break;
      case 'markdown':
        content = formatToMarkdown(activeThread);
        extension = "md";
        mimeType = "text/markdown";
        break;
      case 'text':
        content = formatToText(activeThread);
        extension = "txt";
        mimeType = "text/plain";
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeThread.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Conversation exported as ${format.toUpperCase()}`);
  }, [activeThread]);

  // Handle keyboard copy functionality
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check if Ctrl/Cmd+C is pressed
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      // Get the currently focused element
      const focusedElement = document.activeElement;
      
      // Check if a message bubble or its content is focused
      const messageElement = focusedElement?.closest('[data-message-id]');
      if (messageElement) {
        const messageId = messageElement.getAttribute('data-message-id');
        const message = activeThread?.messages.find(m => m.id === messageId);
        
        if (message?.content && isSupported) {
          event.preventDefault();
          copy(message.content)
            .then(() => {
              toast.success("Copied to clipboard", {
                description: "Message content has been copied successfully",
                duration: 2000,
              });
            })
            .catch((error) => {
              toast.error("Failed to copy", {
                description: error instanceof Error ? error.message : "Unknown error occurred",
                duration: 3000,
              });
            });
        }
      }
    }
  }, [activeThread?.messages, copy, isSupported]);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Thread management handlers
  const handleStartEdit = useCallback((threadId: string, currentTitle: string) => {
    console.log('[ChatInterface] handleStartEdit called', { threadId, currentTitle });
    setEditingThreadId(threadId);
    setEditingTitle(currentTitle);
    setDeleteDialogOpen(false);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    console.log('[ChatInterface] handleSaveEdit called', { editingThreadId, editingTitle });
    if (!editingThreadId || !editingTitle.trim()) return;

    // Optimistic update
    const previousThreads = queryClient.getQueryData(['chat-threads']);
    
    try {
      console.log('[ChatInterface] Performing optimistic update for rename');
      queryClient.setQueryData(['chat-threads'], (old: any) => {
        if (!old) return old;
        return old.map((t: any) => 
          t.id === editingThreadId 
            ? { ...t, title: editingTitle.trim(), updatedAt: new Date().toISOString() }
            : t
        );
      });

      await renameThread(editingThreadId, editingTitle.trim());
      console.log('[ChatInterface] Rename success');
      
      toast.success("Thread renamed", {
        description: "Thread title has been updated successfully",
        duration: 2000,
      });
      
      setEditingThreadId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('[ChatInterface] Rename error:', error);
      // Rollback on error
      queryClient.setQueryData(['chat-threads'], previousThreads);
      
      toast.error("Failed to rename thread", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 3000,
      });
    }
  }, [editingThreadId, editingTitle, queryClient]);

  const handleCancelEdit = useCallback(() => {
    console.log('[ChatInterface] handleCancelEdit called');
    setEditingThreadId(null);
    setEditingTitle('');
  }, []);

  const handleDeleteClick = useCallback((threadId: string) => {
    console.log('[ChatInterface] handleDeleteClick called', { threadId });
    setThreadToDelete(threadId);
    setDeleteDialogOpen(true);
    setEditingThreadId(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    console.log('[ChatInterface] handleConfirmDelete called', { threadToDelete });
    if (!threadToDelete) return;

    // Optimistic update
    const previousThreads = queryClient.getQueryData(['chat-threads']);
    
    try {
      console.log('[ChatInterface] Performing optimistic update for delete');
      queryClient.setQueryData(['chat-threads'], (old: any) => {
        if (!old) return old;
        return old.filter((t: any) => t.id !== threadToDelete);
      });

      await deleteThread(threadToDelete);
      console.log('[ChatInterface] Delete success');
      
      // Handle active thread deletion
      if (activeThreadId === threadToDelete) {
        const remainingThreads = threads.filter(t => t.id !== threadToDelete);
        setActiveThreadId(remainingThreads.length > 0 ? remainingThreads[0].id : null);
      }
      
      toast.success("Thread deleted", {
        description: "Thread has been deleted successfully",
        duration: 2000,
      });
      
      setDeleteDialogOpen(false);
      setThreadToDelete(null);
    } catch (error) {
      console.error('[ChatInterface] Delete error:', error);
      // Rollback on error
      queryClient.setQueryData(['chat-threads'], previousThreads);
      
      toast.error("Failed to delete thread", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 3000,
      });
    }
  }, [threadToDelete, activeThreadId, threads, queryClient]);

  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setThreadToDelete(null);
  }, []);

  // Auto-focus edit input
  useEffect(() => {
    if (editingThreadId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingThreadId]);

  // Handle keyboard events for editing
  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages, streamingText, scrollToBottom]);

  const handleStop = useCallback(() => {
    setIsCancelling(true);
    abortRef.current?.abort();
    
    // Add a small delay for visual feedback before cleanup
    setTimeout(() => {
      setStreamingMsgId(null);
      setStreamingText('');
      setIsThinking(false);
      setIsCancelling(false);
    }, 200);
  }, []);

  const handleNewThread = useCallback(async () => {
    console.log('[ChatInterface] handleNewThread called');
    const projectId = activeThread?.projectId || 'proj-1';
    
    try {
      const newThread = await createThread(projectId);
      console.log('[ChatInterface] New thread created:', newThread);
      
      // Update cache
      queryClient.setQueryData(['chat-threads'], (old: any) => {
        if (!old) return [newThread];
        return [newThread, ...old];
      });
      
      setActiveThreadId(newThread.id);
      setThreadsPanelOpen(true);
      
      toast.success("New thread created");
    } catch (error) {
      console.error('[ChatInterface] Error creating new thread:', error);
      toast.error("Failed to create new thread");
    }
  }, [activeThread?.projectId, queryClient]);

  const handleSend = (content: string) => {
    if (!activeThread || isThinking || streamingMsgId) return;

    // Auto-generate title for new threads
    if (activeThread.messages.length === 0) {
      const newTitle = generateThreadTitle(content);
      handleStartEdit(activeThread.id, newTitle);
      handleSaveEdit(); // This is a bit hacky but works with the current setup
      
      // Better: Update the thread title in the API and cache directly
      renameThread(activeThread.id, newTitle).then(() => {
        queryClient.setQueryData(['chat-threads'], (old: any) => {
          if (!old) return old;
          return old.map((t: any) => 
            t.id === activeThread.id ? { ...t, title: newTitle } : t
          );
        });
      });
    }

    // Abort any in-progress stream
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    // Add user message
    queryClient.setQueryData(['chat-threads'], (old: any) => {
      if (!old) return old;
      return old.map((t: any) => {
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
        queryClient.setQueryData(['chat-threads'], (old: any) => {
          if (!old) return old;
          return old.map((t: any) => {
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
      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {activeThread ? (
          <>
            <div className="px-6 py-3.5 border-b bg-card/60 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1 flex items-center gap-4">
                <div className="min-w-0">
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

                {/* Search Bar */}
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border transition-all duration-300 overflow-hidden",
                  isSearchOpen ? "max-w-md flex-1" : "max-w-[40px] border-transparent bg-transparent"
                )}>
                  <button 
                    onClick={toggleSearch}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label={isSearchOpen ? "Close search" : "Open search"}
                  >
                    {isSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                  </button>
                  
                  {isSearchOpen && (
                    <>
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/60"
                      />
                      
                      {searchResults.length > 0 && (
                        <div className="flex items-center gap-1 border-l pl-2 shrink-0">
                          <span className="text-[10px] text-muted-foreground font-medium mr-1">
                            {currentSearchIndex + 1}/{searchResults.length}
                          </span>
                          <button 
                            onClick={handlePrevSearchResult}
                            className="p-0.5 hover:bg-muted rounded transition-colors"
                            aria-label="Previous result"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={handleNextSearchResult}
                            className="p-0.5 hover:bg-muted rounded transition-colors"
                            aria-label="Next result"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      
                      {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                    </>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Download className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('json')}>
                      Export as JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('markdown')}>
                      Export as Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('text')}>
                      Export as Plain Text
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <button
                onClick={() => setThreadsPanelOpen(p => !p)}
                aria-label={threadsPanelOpen ? "Collapse threads panel" : "Expand threads panel"}
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              >
                {threadsPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </button>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl mx-auto space-y-6 pb-4">
                {activeThread.messages.map((msg, i) => (
                  <div key={msg.id} ref={el => messageRefs.current[msg.id] = el}>
                    {i === 2 && <CheckpointBanner title="Initial context gathered" time="10:45 AM" />}
                    <MessageBubble message={msg} searchTerm={isSearchOpen ? searchQuery : undefined} />
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
                      animate={{ opacity: isCancelling ? 0 : 1, y: isCancelling ? -8 : 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
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
                          {isCancelling ? (
                            <span className="text-muted-foreground text-xs ml-2">Cancelling...</span>
                          ) : (
                            <span className="inline-block w-0.5 h-3.5 bg-primary ml-0.5 animate-pulse align-text-bottom" />
                          )}
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
              onStop={handleStop}
              isLoading={isBusy}
              isStreaming={!!streamingMsgId}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-3 text-muted-foreground text-sm">
            <p>Select a thread to begin</p>
            {!threadsPanelOpen && (
              <button
                onClick={() => setThreadsPanelOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-xs transition-colors"
              >
                <PanelRightOpen className="w-3.5 h-3.5" /> Show threads
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Thread list (right panel) ── */}
      <div className={cn(
        "border-l bg-card flex flex-col shrink-0 transition-all duration-300 overflow-hidden",
        threadsPanelOpen ? "w-64" : "w-0"
      )}>
        <div className="p-4 border-b flex items-center justify-between min-w-[256px]">
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
            onClick={handleNewThread}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 min-w-[256px]">
          <div className="p-2 space-y-0.5">
            {threads.map(t => (
              <ContextMenu key={t.id}>
                <ContextMenuTrigger asChild>
                  <button
                    onClick={() => setActiveThreadId(t.id)}
                    data-testid={`thread-item-${t.id}`}
                    className={cn(
                      "w-full text-left px-3 py-3 rounded-lg text-sm transition-colors",
                      t.id === activeThread?.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    {editingThreadId === t.id ? (
                      <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          onBlur={handleSaveEdit}
                          className="flex-1 bg-background/50 border border-primary/20 rounded px-1.5 py-0.5 outline-none text-[13px] font-medium"
                          placeholder="Thread title..."
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group/item w-full">
                        <div className="min-w-0">
                          <div className="truncate text-[13px]">{t.title}</div>
                          <div className="text-[10px] mt-0.5 opacity-60">
                            {formatDistanceToNow(new Date(t.updatedAt))} ago
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(t.id, t.title);
                            }}
                            className="p-1 hover:bg-primary/20 rounded text-primary transition-colors"
                            title="Rename"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(t.id);
                            }}
                            className="p-1 hover:bg-destructive/20 rounded text-destructive transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => handleStartEdit(t.id, t.title)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => handleDeleteClick(t.id)}
                    className="flex items-center gap-2 text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Thread</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this thread? This action cannot be undone and all messages in this thread will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete Thread
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
