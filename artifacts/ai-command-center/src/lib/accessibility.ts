/**
 * @file        artifacts/ai-command-center/src/lib/accessibility.ts
 * @module      Accessibility / Focus
 * @purpose     Accessibility utilities for focus management and keyboard navigation
 *
 * @ai_instructions
 *   - Must handle Tab key navigation with proper focus trapping
 *   - Must support both forward and backward Tab navigation
 *   - Must query all focusable elements within container
 *   - DO NOT modify focusable element selector without accessibility review
 *
 * @exports     handleFocusTrap
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

export const handleFocusTrap = (e: React.KeyboardEvent, containerRef: React.RefObject<HTMLElement | null>) => {
  if (e.key !== 'Tab' || !containerRef.current) return;

  const focusableElements = containerRef.current.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  if (e.shiftKey) {
    if (document.activeElement === firstElement) {
      lastElement.focus();
      e.preventDefault();
    }
  } else {
    if (document.activeElement === lastElement) {
      firstElement.focus();
      e.preventDefault();
    }
  }
};
