import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Paperclip } from "lucide-react";

export function ChatInput({ onSend, isLoading }: { onSend: (text: string) => void; isLoading?: boolean }) {
  const [text, setText] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim() && !isLoading) {
      onSend(text);
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-background border-t">
      <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-card border rounded-xl p-2 shadow-sm focus-within:ring-1 focus-within:ring-ring">
        <Button type="button" variant="ghost" size="icon" className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground">
          <Paperclip className="w-4 h-4" />
        </Button>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a command to the fleet..."
          className="min-h-[40px] max-h-64 resize-none border-0 focus-visible:ring-0 shadow-none px-2 py-2 text-sm bg-transparent"
          rows={1}
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!text.trim() || isLoading}
          className="shrink-0 h-9 w-9 bg-primary text-primary-foreground"
        >
          <SendHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
