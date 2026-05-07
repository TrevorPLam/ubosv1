import { Message } from "@/api/chat";
import { cn } from "@/lib/utils";
import { Bot, User, Copy } from "lucide-react";
import { ToolCallDisclosure } from "./ToolCallDisclosure";
import { format } from "date-fns";
import { useState } from "react";
import { useClipboard } from "@/hooks/useClipboard";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const [isHovered, setIsHovered] = useState(false);
  const { copy, isLoading, isCopied, isSupported } = useClipboard();

  const handleCopy = async () => {
    if (!message.content) return;
    
    try {
      await copy(message.content);
      toast.success("Copied to clipboard", {
        description: "Message content has been copied successfully",
        duration: 2000,
      });
    } catch (error) {
      toast.error("Failed to copy", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 3000,
      });
    }
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  // Combine tool calls and results visually if needed, but for simplicity we rely on the schema
  // Assuming a tool_call message might have a paired tool_result shortly after, or they are single combined messages.
  // Using the provided schema where toolCalls and toolResult can exist.
  
  const hasTools = message.toolCalls && message.toolCalls.length > 0;

  const messageContent = (
    <div 
      className={cn("flex gap-4 max-w-4xl group", isUser ? "ml-auto flex-row-reverse" : "")}
      data-message-id={message.id}
      tabIndex={0} // Make message focusable for keyboard navigation
      role="article"
      aria-label={`${isUser ? "You" : message.agentId || "Assistant"} message`}
    >
      <div className={cn(
        "w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-1",
        isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      
      <div className={cn("flex flex-col gap-1 min-w-0", isUser ? "items-end" : "items-start")}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <span className="font-medium">{isUser ? "You" : message.agentId || "Assistant"}</span>
          <span>{format(new Date(message.timestamp), "HH:mm")}</span>
        </div>
        
        {message.content && (
          <div 
            className={cn(
              "relative rounded-lg px-4 py-2 text-sm max-w-prose whitespace-pre-wrap break-words transition-all duration-200",
              isUser ? "bg-primary text-primary-foreground" : "bg-card border shadow-sm"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {message.content}
            
            {/* Copy button - appears on hover */}
            {isSupported && message.content && (
              <button
                onClick={handleCopy}
                disabled={isLoading}
                className={cn(
                  "absolute top-2 right-2 p-1.5 rounded-md transition-all duration-200",
                  "opacity-0 group-hover:opacity-100",
                  "bg-background/80 hover:bg-background border border-border/50",
                  "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  isHovered ? "opacity-100" : "opacity-0",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Copy message"
                title="Copy message (Ctrl+C)"
              >
                <Copy className={cn(
                  "w-3.5 h-3.5 transition-transform",
                  isCopied ? "text-green-600 scale-110" : "text-muted-foreground"
                )} />
              </button>
            )}
          </div>
        )}

        {hasTools && (
          <ToolCallDisclosure 
            toolCalls={message.toolCalls!} 
            result={message.toolResult} 
            defaultOpen={!message.toolResult} 
          />
        )}
      </div>
    </div>
  );

  // Wrap with context menu for right-click copy functionality
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {messageContent}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem 
          onClick={handleCopy}
          disabled={!isSupported || !message.content || isLoading}
          className="flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy message
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
