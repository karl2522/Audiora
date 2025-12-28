import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    console.log('🔐 JWT Guard - handleRequest');
    console.log('   Cookies:', Object.keys(request.cookies || {}));
    console.log('   Has accessToken cookie:', !!request.cookies?.accessToken);
    console.log('   Error:', err?.message);
    console.log('   Info:', info?.message);
    console.log('   User:', user ? `${user.email} (${user.sub})` : 'null');

    if (err || !user) {
      console.error('❌ JWT Guard rejected:', err?.message || info?.message || 'No user');
      throw err || new UnauthorizedException('Invalid or expired token');
    }

    console.log('✅ JWT Guard passed');
    return user;
  }
}


