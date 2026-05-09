/**
 * @file        artifacts/ai-command-center/src/components/ui/separator.tsx
 * @module      AI Command Center / UI Components
 * @purpose     Separator component for visual content division using Radix UI primitives
 *
 * @ai_instructions
 *   - Separator component must use Radix UI primitives for accessibility.
 *   - Should forward ref for proper DOM manipulation.
 *   - Must support both horizontal and vertical orientations.
 *   - DO NOT modify separator behavior without updating accessibility features.
 *
 * @exports     Separator
 * @imports     @radix-ui/react-separator, @/lib/utils
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
