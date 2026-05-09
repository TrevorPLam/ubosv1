/**
 * @file        artifacts/ai-command-center/src/api/client.ts
 * @module      AI Command Center / API
 * @purpose     API client configuration and mock fetch utilities
 *
 * @ai_instructions
 *   - API_BASE must match the backend server URL.
 *   - Mock fetch should simulate realistic API latency.
 *   - All API calls should use this client for consistency.
 *   - DO NOT modify API_BASE without updating environment configuration.
 *
 * @exports     API_BASE, mockFetch
 * @imports     None
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

export const API_BASE = "http://localhost:8000";

// Mock fetch wrapper to simulate API latency
export const mockFetch = <T>(data: T, delayMs: number = 300): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delayMs);
  });
};
