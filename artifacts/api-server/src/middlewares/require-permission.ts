/**
 * @file        artifacts/api-server/src/middlewares/require-permission.ts
 * @module      API Server / Middleware / Authorization
 * @purpose     Middleware to enforce role-based access control
 *
 * @ai_instructions
 *   - Checks user's organization role against required permission set
 *   - Returns 403 JSON response for insufficient permissions
 *   - Uses higher-order middleware factory pattern for reusability
 *   - DO NOT modify without updating permission model
 *
 * @exports     requirePermission middleware factory
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
 * All available permissions in the system
 */
type AllPermissions = 
  | "users:read"
  | "users:write"
  | "agents:read"
  | "agents:write"
  | "approvals:read"
  | "approvals:write"
  | "chat:read"
  | "chat:write"
  | "work:read"
  | "work:write"
  | "crm:read"
  | "crm:write"
  | "finance:read"
  | "finance:write"
  | "calendar:read"
  | "calendar:write"
  | "marketing:read"
  | "marketing:write"
  | "team:read"
  | "team:write"
  | "knowledge:read"
  | "knowledge:write"
  | "vendors:read"
  | "vendors:write"
  | "assets:read"
  | "assets:write";

/**
 * Permission sets mapped to organization roles
 * This can be extended to support more granular permissions
 */
const ROLE_PERMISSIONS = {
  admin: [
    "users:read",
    "users:write",
    "agents:read",
    "agents:write",
    "approvals:read",
    "approvals:write",
    "chat:read",
    "chat:write",
    "work:read",
    "work:write",
    "crm:read",
    "crm:write",
    "finance:read",
    "finance:write",
    "calendar:read",
    "calendar:write",
    "marketing:read",
    "marketing:write",
    "team:read",
    "team:write",
    "knowledge:read",
    "knowledge:write",
    "vendors:read",
    "vendors:write",
    "assets:read",
    "assets:write",
  ] as const,
  member: [
    "agents:read",
    "agents:write",
    "approvals:read",
    "approvals:write",
    "chat:read",
    "chat:write",
    "work:read",
    "work:write",
    "crm:read",
    "crm:write",
    "finance:read",
    "calendar:read",
    "calendar:write",
    "knowledge:read",
    "knowledge:write",
    "assets:read",
  ] as const,
  viewer: [
    "agents:read",
    "approvals:read",
    "chat:read",
    "work:read",
    "crm:read",
    "finance:read",
    "calendar:read",
    "knowledge:read",
    "assets:read",
  ] as const,
} as const;

type Role = keyof typeof ROLE_PERMISSIONS;
type Permission = AllPermissions;

/**
 * Check if a role has a specific permission
 */
function hasPermission(role: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role as Role];
  return rolePermissions?.includes(permission as any) || false;
}

/**
 * Higher-order middleware factory for permission-based authorization
 * 
 * @param permissions - Array of required permissions (user needs at least one)
 * @returns Middleware function that checks permissions
 */
export function requirePermission(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
        statusCode: 401,
      });
      return;
    }

    const { role } = req.user;

    // Check if user has any of the required permissions
    const hasRequiredPermission = permissions.some(permission =>
      hasPermission(role, permission)
    );

    if (!hasRequiredPermission) {
      res.status(403).json({
        error: "Forbidden",
        message: `Insufficient permissions. Required: ${permissions.join(" or ")}`,
        statusCode: 403,
        details: {
          required: permissions,
          userRole: role,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Convenience middleware for single permission check
 */
export function requireSinglePermission(permission: Permission) {
  return requirePermission([permission]);
}

/**
 * Middleware for admin-only access
 */
export function requireAdmin(
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

  if (req.user.role !== "admin") {
    res.status(403).json({
      error: "Forbidden",
      message: "Admin access required",
      statusCode: 403,
      details: {
        required: "admin",
        userRole: req.user.role,
      },
    });
    return;
  }

  next();
}
