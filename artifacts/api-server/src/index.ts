/**
 * @file        artifacts/api-server/src/index.ts
 * @module      API Server / Core
 * @purpose     Server entry point with port configuration and startup logic
 *
 * @ai_instructions
 *   - PORT environment variable must be set before starting server.
 *   - Server startup must log successful binding to port.
 *   - Error handling must include graceful shutdown procedures.
 *   - DO NOT modify startup sequence without updating deployment docs.
 *
 * @imports     ./app, ./lib/logger
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

// AI-WARN: PORT environment variable is critical for server startup - failure here prevents server from running
if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

// AI-NOTE: Port validation prevents invalid port numbers that could cause runtime errors
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
