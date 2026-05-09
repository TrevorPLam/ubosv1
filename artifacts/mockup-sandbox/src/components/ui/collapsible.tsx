/**
 * @file        artifacts/mockup-sandbox/src/components/ui/collapsible.tsx
 * @module      Mockup Sandbox / UI Components
 * @purpose     Collapsible component for toggleable content built on Radix UI primitives
 *
 * @ai_instructions
 *   - Components must extend Radix UI primitive props for full API compatibility.
 *   - Collapsible should be simple wrappers around the primitives.
 *   - DO NOT add additional styling that conflicts with primitive behavior.
 *
 * @exports     Collapsible, CollapsibleTrigger, CollapsibleContent
 * @imports     @radix-ui/react-collapsible
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
