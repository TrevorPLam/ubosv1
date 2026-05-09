/**
 * @file        artifacts/ai-command-center/src/stores/uiStore.ts
 * @module      Stores / UI
 * @purpose     Zustand store for global UI state management
 *
 * @ai_instructions
 *   - Must use Zustand for state management
 *   - Must maintain command palette and sidebar state
 *   - Must provide simple toggle and open/close actions
 *   - DO NOT add additional UI state without reviewing global state architecture
 *
 * @exports     useUIStore
 * @imports     zustand
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { create } from 'zustand'

interface UIStore {
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  commandPaletteOpen: false,
  sidebarCollapsed: false,
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
