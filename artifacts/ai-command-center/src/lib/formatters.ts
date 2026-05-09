/**
 * @file        artifacts/ai-command-center/src/lib/formatters.ts
 * @module      Utilities / Formatting
 * @purpose     Utility functions for formatting currencies, numbers, bytes, and dates
 *
 * @ai_instructions
 *   - Must use Intl.NumberFormat for currency and number formatting
 *   - Must use proper byte size calculations with 1024 base
 *   - Must use Intl.DateTimeFormat for consistent date formatting
 *   - DO NOT change locale settings without internationalization review
 *
 * @exports     formatCurrency, formatNumber, formatBytes, formatDate
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};
