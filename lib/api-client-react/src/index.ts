/**
 * @file        lib/api-client-react/src/index.ts
 * @module      API Client / React
 * @purpose     Main entry point for the React API client library
 *
 * @ai_instructions
 *   - Only export from generated files and custom-fetch.
 *   - DO NOT add any additional exports or implementations.
 *   - Keep this file minimal and focused on re-exports only.
 *
 * @exports     All exports from generated/api, generated/api.schemas,
 *              setBaseUrl, setAuthTokenGetter, AuthTokenGetter
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";
