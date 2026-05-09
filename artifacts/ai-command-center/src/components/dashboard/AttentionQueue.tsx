/**
 * @file        artifacts/ai-command-center/src/components/dashboard/AttentionQueue.tsx
 * @module      AI Command Center / Dashboard
 * @purpose     Attention queue for human-in-the-loop decisions with approve/reject actions
 *
 * @ai_instructions
 *   - Queue should show pending count prominently in the header.
 *   - Empty state should be clear and reassuring when no decisions needed.
 *   - Items should animate in/out smoothly for better UX.
 *   - DO NOT modify queue structure without updating attention queue hooks.
 *
 * @exports     AttentionQueue
 * @imports     @/hooks/useAttentionQueue, ./DecisionPacket, lucide-react, framer-motion
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { useAttentionQueue } from "@/hooks/useAttentionQueue";
import { DecisionPacket } from "./DecisionPacket";
import { AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function AttentionQueue() {
  const { queue, approve, reject } = useAttentionQueue();

  return (
    <div className="flex flex-col h-full bg-card border-l relative overflow-hidden">
      <div className="px-6 py-5 border-b shrink-0 flex items-center justify-between sticky top-0 z-10 bg-card/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold tracking-tight">Attention Queue</h2>
        </div>
        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
          {queue.length} Pending
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        <AnimatePresence mode="popLayout">
          {queue.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium">All clear</p>
              <p className="text-xs mt-1 max-w-[200px]">No pending decisions require human attention.</p>
            </motion.div>
          ) : (
            queue.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              >
                <DecisionPacket item={item} onApprove={() => approve(item.id)} onReject={() => reject(item.id)} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
