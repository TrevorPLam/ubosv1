/**
 * @file        artifacts/ai-command-center/src/components/AuthProvider.tsx
 * @module      AI Command Center / Components
 * @purpose     Authentication provider for Clerk token integration
 *
 * @ai_instructions
 *   - Set up token getter for API client
 *   - Handle session state changes
 *   - DO NOT expose sensitive tokens in logs
 *
 * @exports     AuthProvider
 * @imports     @clerk/react, @workspace/api-client-react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that configures Clerk token integration with API client
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Configure the API client to get Clerk tokens for authenticated requests
    setAuthTokenGetter(async () => {
      try {
        const token = await getToken();
        return token;
      } catch (error) {
        console.warn("Failed to get auth token:", error);
        return null;
      }
    });
  }, [getToken]);

  return <>{children}</>;
}
