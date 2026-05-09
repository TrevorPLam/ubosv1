/**
 * @file        artifacts/ai-command-center/src/components/ui/input.tsx
 * @module      AI Command Center / UI Components
 * @purpose     Form input component with consistent styling and accessibility support
 *
 * @ai_instructions
 *   - Input component must forward ref for proper DOM manipulation.
 *   - Should support all standard HTML input attributes and types.
 *   - Styling must be consistent with design system tokens.
 *   - DO NOT modify input styling without updating form validation logic.
 *
 * @exports     Input
 * @imports     @/lib/utils
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
