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
// Flag to prevent token refresh during logout
let isLoggingOut = false;

/**
 * Refresh access token using refresh token from httpOnly cookie
 * SECURITY FIX: Tokens are now in httpOnly cookies, not returned in response
 */
async function refreshAccessToken(): Promise<boolean> {
  // Don't attempt refresh if we're in the process of logging out
  if (isLoggingOut) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for refresh

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Include httpOnly cookies
        signal: controller.signal,
      });

      if (!response.ok) {
        // Don't log errors for 401 - it's expected when logged out
        if (response.status !== 401) {
          console.error('Error refreshing token:', response.statusText);
        }
        return false;
      }

      // Access token is now set in httpOnly cookie by backend
      return true;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // Don't log network errors - might be offline or logged out
    return false;
  }
}

// Circuit breaker for rate limiting
let isRateLimited = false;
let rateLimitResetTime = 0;

/**
 * Make an authenticated API request
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit & { timeout?: number } = {},
  skipRefresh = false, // Option to skip token refresh (e.g., for logout)
): Promise<T> {
  // Check circuit breaker
  if (isRateLimited) {
    if (Date.now() < rateLimitResetTime) {
      console.warn('🚫 Circuit breaker open: blocking request due to rate limit');
      const error: ApiError = {
        message: 'Too many requests. Please try again later.',
        statusCode: 429,
      };
      throw error;
    } else {
      // Reset circuit breaker after timeout
      isRateLimited = false;
      rateLimitResetTime = 0;
    }
  }

  const token = getAccessToken();
  const { timeout = 10000, ...fetchOptions } = options; // Default 10s timeout

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Helper for fetch with timeout
  const doFetch = async (url: string, opts: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { ...opts, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Access token is in httpOnly cookie, automatically sent with credentials: 'include'
  let response = await doFetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Include httpOnly cookies (accessToken and refreshToken)
  });

  // If unauthorized, try to refresh token and retry once (unless skipRefresh is true)
  // Skip refresh for logout endpoint - tokens are being cleared, so refresh will fail
  if (response.status === 401 && !skipRefresh) {
    const refreshSuccess = await refreshAccessToken();
    if (refreshSuccess) {
      // Retry request - new access token is in httpOnly cookie
      response = await doFetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: 'include',
      });
    } else {
      // Refresh failed - user is logged out or token expired
      // Don't redirect automatically - let the auth context handle it
      // Only throw error, don't redirect (prevents redirect loops)
      const error: ApiError = {
        message: 'Authentication required',
        statusCode: 401,
      };
      throw error;
    }
  }

  if (!response.ok) {
    // Handle 429 specifically to trigger circuit breaker
    if (response.status === 429) {
      isRateLimited = true;
      rateLimitResetTime = Date.now() + 60000; // 1 minute cooldown
      console.warn('⚠️ Server returned 429: Circuit breaker activated for 60s');
    }

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
export async function getCurrentUser(options?: RequestInit & { timeout?: number }) {
  return apiRequest<{
    email: string;
    name?: string;
    picture?: string;
  }>('/auth/me', options);
}

/**
 * Logout user
 * Skip token refresh since we're clearing tokens anyway
 */
export async function logout(): Promise<void> {
  // Set flag to prevent auto-refresh during logout
  isLoggingOut = true;

  try {
    // Skip refresh attempt - tokens are being cleared, so refresh would fail with 401
    await apiRequest('/auth/logout', { method: 'POST' }, true);
  } catch (error: any) {
    // Silently handle logout errors - 401 is expected if tokens are already cleared
    // Don't log expected errors to avoid console noise
    if (error?.statusCode !== 401) {
      console.error('Error logging out:', error);
    }
  } finally {
    removeAccessToken();
    // Reset flag after a short delay to ensure pending requests have failed/cancelled
    setTimeout(() => {
      isLoggingOut = false;
    }, 1000);
  }
}

