/**
 * @file        artifacts/api-server/src/lib/config.ts
 * @module      API Server / Core Configuration
 * @purpose     Centralized environment variable validation using Zod schema
 *
 * @ai_instructions
 *   - All environment variables must be validated at startup.
 *   - Use Zod for type-safe schema validation.
 *   - Fail fast on missing required variables.
 *   - DO NOT access process.env directly after this module is imported.
 *
 * @exports     config, Config type
 * @imports     zod, dotenv
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Environment variable schema with validation rules
 */
const envSchema = z.object({
  // Core application settings
  PORT: z
    .string()
    .transform((val: string) => Number(val))
    .refine((port: number) => port > 0 && port < 65536, {
      message: "PORT must be a valid port number between 1 and 65535",
    }),
  
  BASE_PATH: z
    .string()
    .min(1, "BASE_PATH cannot be empty")
    .refine((path: string) => path.startsWith("/"), {
      message: "BASE_PATH must start with '/'",
    }),

  // Database configuration
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .url("DATABASE_URL must be a valid URL"),

  // Logging configuration
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "debug"])
    .default("info"),

  // Authentication (Clerk)
  CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "CLERK_PUBLISHABLE_KEY is required")
    .startsWith("pk_", "CLERK_PUBLISHABLE_KEY must start with 'pk_'"),
  
  CLERK_SECRET_KEY: z
    .string()
    .min(1, "CLERK_SECRET_KEY is required")
    .startsWith("sk_", "CLERK_SECRET_KEY must start with 'sk_'"),

  // AI model providers
  OPENAI_API_KEY: z
    .string()
    .min(1, "OPENAI_API_KEY is required")
    .startsWith("sk-", "OPENAI_API_KEY must start with 'sk-'"),

  ANTHROPIC_API_KEY: z
    .string()
    .min(1, "ANTHROPIC_API_KEY is required")
    .startsWith("sk-ant-", "ANTHROPIC_API_KEY must start with 'sk-ant-'"),

  // File storage (S3-compatible)
  S3_ACCESS_KEY: z
    .string()
    .min(1, "S3_ACCESS_KEY is required"),
  
  S3_SECRET_KEY: z
    .string()
    .min(1, "S3_SECRET_KEY is required"),
  
  S3_BUCKET: z
    .string()
    .min(1, "S3_BUCKET is required"),
  
  S3_ENDPOINT: z
    .string()
    .url("S3_ENDPOINT must be a valid URL"),

  // Cache and queues (Redis)
  REDIS_URL: z
    .string()
    .min(1, "REDIS_URL is required")
    .url("REDIS_URL must be a valid URL"),

  // Communication services
  SENDGRID_API_KEY: z
    .string()
    .min(1, "SENDGRID_API_KEY is required")
    .startsWith("SG.", "SENDGRID_API_KEY must start with 'SG.'"),

  TWILIO_ACCOUNT_SID: z
    .string()
    .min(1, "TWILIO_ACCOUNT_SID is required")
    .startsWith("AC", "TWILIO_ACCOUNT_SID must start with 'AC'"),
  
  TWILIO_AUTH_TOKEN: z
    .string()
    .min(1, "TWILIO_AUTH_TOKEN is required"),

  // Payment processing (Stripe)
  STRIPE_SECRET_KEY: z
    .string()
    .min(1, "STRIPE_SECRET_KEY is required")
    .startsWith("sk_", "STRIPE_SECRET_KEY must start with 'sk_'"),
  
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, "STRIPE_WEBHOOK_SECRET is required")
    .startsWith("whsec_", "STRIPE_WEBHOOK_SECRET must start with 'whsec_'"),

  // Observability and monitoring
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  SENTRY_DSN: z
    .string()
    .url("SENTRY_DSN must be a valid URL")
    .optional(),

  OTEL_EXPORTER_OTLP_ENDPOINT: z
    .string()
    .url("OTEL_EXPORTER_OTLP_ENDPOINT must be a valid URL")
    .optional(),

  GRAFANA_CLOUD_API_KEY: z
    .string()
    .min(1, "GRAFANA_CLOUD_API_KEY is required")
    .optional(),
});

/**
 * Export the inferred TypeScript type for the configuration
 */
export type Config = z.infer<typeof envSchema>;

/**
 * Validate and export the configuration
 * This will throw an error if any required environment variable is missing or invalid
 */
export const config = envSchema.parse(process.env);

/**
 * Export individual configuration values for convenience
 */
export const {
  PORT,
  BASE_PATH,
  DATABASE_URL,
  LOG_LEVEL,
  CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY,
  OPENAI_API_KEY,
  ANTHROPIC_API_KEY,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_BUCKET,
  S3_ENDPOINT,
  REDIS_URL,
  SENDGRID_API_KEY,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
} = config;
