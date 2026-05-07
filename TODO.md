# UBOS v1 AI Command Center - Chat Interface Improvements

## Task Overview

This document outlines the missing capabilities and improvement tasks for the UBOS chat interface. Each task includes detailed subtasks, implementation requirements, and quality standards.

---

## ✅ TASK-021: Token / Context Window Visualization

**Status**: ✅ Complete  
**Priority**: Low  
**Estimated Effort**: Low

### Definition of Done
- [x] Progress bar for context window usage
- [x] Warning indicators when approaching limits
- [x] Suggestions to summarize or branch when full
- [x] Model-specific limit markers

### Implementation Notes
- `src/lib/tokens.ts` — model registry (GPT-5.x, Claude 4.x, Gemini 2.5), token estimator (4-chars/token heuristic + 10% system-prompt overhead), threshold constants
- `src/components/chat/ContextWindowBar.tsx` — animated slim progress bar, colour thresholds (green→amber→orange→red), warning icon at 75%, Summarize/Branch action buttons at 90%, model selector dropdown, full a11y (role=progressbar, aria labels, tooltips)
- `src/components/chat/ChatInterface.tsx` — added `selectedModel` state, `handleBranchFromContext` handler, `<ContextWindowBar>` rendered between header and scroll area

### Out of Scope
- Visualizing token attention weights
- Per-message token breakdown
- Editing tokens directly

### Advanced Coding Patterns
- Token counting utilities (e.g., tiktoken logic)
- Real-time usage calculation
- Visual feedback thresholds

### Anti-Patterns
- Don't make the visualization distracting
- Avoid inaccurate token estimations
- Never prevent messaging based on estimated limits alone

### Related Files
- `src/components/chat/ChatInterface.tsx`
- `src/api/chat.ts`
