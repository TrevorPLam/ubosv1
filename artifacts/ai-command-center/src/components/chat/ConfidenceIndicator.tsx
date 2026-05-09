/**
 * @file        artifacts/ai-command-center/src/components/chat/ConfidenceIndicator.tsx
 * @module      AI Command Center / Chat
 * @purpose     Indicator component displaying AI response confidence levels with visual feedback
 *
 * @ai_instructions
 *   - Confidence levels must be categorized as high (≥0.8), medium (≥0.5), or low.
 *   - Icons should reflect the confidence level appropriately.
 *   - Component must be accessible with proper ARIA labels.
 *   - DO NOT modify confidence thresholds without updating chat documentation.
 *
 * @exports     ConfidenceIndicator
 * @imports     lucide-react, @/lib/utils
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Shield, ShieldAlert, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfidenceIndicatorProps {
  /** Confidence score from 0 to 1 */
  confidence: number;
  className?: string;
}

type ConfidenceLevel = "high" | "medium" | "low";

function getLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

const LEVEL_CONFIG: Record<
  ConfidenceLevel,
  { label: string; Icon: typeof Shield; colorClass: string }
> = {
  high: {
    label: "High confidence",
    Icon: Shield,
    colorClass:
      "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/50 dark:border-emerald-800",
  },
  medium: {
    label: "Medium confidence",
    Icon: ShieldAlert,
    colorClass:
      "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-800",
  },
  low: {
    label: "Low confidence",
    Icon: ShieldOff,
    colorClass:
      "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/50 dark:border-orange-800",
  },
};

export function ConfidenceIndicator({
  confidence,
  className,
}: ConfidenceIndicatorProps) {
  const level = getLevel(confidence);
  const { label, Icon, colorClass } = LEVEL_CONFIG[level];
  const percent = Math.round(confidence * 100);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium",
        colorClass,
        className
      )}
      role="status"
      aria-label={`${label}: ${percent}% confidence`}
      title={`${percent}% confidence`}
    >
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span>{label}</span>
      <span className="opacity-60">({percent}%)</span>
    </div>
  );
}
