/**
 * @file        artifacts/mockup-sandbox/src/components/ui/input.tsx
 * @module      Mockup Sandbox / UI Components
 * @purpose     Input component with styling and accessibility features
 *
 * @ai_instructions
 *   - Input must support all standard HTML input attributes.
 *   - Component must use forwardRef for proper ref forwarding.
 *   - Styling should be consistent with other form components.
 *   - DO NOT modify base styles without updating the design system.
 *
 * @exports     Input
 * @imports     react, @/lib/utils
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
