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
import { ClerkProvider } from "@clerk/react";
import { setBaseUrl } from "@workspace/api-client-react";
import { initializeSentry } from "./lib/observability";
import App from "./App";
import "./index.css";

// Initialize Sentry for error tracking and performance monitoring
initializeSentry();

// Configure API client base URL
setBaseUrl(import.meta.env.VITE_API_BASE_URL || "http://localhost:3001");

createRoot(document.getElementById("root")!).render(
  <ClerkProvider 
    publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
    appearance={{
      elements: {
        rootBox: "min-h-screen bg-background",
      },
    }}
  >
    <App />
  </ClerkProvider>
);
