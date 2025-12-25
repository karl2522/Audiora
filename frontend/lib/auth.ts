/**
 * Auth utilities and helpers
 */

/**
 * Check if user is authenticated
 * SECURITY FIX: No longer checks localStorage - authentication is determined
 * by the presence of valid httpOnly cookies and successful API calls
 * This function is kept for backward compatibility but should not be relied upon
 */
export function isAuthenticated(): boolean {
  // Authentication is now determined by httpOnly cookies and API responses
  // This function cannot reliably check authentication without making an API call
  // The AuthContext handles authentication state properly
  return false; // Always return false - let AuthContext handle auth state
}

/**
 * Get OAuth URL for Google sign-in
 */
export function getGoogleOAuthUrl(): string {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  return `${API_URL}/auth/google`;
}

