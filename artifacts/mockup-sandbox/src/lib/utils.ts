/**
 * @file        artifacts/mockup-sandbox/src/lib/utils.ts
 * @module      Mockup Sandbox / Utilities
 * @purpose     Utility functions for CSS class name merging and styling
 *
 * @ai_instructions
 *   - cn function must combine clsx and tailwind-merge for proper class handling.
 *   - Tailwind classes should take precedence over conflicting classes.
 *   - Function must handle conditional classes and arrays properly.
 *   - DO NOT modify class merging logic without testing component styling.
 *
 * @exports     cn
 * @imports     clsx, tailwind-merge
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
