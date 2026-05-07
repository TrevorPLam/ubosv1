import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageVersion } from "@/api/chat";

interface MessageEditorProps {
  messageId: string;
  initialContent: string;
  onSave: (messageId: string, newContent: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  showVersionHistory?: boolean;
  versions?: MessageVersion[];
  onRestoreVersion?: (messageId: string, versionId: string) => void;
}

export function MessageEditor({
  messageId,
  initialContent,
  onSave,
  onCancel,
  isLoading = false,
  showVersionHistory = false,
  versions = [],
  onRestoreVersion
}: MessageEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const handleSave = () => {
    if (content.trim() !== initialContent.trim()) {
      onSave(messageId, content.trim());
    } else {
      onCancel(); // No changes made
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleRestoreVersion = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setContent(version.content);
      setIsVersionHistoryOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] resize-none"
            placeholder="Edit your message..."
            disabled={isLoading}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-muted-foreground">
              Press Ctrl+Enter to save, Esc to cancel
            </div>
            <div className="flex items-center gap-2">
              {showVersionHistory && versions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsVersionHistoryOpen(!isVersionHistoryOpen)}
                  className="text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Version History ({versions.length})
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
              
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isLoading || content.trim() === initialContent.trim()}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Check className="w-3 h-3 mr-1" />
                )}
                Save
              </Button>
            </div>
          </div>

          {/* Version History Dropdown */}
          {isVersionHistoryOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              <div className="p-2 border-b">
                <div className="text-sm font-medium">Version History</div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {versions.map((version, index) => (
                  <button
                    key={version.id}
                    onClick={() => handleRestoreVersion(version.id)}
                    className={cn(
                      "w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-b-0",
                      "text-sm group"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-xs text-muted-foreground mb-1">
                          {new Date(version.timestamp).toLocaleString()}
                          {version.isCurrent && (
                            <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-xs line-clamp-2">
                          {version.content}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
