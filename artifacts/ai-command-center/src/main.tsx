/**
 * @file        artifacts/ai-command-center/src/main.tsx
 * @module      AI Command Center / Core
 * @purpose     Application entry point with React root initialization
 *
 * @ai_instructions
 *   - Root element must exist in the DOM before rendering.
 *   - CSS imports must be loaded before React components.
 *   - DO NOT modify the root element selector without updating index.html.
 *
 * @imports     react-dom/client, ./App, ./index.css
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
