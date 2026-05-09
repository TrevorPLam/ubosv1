/**
 * @file        artifacts/api-server/src/middlewares/clerk-auth.ts
 * @module      API Server / Middleware / Authentication
 * @purpose     Clerk authentication middleware with tenant context extraction
 *
 * @ai_instructions
 *   - Validates Clerk session tokens and extracts user/organization info
 *   - Integrates with existing tenant context middleware
 *   - Must be called before tenant context middleware
 *   - DO NOT modify without updating authorization flows
 *
 * @exports     clerkAuthMiddleware
 * @imports     @clerk/express, express
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Request, Response, NextFunction } from "express";
import { clerkMiddleware, getAuth } from "@clerk/express";

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
 * Clerk authentication middleware that extracts user and organization info
 * and prepares it for tenant context extraction
 */
export function clerkAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // First run Clerk's built-in middleware
  clerkMiddleware()(req, res, (err?: any) => {
    if (err) {
      return next(err);
    }

    try {
      // Get auth data from Clerk
      const auth = getAuth(req);

      if (!auth.userId) {
        // No authenticated user - continue without auth context
        return next();
      }

      // Extract organization (tenant) information
      const orgId = auth.orgId || null;
      const orgRole = auth.orgRole || "member";

      if (!orgId) {
        console.warn("User authenticated but no organization context", {
          userId: auth.userId,
        });
        
        // For B2B organizations, we require organization context
        // You might want to redirect to organization selection or create one
        res.status(403).json({
          error: "Forbidden",
          message: "Organization context required for B2B access",
        });
        return;
      }

      // Attach user and tenant info to request
      req.user = {
        id: auth.userId,
        tenantId: orgId, // In B2B, orgId serves as tenantId
        organizationId: orgId,
        role: orgRole,
      };

      console.debug("Clerk auth successful", {
        userId: auth.userId,
        organizationId: orgId,
        role: orgRole,
      });

      next();
    } catch (error) {
      console.error("Error in Clerk auth middleware", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Authentication processing failed",
      });
      return;
    }
  });
}

/**
 * Middleware to require authentication
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
    });
    return;
  }
  next();
}

/**
 * Middleware to require specific organization role
 */
export function requireRole(requiredRole: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
      return;
    }

    if (req.user.role !== requiredRole && req.user.role !== "admin") {
      res.status(403).json({
        error: "Forbidden",
        message: `Requires ${requiredRole} role or higher`,
      });
      return;
    }

    next();
  };
}
