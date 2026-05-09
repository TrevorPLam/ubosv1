/**
 * @file        artifacts/ai-command-center/src/components/ui/textarea.tsx
 * @module      AI Command Center / UI Components
 * @purpose     Textarea form component with consistent styling and accessibility support
 *
 * @ai_instructions
 *   - Textarea component must forward ref for proper DOM manipulation.
 *   - Should support all standard HTML textarea attributes.
 *   - Styling must be consistent with design system tokens.
 *   - DO NOT modify textarea styling without updating form validation logic.
 *
 * @exports     Textarea
 * @imports     @/lib/utils
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
