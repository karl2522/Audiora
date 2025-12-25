import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { TokenPayload, UserPayload } from '../interfaces/user.interface';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private refreshTokenRepository: RefreshTokenRepository,
  ) {
    const secret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Extract refresh token from httpOnly cookie
          return request?.cookies?.refreshToken;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(
    request: Request,
    payload: TokenPayload,
  ): Promise<UserPayload | null> {
    const refreshToken = request?.cookies?.refreshToken;

    if (!refreshToken) {
      return null;
    }

    // Verify refresh token exists and is valid in database
    const tokenRecord = await this.refreshTokenRepository.findByToken(refreshToken);
    
    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    // Check if token is expired or revoked
    const isExpired = new Date() > tokenRecord.expiresAt;
    const isRevoked = tokenRecord.revokedAt !== null;

    if (isExpired || isRevoked) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  }
}

