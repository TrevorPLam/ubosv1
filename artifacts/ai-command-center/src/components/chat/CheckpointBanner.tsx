/**
 * @file        artifacts/ai-command-center/src/components/chat/CheckpointBanner.tsx
 * @module      AI Command Center / Chat
 * @purpose     Banner component displaying conversation checkpoints with title and timestamp
 *
 * @ai_instructions
 *   - Banner should be centered with proper visual hierarchy.
 *   - Checkpoint icon should use primary color for emphasis.
 *   - Timestamp should be displayed with reduced opacity.
 *   - DO NOT modify banner styling without updating chat layout.
 *
 * @exports     CheckpointBanner
 * @imports     lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Save } from "lucide-react";

export function CheckpointBanner({ title, time }: { title: string; time: string }) {
  return (
    <div className="flex items-center justify-center my-6 relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative bg-background px-4 text-xs text-muted-foreground flex items-center gap-2 border rounded-full py-1 shadow-sm">
        <Save className="w-3 h-3 text-primary" />
        <span className="font-semibold text-foreground">Checkpoint:</span> {title}
        <span className="opacity-50 ml-2">{time}</span>
      </div>
    </div>
  );
}
