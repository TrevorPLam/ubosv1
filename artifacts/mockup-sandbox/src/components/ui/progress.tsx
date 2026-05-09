/**
 * @file        artifacts/mockup-sandbox/src/components/ui/progress.tsx
 * @module      Mockup Sandbox / UI Components
 * @purpose     Progress component for displaying progress indicators built on Radix UI primitives
 *
 * @ai_instructions
 *   - Progress must extend Radix UI primitive props for full API compatibility.
 *   - Component must use forwardRef for proper ref forwarding.
 *   - Progress should have proper ARIA attributes for accessibility.
 *   - DO NOT modify progress behavior without updating accessibility guidelines.
 *
 * @exports     Progress
 * @imports     react, @radix-ui/react-progress, @/lib/utils
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
