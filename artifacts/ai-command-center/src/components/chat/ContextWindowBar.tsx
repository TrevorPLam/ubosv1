/**
 * ContextWindowBar
 *
 * A compact strip rendered just below the chat header that visualises how
 * much of the active model's context window is consumed by the current
 * thread.  It provides:
 *
 *  - A slim progress bar whose fill colour shifts from green → amber →
 *    orange → red as usage approaches the model's limit.
 *  - A human-readable "X / Y tokens" label.
 *  - An animated warning icon once usage exceeds the WARN_THRESHOLD (75 %).
 *  - Inline action buttons ("Summarize" and "Branch") that appear once
 *    usage crosses the CRITICAL_THRESHOLD (90 %), prompting the user to
 *    reduce context pressure without blocking them from continuing.
 *  - A model-selector dropdown so the user can switch models and
 *    immediately see how the new limit changes their usage ratio.
 *
 * Design decisions:
 *  - Never prevents the user from sending a message — estimation is
 *    approximate and should only guide, not gate.
 *  - The strip is hidden when there are no messages to avoid noise on
 *    empty threads.
 *  - All heavy computation is memoised; the component re-renders cheaply.
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Sparkles, GitBranch, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MODEL_LIMITS,
  MODEL_OPTIONS,
  type ModelKey,
  estimateThreadTokens,
  usageRatio,
  formatTokenCount,
  WARN_THRESHOLD,
  CRITICAL_THRESHOLD,
  DANGER_THRESHOLD,
} from "@/lib/tokens";
import type { Message } from "@/api/chat";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContextWindowBarProps {
  /** All persisted messages in the active thread. */
  messages: Message[];
  /** Currently-streaming partial text (may be empty). */
  streamingText?: string;
  /** Currently selected model. */
  selectedModel: ModelKey;
  /** Callback when the user changes the model. */
  onModelChange: (model: ModelKey) => void;
  /** Triggered when user clicks "Summarize" in the suggestion banner. */
  onSuggestSummarize?: () => void;
  /** Triggered when user clicks "Branch" in the suggestion banner. */
  onSuggestBranch?: () => void;
  /** Extra className applied to the root element. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Maps a usage ratio to a Tailwind colour class for the progress fill. */
function barColour(ratio: number): string {
  if (ratio >= DANGER_THRESHOLD) return "bg-red-500";
  if (ratio >= CRITICAL_THRESHOLD) return "bg-orange-500";
  if (ratio >= WARN_THRESHOLD) return "bg-amber-500";
  return "bg-emerald-500";
}

/** Maps a usage ratio to a Tailwind text-colour class for the label. */
function labelColour(ratio: number): string {
  if (ratio >= DANGER_THRESHOLD) return "text-red-500";
  if (ratio >= CRITICAL_THRESHOLD) return "text-orange-500";
  if (ratio >= WARN_THRESHOLD) return "text-amber-500";
  return "text-muted-foreground";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContextWindowBar({
  messages,
  streamingText = "",
  selectedModel,
  onModelChange,
  onSuggestSummarize,
  onSuggestBranch,
  className,
}: ContextWindowBarProps) {
  const usedTokens = useMemo(
    () => estimateThreadTokens(messages, streamingText),
    [messages, streamingText]
  );

  const ratio = useMemo(
    () => usageRatio(usedTokens, selectedModel),
    [usedTokens, selectedModel]
  );

  const contextWindow = MODEL_LIMITS[selectedModel].contextWindow;
  const pct = Math.round(ratio * 100);
  const isWarning = ratio >= WARN_THRESHOLD;
  const isCritical = ratio >= CRITICAL_THRESHOLD;

  // Don't render at all on a brand-new empty thread — no noise.
  if (messages.length === 0 && !streamingText) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "px-4 py-1.5 border-b bg-card/40 flex items-center gap-3",
          className
        )}
        role="status"
        aria-label={`Context window usage: ${pct}%`}
      >
        {/* ── Model selector ── */}
        <Select value={selectedModel} onValueChange={(v) => onModelChange(v as ModelKey)}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SelectTrigger
                className="h-6 w-auto min-w-32.5 max-w-42.5 text-[11px] px-2 py-0 border-none bg-transparent shadow-none focus:ring-0 gap-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Select AI model"
              >
                <Cpu className="w-3 h-3 shrink-0" aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Switch model to change context limit</p>
            </TooltipContent>
          </Tooltip>
          <SelectContent>
            {MODEL_OPTIONS.map(({ key, label, contextWindow: cw }) => (
              <SelectItem key={key} value={key} className="text-xs">
                <span className="font-medium">{label}</span>
                <span className="ml-2 text-muted-foreground">
                  {formatTokenCount(cw)} ctx
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* ── Progress track ── */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Custom thin bar — Radix Progress adds aria-valuenow automatically */}
              <div
                className="relative h-1.5 flex-1 rounded-full bg-muted overflow-hidden cursor-default"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Context window usage"
              >
                <motion.div
                  className={cn("h-full rounded-full transition-colors duration-500", barColour(ratio))}
                  initial={false}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />

                {/* Warning threshold marker at 75 % */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-amber-400/60"
                  style={{ left: `${WARN_THRESHOLD * 100}%` }}
                  aria-hidden="true"
                />
                {/* Critical threshold marker at 90 % */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-orange-400/60"
                  style={{ left: `${CRITICAL_THRESHOLD * 100}%` }}
                  aria-hidden="true"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>
                ~{formatTokenCount(usedTokens)} of{" "}
                {formatTokenCount(contextWindow)} tokens used ({pct}%)
              </p>
              <p className="text-muted-foreground text-[10px] mt-0.5">
                Estimate includes 10% system-prompt overhead
              </p>
            </TooltipContent>
          </Tooltip>

          {/* ── Usage label ── */}
          <span
            className={cn(
              "text-[10px] font-medium tabular-nums shrink-0 transition-colors duration-300",
              labelColour(ratio)
            )}
          >
            {formatTokenCount(usedTokens)}&thinsp;/&thinsp;{formatTokenCount(contextWindow)}
          </span>

          {/* ── Warning icon (appears at WARN_THRESHOLD) ── */}
          <AnimatePresence>
            {isWarning && (
              <motion.div
                key="warn-icon"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.2 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle
                      className={cn(
                        "w-3.5 h-3.5 shrink-0",
                        isCritical ? "text-orange-500" : "text-amber-500"
                      )}
                      aria-label="Context window warning"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {isCritical
                      ? "Context window almost full — consider summarizing or branching."
                      : "Context window is getting full. Summarizing can free up space."}
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Action suggestions (appear at CRITICAL_THRESHOLD) ── */}
        <AnimatePresence>
          {isCritical && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-1.5 shrink-0"
            >
              {onSuggestSummarize && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onSuggestSummarize}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 transition-colors"
                      aria-label="Summarize conversation to free context"
                    >
                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                      Summarize
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Generate a summary to compress the conversation and free context
                  </TooltipContent>
                </Tooltip>
              )}
              {onSuggestBranch && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onSuggestBranch}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      aria-label="Branch conversation to start fresh"
                    >
                      <GitBranch className="w-3 h-3" aria-hidden="true" />
                      Branch
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Create a branch from the current point to start fresh with less context
                  </TooltipContent>
                </Tooltip>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
