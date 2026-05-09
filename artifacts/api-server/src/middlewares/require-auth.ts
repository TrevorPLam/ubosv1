/**
 * @file        artifacts/api-server/src/middlewares/require-auth.ts
 * @module      API Server / Middleware / Authentication
 * @purpose     Middleware to require valid Clerk session tokens
 *
 * @ai_instructions
 *   - Extends Clerk's middleware to reject unauthenticated requests
 *   - Returns 401 JSON response for missing/invalid authentication
 *   - Must be called after Clerk middleware but before authorization
 *   - DO NOT modify without updating all protected routes
 *
 * @exports     requireAuth middleware
 * @imports     express
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Request, Response, NextFunction } from "express";

/**
 * Extended Request interface with Clerk auth data
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string;
        organizationId: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to require authentication
 * Rejects requests without valid Clerk session tokens with 401 response
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
      statusCode: 401,
    });
    return;
  }

  next();
}
