/**
 * @file        artifacts/ai-command-center/src/hooks/useSession.ts
 * @module      AI Command Center / Hooks
 * @purpose     Hook for accessing Clerk session and organization data
 *
 * @ai_instructions
 *   - Export typed session and organization data
 *   - Handle loading and error states gracefully
 *   - DO NOT expose sensitive session tokens
 *
 * @exports     useSession
 * @imports     @clerk/react
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { useAuth, useUser, useOrganization } from "@clerk/react";

interface SessionData {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    emailAddress?: string;
    imageUrl?: string;
  } | null;
  organization: {
    id: string;
    name: string;
    slug: string | null;
    imageUrl?: string;
  } | null;
  isOrganizationLoaded: boolean;
}

/**
 * Hook for accessing current session and organization data
 * @returns Session data with user and organization information
 */
export function useSession(): SessionData {
  const { isLoaded: isAuthLoaded, isSignedIn, userId } = useAuth();
  const { user: clerkUser } = useUser();
  const { 
    isLoaded: isOrgLoaded, 
    organization 
  } = useOrganization();

  const user = clerkUser ? {
    id: clerkUser.id,
    firstName: clerkUser.firstName || undefined,
    lastName: clerkUser.lastName || undefined,
    emailAddress: clerkUser.primaryEmailAddress?.emailAddress,
    imageUrl: clerkUser.imageUrl || undefined,
  } : null;

  const org = organization ? {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    imageUrl: organization.imageUrl || undefined,
  } : null;

  return {
    isLoaded: isAuthLoaded && isOrgLoaded,
    isSignedIn: Boolean(isSignedIn),
    userId: userId || null,
    user,
    organization: org,
    isOrganizationLoaded: isOrgLoaded,
  };
}
