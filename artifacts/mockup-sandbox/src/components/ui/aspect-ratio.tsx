/**
 * @file        artifacts/mockup-sandbox/src/components/ui/aspect-ratio.tsx
 * @module      Mockup Sandbox / UI Components
 * @purpose     Aspect ratio component for maintaining consistent element proportions
 *
 * @ai_instructions
 *   - Component must extend Radix UI primitive props for full API compatibility.
 *   - AspectRatio should be a simple wrapper around the primitive.
 *   - DO NOT add additional styling that conflicts with the primitive behavior.
 *
 * @exports     AspectRatio
 * @imports     @radix-ui/react-aspect-ratio
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

const AspectRatio = AspectRatioPrimitive.Root

export { AspectRatio }
