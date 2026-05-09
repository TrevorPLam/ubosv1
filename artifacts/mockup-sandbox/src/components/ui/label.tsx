/**
 * @file        artifacts/mockup-sandbox/src/components/ui/label.tsx
 * @module      Mockup Sandbox / UI Components
 * @purpose     Label component with variants and accessibility features
 *
 * @ai_instructions
 *   - Label must use Radix UI primitives for accessibility.
 *   - Component must support variant styling through class-variance-authority.
 *   - Label should properly associate with form controls.
 *   - DO NOT modify variants without updating the design system.
 *
 * @exports     Label
 * @imports     react, @radix-ui/react-label, class-variance-authority, @/lib/utils
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
