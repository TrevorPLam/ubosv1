/**
 * @file        artifacts/ai-command-center/src/hooks/use-mobile.tsx
 * @module      UI / Responsive
 * @purpose     React hook to detect mobile viewport based on screen width breakpoint
 *
 * @ai_instructions
 *   - Must use window.matchMedia for responsive detection
 *   - Must properly cleanup event listeners on unmount
 *   - DO NOT change the MOBILE_BREAKPOINT constant without updating design system
 *
 * @exports     useIsMobile
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
