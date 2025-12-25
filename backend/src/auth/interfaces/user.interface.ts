export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface UserPayload {
  sub: string; // user ID
  email: string;
  name?: string; // Optional, may not be available in JWT tokens
  picture?: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  iat?: number;
  exp?: number;
}

