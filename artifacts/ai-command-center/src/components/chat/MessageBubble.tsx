import { Message, FileAttachment, submitFeedback } from "@/api/chat";
import { cn } from "@/lib/utils";
import { Bot, User, Copy, Download, FileText, Image } from "lucide-react";
import { ToolCallDisclosure } from "./ToolCallDisclosure";
import { FeedbackControls } from "./FeedbackControls";
import { FeedbackModal } from "./FeedbackModal";
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

export function MessageBubble({ message, searchTerm }: { message: Message; searchTerm?: string }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const [isHovered, setIsHovered] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const { copy, isLoading, isCopied, isSupported } = useClipboard();

  const HighlightedText = ({ text, term }: { text: string; term?: string }) => {
    if (!term || !term.trim()) return <>{text}</>;
    
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === term.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-black dark:text-white rounded-sm px-0.5">
              {part}
            </mark>
          ) : part
        )}
      </>
    );
  };

  const handleDownload = (attachment: FileAttachment) => {
    if (attachment.url) {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const FileAttachmentComponent = ({ attachment }: { attachment: FileAttachment }) => {
    const isImage = attachment.type.startsWith('image/');
    const isPDF = attachment.type === 'application/pdf';
    
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/50 border rounded-lg mt-2">
        {/* File icon/preview */}
        <div className="flex-shrink-0">
          {isImage && attachment.url ? (
            <img
              src={attachment.url}
              alt={attachment.name}
              className="w-16 h-16 object-cover rounded-md"
            />
          ) : (
            <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-md">
              {isPDF ? (
                <FileText className="w-8 h-8 text-primary" />
              ) : (
                <FileText className="w-8 h-8 text-primary" />
              )}
            </div>
          )}
        </div>
        
        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{attachment.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(attachment.size)} • {attachment.type}
          </p>
        </div>
        
        {/* Download button */}
        {attachment.url && (
          <button
            onClick={() => handleDownload(attachment)}
            className="flex-shrink-0 p-2 hover:bg-primary/10 rounded-md transition-colors"
            title={`Download ${attachment.name}`}
          >
            <Download className="w-4 h-4 text-primary" />
          </button>
        )}
      </div>
    );
  };

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

  const handleThumbsUp = async () => {
    if (isSubmittingFeedback) return;
    
    setIsSubmittingFeedback(true);
    try {
      await submitFeedback(message.id, 'positive');
      toast.success("Thanks for your feedback", {
        description: "Your response helps us improve",
        duration: 2000,
      });
    } catch (error) {
      toast.error("Failed to submit feedback", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 3000,
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleThumbsDown = () => {
    if (isSubmittingFeedback) return;
    setShowFeedbackModal(true);
  };

  const handleFeedbackSubmit = async (category: 'inaccurate' | 'not_relevant' | 'incomplete' | 'harmful', comment?: string) => {
    setIsSubmittingFeedback(true);
    try {
      await submitFeedback(message.id, 'negative', category, comment);
      toast.success("Thanks for your feedback", {
        description: "Your response helps us improve",
        duration: 2000,
      });
    } catch (error) {
      toast.error("Failed to submit feedback", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
        duration: 3000,
      });
    } finally {
      setIsSubmittingFeedback(false);
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
            <HighlightedText text={message.content} term={searchTerm} />
            
            {/* Action buttons - appear on hover */}
            <div className={cn(
              "absolute top-2 right-2 flex items-center gap-1 transition-all duration-200",
              "opacity-0 group-hover:opacity-100",
              "focus:opacity-100",
              isHovered ? "opacity-100" : "opacity-0"
            )}>
              {/* Feedback controls - only for assistant messages */}
              {!isUser && (
                <FeedbackControls
                  messageId={message.id}
                  feedback={message.feedback}
                  onThumbsUp={handleThumbsUp}
                  onThumbsDown={handleThumbsDown}
                  isLoading={isSubmittingFeedback}
                />
              )}
              
              {/* Copy button */}
              {isSupported && message.content && (
                <button
                  onClick={handleCopy}
                  disabled={isLoading}
                  className={cn(
                    "p-1.5 rounded-md transition-all duration-200",
                    "bg-background/80 hover:bg-background border border-border/50",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
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
          </div>
        )}

        {/* File attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <FileAttachmentComponent 
                key={attachment.id} 
                attachment={attachment} 
              />
            ))}
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
    <>
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

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        isLoading={isSubmittingFeedback}
      />
    </>
  );
}
