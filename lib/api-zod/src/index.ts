/**
 * @file        lib/api-zod/src/index.ts
 * @module      API Zod Schemas
 * @purpose     Main entry point for the Zod API schema library
 *
 * @ai_instructions
 *   - Only export from generated files.
 *   - DO NOT add any additional exports or implementations.
 *   - Keep this file minimal and focused on re-exports only.
 *
 * @exports     All exports from generated/api and generated/types
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

export * from "./generated/api";
// Exclude StreamResponseParams from types to avoid duplicate export
export * from "./generated/types/pagination";
export * from "./generated/types/createThreadRequest";
export * from "./generated/types/updateThreadRequest";
export * from "./generated/types/sendMessageRequest";
export * from "./generated/types/sendMessageRequestGroundingMode";
export * from "./generated/types/editMessageRequest";
export * from "./generated/types/feedbackRequest";
export * from "./generated/types/generateSummaryRequest";
export * from "./generated/types/updateGroundingRequest";
export * from "./generated/types/threadListResponse";
export * from "./generated/types/threadDetailResponse";
export * from "./generated/types/summaryJobResponse";
export * from "./generated/types/summary";
export * from "./generated/types/feedback";
export * from "./generated/types/chatThread";
export * from "./generated/types/message";
export * from "./generated/types/messageVersion";
export * from "./generated/types/citation";
export * from "./generated/types/pagination";
export * from "./generated/types/error";
export * from "./generated/types/validationError";
