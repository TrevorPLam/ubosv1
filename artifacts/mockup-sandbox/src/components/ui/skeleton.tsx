/**
 * @file        artifacts/mockup-sandbox/src/components/ui/skeleton.tsx
 * @module      Mockup Sandbox / UI Components
 * @purpose     Skeleton component for loading state placeholders
 *
 * @ai_instructions
 *   - Skeleton should support all standard HTML div attributes.
 *   - Component must have proper animation for loading states.
 *   - Skeleton styling should be consistent with the design system.
 *   - DO NOT modify skeleton animation without updating the design system.
 *
 * @exports     Skeleton
 * @imports     @/lib/utils
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
