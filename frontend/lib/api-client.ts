/**
 * API Client for making authenticated requests to the backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiError {
  message: string;
  statusCode?: number;
}

/**
 * Get access token from storage
 * SECURITY FIX: Access token is now in httpOnly cookie, not localStorage
 * This function is kept for backward compatibility but tokens are handled server-side
 */
function getAccessToken(): string | null {
  // Access token is now in httpOnly cookie, accessible only server-side
  // Frontend doesn't need to manage it directly
  return null;
}

/**
 * Store access token
 * SECURITY FIX: No longer used - tokens are in httpOnly cookies
 * Kept for backward compatibility
 */
export function setAccessToken(token: string): void {
  // No-op: tokens are now in httpOnly cookies set by backend
}

/**
 * Remove access token
 * SECURITY FIX: Token removal is handled by backend logout endpoint
 */
export function removeAccessToken(): void {
  // No-op: tokens are cleared by backend on logout
}

/**
 * Refresh access token using refresh token from httpOnly cookie
 * SECURITY FIX: Tokens are now in httpOnly cookies, not returned in response
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Include httpOnly cookies
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    // Access token is now set in httpOnly cookie by backend
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Access token is in httpOnly cookie, automatically sent with credentials: 'include'
  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Include httpOnly cookies (accessToken and refreshToken)
  });

  // If unauthorized, try to refresh token and retry once
  if (response.status === 401) {
    const refreshSuccess = await refreshAccessToken();
    if (refreshSuccess) {
      // Retry request - new access token is in httpOnly cookie
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } else {
      // Refresh failed, redirect to login
      removeAccessToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
      throw new Error('Authentication required');
    }
  }

  if (!response.ok) {
    const error: ApiError = {
      message: 'Request failed',
      statusCode: response.status,
    };

    try {
      const errorData = await response.json();
      error.message = errorData.message || error.message;
    } catch {
      // If response is not JSON, use status text
      error.message = response.statusText || error.message;
    }

    throw error;
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return {} as T;
  }

  return response.json();
}

/**
 * Get current user profile
 */
export async function getCurrentUser() {
  return apiRequest<{
    email: string;
    name?: string;
    picture?: string;
  }>('/auth/me');
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Error logging out:', error);
  } finally {
    removeAccessToken();
  }
}

