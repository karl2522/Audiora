import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT guard - allows requests with or without authentication
 * Sets request.user if token is valid, otherwise continues without user
 */
@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Try to authenticate, but don't throw if it fails
    const result = super.canActivate(context);
    if (result instanceof Promise) {
      return result.catch(() => {
        return true; // Allow request to continue without authentication
      });
    }
    return result;
  }

  handleRequest(err: any, user: any) {
    // Return user if present, otherwise return null/undefined
    return user || null;
  }
}

