/**
 * @file        artifacts/api-server/src/app.ts
 * @module      API Server / Core
 * @purpose     Express application setup with middleware and routing
 *
 * @ai_instructions
 *   - All middleware must be configured before routes.
 *   - CORS settings must allow the frontend origin.
 *   - Logging middleware must use the centralized logger.
 *   - DO NOT add middleware without updating security documentation.
 *
 * @exports     Express app instance
 * @imports     express, cors, pino-http, ./routes, ./lib/logger
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
