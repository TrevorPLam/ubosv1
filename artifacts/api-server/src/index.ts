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
 * @imports     ./app, ./lib/logger, ./lib/config
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import app from "./app";
import { logger } from "./lib/logger";
import { config } from "./lib/config";
import { initializeSentry, initializeOpenLIT } from "./lib/observability";

// Initialize observability
initializeSentry();
initializeOpenLIT().catch((error) => {
  logger.error({ error }, "Failed to initialize OpenLIT");
});

const port = config.PORT;

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
