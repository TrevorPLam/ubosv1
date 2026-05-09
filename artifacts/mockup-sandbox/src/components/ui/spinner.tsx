/**
 * @file        artifacts/mockup-sandbox/src/components/ui/spinner.tsx
 * @module      Mockup Sandbox / UI Components
 * @purpose     Spinner component for loading indicators built on lucide-react icons
 *
 * @ai_instructions
 *   - Spinner should support all standard HTML svg attributes.
 *   - Component must have proper animation for loading states.
 *   - Spinner should have proper ARIA attributes for accessibility.
 *   - DO NOT modify spinner animation without updating the design system.
 *
 * @exports     Spinner
 * @imports     lucide-react, @/lib/utils
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
