/**
 * @file        artifacts/ai-command-center/src/pages/not-found.tsx
 * @module      Pages / Error
 * @purpose     404 not found page with helpful guidance for missing routes
 *
 * @ai_instructions
 *   - Must display a clear 404 error message
 *   - Must provide helpful guidance about router configuration
 *   - Must use consistent UI components and styling
 *   - DO NOT modify the error message without updating user guidance
 *
 * @exports     NotFound
 * @imports     @/components/ui/card, lucide-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
