/**
 * @file        artifacts/ai-command-center/src/components/chat/FeedbackControls.tsx
 * @module      AI Command Center / Chat
 * @purpose     Feedback controls component for thumbs up/down rating of AI responses
 *
 * @ai_instructions
 *   - Controls should appear on hover with smooth transitions.
 *   - Feedback state must be clearly indicated with color changes.
 *   - Component should be accessible with proper ARIA attributes.
 *   - DO NOT modify feedback structure without updating chat API types.
 *
 * @exports     FeedbackControls
 * @imports     react, lucide-react, @/components/ui/button, @/lib/utils, @/api/chat
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageFeedback } from "@/api/chat";

interface FeedbackControlsProps {
  messageId: string;
  feedback?: MessageFeedback;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  isLoading?: boolean;
}

export function FeedbackControls({
  messageId,
  feedback,
  onThumbsUp,
  onThumbsDown,
  isLoading = false,
}: FeedbackControlsProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isPositive = feedback?.rating === 'positive';
  const isNegative = feedback?.rating === 'negative';

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md border border-transparent transition-all duration-200",
        isHovered && "border-border bg-background/80",
        "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="group"
      aria-label="Message feedback"
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7 transition-all duration-200",
          isPositive
            ? "text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        onClick={onThumbsUp}
        disabled={isLoading || isPositive}
        aria-label="Mark response as helpful"
        aria-pressed={isPositive}
        title={isPositive ? "Marked as helpful" : "Mark as helpful"}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7 transition-all duration-200",
          isNegative
            ? "text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
        onClick={onThumbsDown}
        disabled={isLoading || isNegative}
        aria-label="Mark response as not helpful"
        aria-pressed={isNegative}
        title={isNegative ? "Marked as not helpful" : "Mark as not helpful"}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
