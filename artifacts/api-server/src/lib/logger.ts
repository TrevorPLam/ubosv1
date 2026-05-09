/**
 * @file        artifacts/api-server/src/lib/logger.ts
 * @module      API Server / Logging
 * @purpose     Centralized logging configuration with Pino logger
 *
 * @ai_instructions
 *   - Logger must redact sensitive headers and cookies.
 *   - Production environment should use structured JSON logging.
 *   - Development environment should use pretty-printed logs.
 *   - DO NOT modify redaction rules without security review.
 *
 * @exports     logger
 * @imports     pino
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

// AI-NOTE: Security redaction rules prevent sensitive data from appearing in logs
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie", 
    "res.headers['set-cookie']",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
