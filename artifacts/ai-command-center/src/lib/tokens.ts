/**
 * @file        artifacts/ai-command-center/src/lib/tokens.ts
 * @module      AI / Tokens
 * @purpose     Token estimation and model context-window registry for LLM usage tracking
 *
 * @ai_instructions
 *   - Must use 4 chars ≈ 1 token heuristic for fast client-side estimation
 *   - Must include 10% overhead for system prompts and message framing
 *   - Must maintain up-to-date model registry with context windows
 *   - DO NOT use estimates to gate actual API calls - only for UI feedback
 *
 * @exports     MODEL_LIMITS, estimateTokens, estimateThreadTokens, usageRatio, formatTokenCount
 *          ModelKey, DEFAULT_MODEL, MODEL_OPTIONS, WARN_THRESHOLD, CRITICAL_THRESHOLD, DANGER_THRESHOLD
 * @imports     @/api/chat
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import type { Message } from "@/api/chat";

// ---------------------------------------------------------------------------
// Model registry
// ---------------------------------------------------------------------------

export const MODEL_LIMITS = {
  // OpenAI — 2025 catalogue
  "gpt-5.5": { label: "GPT-5.5", contextWindow: 1_000_000 },
  "gpt-5.4": { label: "GPT-5.4", contextWindow: 1_000_000 },
  "gpt-5.4-mini": { label: "GPT-5.4 mini", contextWindow: 400_000 },
  "gpt-4o": { label: "GPT-4o", contextWindow: 128_000 },
  "gpt-4o-mini": { label: "GPT-4o mini", contextWindow: 128_000 },
  // Anthropic Claude — 2025 catalogue
  "claude-opus-4-7": { label: "Claude Opus 4.7", contextWindow: 1_000_000 },
  "claude-sonnet-4-6": { label: "Claude Sonnet 4.6", contextWindow: 1_000_000 },
  "claude-haiku-4-5": { label: "Claude Haiku 4.5", contextWindow: 200_000 },
  // Google Gemini — representative values
  "gemini-2-5-pro": { label: "Gemini 2.5 Pro", contextWindow: 1_000_000 },
  "gemini-2-5-flash": { label: "Gemini 2.5 Flash", contextWindow: 1_000_000 },
} as const;

export type ModelKey = keyof typeof MODEL_LIMITS;

export const DEFAULT_MODEL: ModelKey = "claude-sonnet-4-6";

// Ordered list used to populate the selector dropdown.
export const MODEL_OPTIONS = Object.entries(MODEL_LIMITS).map(([key, val]) => ({
  key: key as ModelKey,
  label: val.label,
  contextWindow: val.contextWindow,
}));

// ---------------------------------------------------------------------------
// Threshold constants
// ---------------------------------------------------------------------------

/** Usage fraction at which the bar turns amber and a soft warning appears. */
export const WARN_THRESHOLD = 0.75;

/** Usage fraction at which the bar turns orange and action suggestions appear. */
export const CRITICAL_THRESHOLD = 0.90;

/** Usage fraction at which the bar turns red. */
export const DANGER_THRESHOLD = 0.97;

// ---------------------------------------------------------------------------
// Estimation helpers
// ---------------------------------------------------------------------------

/**
 * Estimates the token count for an arbitrary string.
 *
 * Rule of thumb: 1 token ≈ 4 characters for mixed English + code content.
 * This is within ~10 % of tiktoken for typical chat conversations.
 *
 * @param text  Arbitrary UTF-16 string (message content, etc.).
 * @returns     Non-negative integer token estimate.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

/**
 * Estimates the total token usage for a thread, including:
 *  - All persisted message contents.
 *  - Any currently-streaming partial text.
 *  - A 10 % overhead factor to account for system prompts, role labels,
 *    and per-message framing tokens that are invisible in the UI.
 *
 * @param messages      Persisted messages in the active thread.
 * @param streamingText Partially-received assistant content (may be "").
 * @returns             Non-negative integer token estimate.
 */
export function estimateThreadTokens(
  messages: Message[],
  streamingText = ""
): number {
  const rawCharCount =
    messages.reduce((acc, msg) => acc + msg.content.length, 0) +
    streamingText.length;

  const rawEstimate = Math.ceil(rawCharCount / 4);
  // Add 10 % overhead for system prompt + message framing
  return Math.ceil(rawEstimate * 1.1);
}

/**
 * Returns a usage ratio [0, 1] clamped to the model's context window.
 */
export function usageRatio(usedTokens: number, modelKey: ModelKey): number {
  const limit = MODEL_LIMITS[modelKey].contextWindow;
  return Math.min(usedTokens / limit, 1);
}

/**
 * Formats a token count as a human-readable string, e.g. "4.2K" or "1.02M".
 */
export function formatTokenCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(2)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}
