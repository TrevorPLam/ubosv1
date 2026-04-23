import { Message } from "@/api/chat";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { ToolCallDisclosure } from "./ToolCallDisclosure";
import { format } from "date-fns";

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

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

  return (
    <div className={cn("flex gap-4 max-w-4xl", isUser ? "ml-auto flex-row-reverse" : "")}>
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
          <div className={cn(
            "rounded-lg px-4 py-2 text-sm max-w-prose whitespace-pre-wrap break-words",
            isUser ? "bg-primary text-primary-foreground" : "bg-card border shadow-sm"
          )}>
            {message.content}
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
}
