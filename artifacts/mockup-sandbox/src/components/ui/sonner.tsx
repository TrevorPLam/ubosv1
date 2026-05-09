/**
 * @file        artifacts/mockup-sandbox/src/components/ui/sonner.tsx
 * @module      Mockup Sandbox / UI Components
 * @purpose     Toast notification component built on sonner with theme support
 *
 * @ai_instructions
 *   - Toaster must extend sonner props for full API compatibility.
 *   - Component should support both light and dark themes.
 *   - Toast positioning and behavior should be consistent.
 *   - DO NOT modify toast behavior without updating user experience guidelines.
 *
 * @exports     Toaster
 * @imports     next-themes, sonner
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
