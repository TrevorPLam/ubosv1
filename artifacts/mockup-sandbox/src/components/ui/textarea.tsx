/**
 * @file        artifacts/mockup-sandbox/src/components/ui/textarea.tsx
 * @module      Mockup Sandbox / UI Components
 * @purpose     Textarea component with styling and accessibility features
 *
 * @ai_instructions
 *   - Textarea must support all standard HTML textarea attributes.
 *   - Component must use forwardRef for proper ref forwarding.
 *   - Minimum height should be appropriate for multi-line input.
 *   - DO NOT modify base styles without updating the design system.
 *
 * @exports     Textarea
 * @imports     react, @/lib/utils
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
