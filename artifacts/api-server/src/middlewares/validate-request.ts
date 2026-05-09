/**
 * @file        artifacts/api-server/src/middlewares/validate-request.ts
 * @module      API Server / Middleware / Validation
 * @purpose     Middleware to validate request data using Zod schemas
 *
 * @ai_instructions
 *   - Validates req.body, req.query, or req.params against Zod schema
 *   - Returns 422 with structured errors on validation failure
 *   - Uses 2026 best practices for validation middleware
 *   - DO NOT modify without updating validation patterns
 *
 * @exports     validateRequest middleware factory
 * @imports     express, zod
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Request, Response, NextFunction } from "express";
import { z, AnyZodObject, ZodError } from "zod";

/**
 * Validation schema interface
 */
interface ValidationSchema {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}

/**
 * Validation error details
 */
interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Middleware factory for request validation
 * 
 * @param schema - Zod schema object with optional body, query, and params schemas
 * @returns Middleware function that validates the request
 */
export function validateRequest(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate each part separately
      if (schema.body) {
        const validatedBody = schema.body.parse(req.body);
        req.body = validatedBody;
      }

      if (schema.query) {
        const validatedQuery = schema.query.parse(req.query);
        req.query = validatedQuery as any; // Type assertion for Express compatibility
      }

      if (schema.params) {
        const validatedParams = schema.params.parse(req.params);
        req.params = validatedParams as any; // Type assertion for Express compatibility
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors for API response
        const formattedErrors: ValidationError[] = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        res.status(422).json({
          error: "Validation failed",
          message: "Request data does not match expected format",
          statusCode: 422,
          details: {
            errors: formattedErrors,
          },
        });
        return;
      }

      // For non-Zod errors, pass to next middleware
      next(error);
    }
  };
}

/**
 * Convenience middleware for body-only validation
 */
export function validateBody<T extends z.ZodSchema>(bodySchema: T) {
  return validateRequest({ body: bodySchema });
}

/**
 * Convenience middleware for query-only validation
 */
export function validateQuery<T extends z.ZodSchema>(querySchema: T) {
  return validateRequest({ query: querySchema });
}

/**
 * Convenience middleware for params-only validation
 */
export function validateParams<T extends z.ZodSchema>(paramsSchema: T) {
  return validateRequest({ params: paramsSchema });
}

/**
 * Common validation schemas that can be reused across routes
 */
export const commonSchemas = {
  /**
   * UUID parameter validation
   */
  uuidParam: z.object({
    id: z.string().uuid("Invalid ID format"),
  }),

  /**
   * Pagination query validation
   */
  paginationQuery: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    order: z.enum(["asc", "desc"]).default("desc"),
  }),

  /**
   * Search query validation
   */
  searchQuery: z.object({
    q: z.string().min(1).max(100),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),

  /**
   * Date range query validation
   */
  dateRangeQuery: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
};
