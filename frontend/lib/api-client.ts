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
    let errorMessage = 'Request failed';
    let errorData: any = null;

    try {
      const text = await response.text();
      
      if (text) {
        try {
          errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = text || response.statusText || errorMessage;
        }
      } else {
        errorMessage = response.statusText || errorMessage;
      }
    } catch (parseError) {
      errorMessage = response.statusText || errorMessage;
    }

    const error: ApiError = {
      message: errorMessage,
      statusCode: response.status,
    };

    // Only log non-rate-limit errors to reduce console noise
    if (response.status !== 429) {
      console.error('API request failed:', {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        errorData,
      });
    }

    throw error;
  }

  // Handle responses
  const contentType = response.headers.get('content-type');
  console.log('Response content-type:', contentType);
  console.log('Response status:', response.status);
  
  // Try to parse as JSON regardless of content-type header
  // Some servers don't set content-type correctly
  try {
    const text = await response.text();
    console.log('Response text (first 500 chars):', text.substring(0, 500));
    
    if (!text || text.trim() === '') {
      console.warn('Empty response body');
      return {} as T;
    }
    
    const json = JSON.parse(text);
    console.log('Parsed JSON response:', json);
    return json as T;
  } catch (parseError) {
    console.error('Failed to parse response as JSON:', parseError);
    // If content-type says JSON but parsing failed, throw error
    if (contentType && contentType.includes('application/json')) {
      throw new Error('Invalid JSON response from server');
    }
    return {} as T;
  }
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

