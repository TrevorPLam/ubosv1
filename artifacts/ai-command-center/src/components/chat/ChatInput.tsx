import { useState, useRef, ChangeEvent, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Paperclip, Square, X, Mic, MicOff } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { VoiceWaveform } from "./VoiceWaveform";
import { Progress } from "@/components/ui/progress";
import { FileAttachment } from "@/api/chat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ChatInput({ onSend, onStop, isLoading, isStreaming }: { 
  onSend: (text: string, attachments?: FileAttachment[]) => void; 
  onStop?: () => void;
  isLoading?: boolean;
  isStreaming?: boolean;
}) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice input handling
  const handleVoiceTranscript = useCallback((interim: string) => {
    // Optional: show interim transcript somewhere or do nothing
  }, []);

  const handleVoiceFinal = useCallback((final: string) => {
    setText(prev => prev + (prev.endsWith(" ") || !prev ? "" : " ") + final);
  }, []);

  const { isListening, error: voiceError, startListening, stopListening } = useVoiceInput({
    onTranscript: handleVoiceTranscript,
    onFinalTranscript: handleVoiceFinal
  });

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    if (voiceError) {
      toast.error("Voice input error", { description: voiceError });
    }
  }, [voiceError]);
  
  const {
    files,
    uploadProgress,
    error,
    isUploading,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
    clearAllFiles,
    uploadFiles
  } = useFileUpload({
    maxSizeMB: 10,
    maxFiles: 5,
    allowedTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/json'
    ]
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (isLoading || isUploading) return;
    
    if (text.trim() || files.length > 0) {
      let attachments: FileAttachment[] = [];
      
      // Upload files if any exist
      if (files.length > 0) {
        try {
          attachments = await uploadFiles();
          toast.success("Files uploaded successfully");
        } catch (error) {
          toast.error("Upload failed", {
            description: error instanceof Error ? error.message : "Unknown error occurred"
          });
          return;
        }
      }
      
      onSend(text.trim(), attachments);
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isUploading) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.txt,.json"
      />
      
      <form onSubmit={handleSubmit} className="p-4 bg-background border-t">
        {/* File previews */}
        {files.length > 0 && (
          <div className="max-w-4xl mx-auto mb-3">
            <div className="flex flex-wrap gap-2 p-3 bg-card border rounded-lg">
              {files.map((fileData) => (
                <div
                  key={fileData.id}
                  className="relative group flex items-center gap-2 p-2 bg-muted rounded-md border"
                >
                  {/* File preview */}
                  {fileData.file.type.startsWith('image/') ? (
                    <img
                      src={fileData.preview}
                      alt={fileData.file.name}
                      className="w-12 h-12 object-cover rounded-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-primary/10 rounded-sm">
                      <Paperclip className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  
                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileData.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(fileData.file.size / 1024).toFixed(1)} KB
                    </p>
                    
                    {/* Upload progress */}
                    {uploadProgress[fileData.id] !== undefined && (
                      <div className="mt-1">
                        <Progress value={uploadProgress[fileData.id]} className="h-1" />
                      </div>
                    )}
                  </div>
                  
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeFile(fileData.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded-sm"
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
              
              {/* Clear all button */}
              <button
                type="button"
                onClick={clearAllFiles}
                className="text-xs text-destructive hover:underline px-2 py-1"
                disabled={isUploading}
              >
                Clear all
              </button>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="mt-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        )}
        
        <div 
          className="max-w-4xl mx-auto relative flex items-end gap-2 bg-card border rounded-xl p-2 shadow-sm focus-within:ring-1 focus-within:ring-ring"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={handlePaperclipClick}
            disabled={isUploading}
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className={cn(
              "shrink-0 h-9 w-9 transition-colors",
              isListening ? "text-primary animate-pulse bg-primary/10" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={toggleVoiceInput}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>
          
          <div className="flex-1 flex flex-col min-h-[40px] justify-center">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : "Send a command to the fleet..."}
              className="min-h-[40px] max-h-64 resize-none border-0 focus-visible:ring-0 shadow-none px-2 py-2 text-sm bg-transparent"
              rows={1}
              disabled={isLoading || isUploading}
            />
            {isListening && <VoiceWaveform isListening={isListening} className="ml-2 mb-1" />}
          </div>
          
          {isStreaming && onStop ? (
            <Button 
              type="button"
              size="icon" 
              onClick={onStop}
              className="shrink-0 h-9 w-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              title="Stop generation"
            >
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              size="icon" 
              disabled={(!text.trim() && files.length === 0) || isLoading || isUploading}
              className="shrink-0 h-9 w-9 bg-primary text-primary-foreground"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <SendHorizontal className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </form>
    </>
  );
}
