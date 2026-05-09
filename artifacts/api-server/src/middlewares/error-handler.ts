/**
 * @file        artifacts/api-server/src/middlewares/error-handler.ts
 * @module      API Server / Middleware / Error Handling
 * @purpose     Global error handler for consistent JSON error responses
 *
 * @ai_instructions
 *   - Catches all unhandled exceptions and returns consistent JSON format
 *   - Logs errors appropriately for debugging and monitoring
 *   - Distinguishes between client and server errors
 *   - DO NOT modify without updating error response contracts
 *
 * @exports     globalErrorHandler middleware
 * @imports     express
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

/**
 * Standard error response format
 */
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: unknown,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // Ensure the stack trace is properly captured
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Predefined error types for common scenarios
 */
export const ErrorTypes = {
  /**
   * Validation error (422)
   */
  ValidationError: (message: string, details?: unknown) =>
    new AppError(message, 422, details),

  /**
   * Not found error (404)
   */
  NotFound: (resource: string = "Resource") =>
    new AppError(`${resource} not found`, 404),

  /**
   * Unauthorized error (401)
   */
  Unauthorized: (message: string = "Authentication required") =>
    new AppError(message, 401),

  /**
   * Forbidden error (403)
   */
  Forbidden: (message: string = "Insufficient permissions") =>
    new AppError(message, 403),

  /**
   * Conflict error (409)
   */
  Conflict: (message: string, details?: unknown) =>
    new AppError(message, 409, details),

  /**
   * Internal server error (500)
   */
  InternalError: (message: string = "Internal server error", details?: unknown) =>
    new AppError(message, 500, details, false),

  /**
   * Service unavailable error (503)
   */
  ServiceUnavailable: (message: string = "Service temporarily unavailable") =>
    new AppError(message, 503),
} as const;

/**
 * Global error handler middleware
 * Catches all unhandled errors and returns consistent JSON responses
 */
export function globalErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Default error information
  let statusCode = 500;
  let message = "Internal server error";
  let details: unknown = undefined;

  // Handle known application errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  }
  // Handle validation errors (from Zod)
  else if (error.name === "ZodError") {
    statusCode = 422;
    message = "Validation failed";
    details = {
      errors: (error as any).errors?.map((err: any) => ({
        field: err.path?.join("."),
        message: err.message,
        code: err.code,
      })),
    };
  }
  // Handle database errors
  else if (error.name === "PostgresError") {
    statusCode = 500;
    message = "Database operation failed";
    details = process.env.NODE_ENV === "development" ? error.message : undefined;
  }
  // Handle JWT errors
  else if (error.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }
  else if (error.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired";
  }
  // Handle syntax errors (invalid JSON)
  else if (error instanceof SyntaxError && "body" in error) {
    statusCode = 400;
    message = "Invalid JSON in request body";
  }
  // Handle unknown errors in development
  else if (process.env.NODE_ENV === "development") {
    statusCode = 500;
    message = error.message || "Internal server error";
    details = {
      stack: error.stack,
      name: error.name,
    };
  }

  // Log the error
  const logLevel = statusCode >= 500 ? "error" : "warn";
  logger[logLevel]({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      user: req.user,
    },
    statusCode,
  });

  // Build error response
  const errorResponse: ErrorResponse = {
    error: getErrorType(statusCode),
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    requestId: req.id ? String(req.id) : undefined,
  };

  // Include details only if they exist and not in production for security
  if (details && (process.env.NODE_ENV === "development" || statusCode < 500)) {
    errorResponse.details = details;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Get human-readable error type from status code
 */
function getErrorType(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "Bad Request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not Found";
    case 409:
      return "Conflict";
    case 422:
      return "Validation Error";
    case 429:
      return "Too Many Requests";
    case 500:
      return "Internal Server Error";
    case 502:
      return "Bad Gateway";
    case 503:
      return "Service Unavailable";
    case 504:
      return "Gateway Timeout";
    default:
      return "Error";
  }
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to the global error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
