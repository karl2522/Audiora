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
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/**
 * Store access token
 */
export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', token);
}

/**
 * Remove access token
 */
export function removeAccessToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
}

/**
 * Refresh access token using refresh token from httpOnly cookie
 */
async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Include httpOnly cookies
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      return data.accessToken;
    }

    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    removeAccessToken();
    return null;
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
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for refresh token
  });

  // If unauthorized, try to refresh token and retry once
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry request with new token
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          Authorization: `Bearer ${newToken}`,
        },
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

