/**
 * Auth utilities and helpers
 */

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}

/**
 * Get OAuth URL for Google sign-in
 */
export function getGoogleOAuthUrl(): string {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  return `${API_URL}/auth/google`;
}

