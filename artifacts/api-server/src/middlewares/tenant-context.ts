/**
 * @file        artifacts/api-server/src/middlewares/tenant-context.ts
 * @module      API Server / Middleware / Tenant Context
 * @purpose     Middleware to extract tenant context from JWT and set PostgreSQL session variable
 *
 * @ai_instructions
 *   - This middleware extracts tenant_id from the authenticated user's JWT token.
 *   - Sets the PostgreSQL session variable 'app.current_tenant' for RLS policies.
 *   - Must be called after authentication middleware but before authorization.
 *   - DO NOT modify this middleware without updating all RLS-dependent code.
 *
 * @exports     tenant context middleware
 * @imports     express, @workspace/db
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Request, Response, NextFunction } from "express";
import { setTenantContext, clearTenantContext } from "@workspace/db";

/**
 * Extended Request interface with tenant context
 */
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
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
 * Tenant context middleware
 * Extracts tenant information from the authenticated user and sets
 * the PostgreSQL session variable for Row-Level Security policies
 */
export function tenantContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Ensure this middleware runs after authentication
  if (!req.user) {
    console.warn("Tenant context middleware called before authentication");
    return next();
  }

  const { tenantId } = req.user!;

  if (!tenantId) {
    console.error("Authenticated user missing tenant_id", {
      userId: req.user!.id,
      organizationId: req.user!.organizationId,
    });
    
    // Clear any existing tenant context to prevent data leakage
    clearTenantContext().catch((error) => {
      console.error("Failed to clear tenant context", error);
    });
    
    return next();
  }

  // Set tenant context for this request
  setTenantContext(tenantId)
    .then(() => {
      // Attach tenant ID to request for downstream middleware and routes
      req.tenantId = tenantId;
      
      console.debug("Tenant context set", { tenantId, userId: req.user!.id });
      next();
    })
    .catch((error) => {
      console.error("Failed to set tenant context", { tenantId, error });
      
      // If we can't set tenant context, we should fail the request
      // to prevent potential data leakage
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to establish tenant context",
      });
    });
}

/**
 * Middleware to clear tenant context after request processing
 * This should be used as error handling cleanup
 */
export function clearTenantContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Clear tenant context regardless of request outcome
  clearTenantContext()
    .then(() => {
      console.debug("Tenant context cleared", { tenantId: req.tenantId });
      next();
    })
    .catch((error) => {
      console.error("Failed to clear tenant context", error);
      next();
    });
}

/**
 * Higher-order middleware that ensures tenant context is properly managed
 * throughout the request lifecycle
 */
export function withTenantContext(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Set tenant context at the start
  tenantContextMiddleware(req, res, (err?: any) => {
    if (err) {
      return next(err);
    }

    // Ensure cleanup happens after response
    const originalEnd = res.end;
    res.end = function(this: Response, ...args: any[]) {
      clearTenantContext().catch((error) => {
        console.error("Failed to clear tenant context on response end", error);
      });
      return originalEnd.apply(this, args);
    } as any;

    next();
  });
}

/**
 * Middleware to validate tenant context is set
 * Use this for routes that require tenant isolation
 */
export function requireTenantContext(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.tenantId) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Tenant context not established",
    });
    return;
  }

  next();
}
