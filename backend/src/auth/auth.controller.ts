import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ExchangeCodeDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { UserPayload } from './interfaces/user.interface';
import { UserRepository } from './repositories/user.repository';
import { AuthService } from './services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private userRepository: UserRepository,
  ) { }

  /**
   * Initiate Google OAuth flow
   * Generates state parameter for CSRF protection
   */
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // Conservative limit for auth
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport handles the redirect
  }

  /**
   * Google OAuth callback
   * Creates temporary auth code and redirects to frontend (iOS compatible)
   */
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @CurrentUser() user: UserPayload,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // Create temporary authorization code (60s expiry, single-use)
    const code = await this.authService.createAuthCode(user.sub);

    // Redirect to frontend with code (not tokens!)
    res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
  }

  /**
   * Exchange authorization code for tokens
   * Sets cookies in same-domain context (iOS compatible)
   */
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('exchange-code')
  @HttpCode(HttpStatus.OK)
  async exchangeCode(
    @Body() dto: ExchangeCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('🔑 Exchange code request received:', { code: dto.code.substring(0, 10) + '...' });

    try {
      const tokens = await this.authService.exchangeAuthCode(dto.code);
      console.log('✅ Tokens generated successfully');

      // iOS-compatible cookie policy
      // Note: httpOnly cookies don't work cross-domain on iOS Safari
      // We set them anyway for desktop browsers
      const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none' as const,
        path: '/',
      };

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Set access token in httpOnly cookie
      res.cookie('accessToken', tokens.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      console.log('🍪 Cookies set successfully');

      // ALSO return tokens in response for iOS fallback
      // Frontend can store in localStorage if cookies don't work
      return {
        success: true,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      };
    } catch (error) {
      console.error('❌ Exchange code failed:', error.message);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token from cookie
   */
  @Public()
  @Throttle({ refresh: { limit: 100, ttl: 60000 } }) // Higher limit for token refresh
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: { refreshToken?: string },
  ) {
    const refreshToken = req.cookies?.refreshToken || body?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const tokens = await this.authService.refreshAccessToken(refreshToken);

    // iOS-compatible cookie policy
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      path: '/',
    };

    // Update refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Update access token cookie
    res.cookie('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return {
      success: true,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }
    };
  }

  /**
   * Get current user profile
   * Skip global throttling - this endpoint is called frequently for auth checks
   */
  @Get('me')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @CurrentUser() user: UserPayload,
    @Req() req: Request,
  ) {
    console.log('👤 /auth/me called');
    console.log('   Cookies received:', Object.keys(req.cookies || {}));
    console.log('   Has accessToken:', !!req.cookies?.accessToken);
    console.log('   User from JWT:', user.email);

    // Fetch fresh user data from database
    const dbUser = await this.userRepository.findById(user.sub);

    if (!dbUser) {
      console.error('❌ User not found in database:', user.sub);
      throw new UnauthorizedException('User not found');
    }

    console.log('✅ User profile returned:', dbUser.email);
    return {
      email: dbUser.email,
      name: dbUser.name || undefined,
      picture: dbUser.picture || undefined,
    };
  }

  /**
   * Get access token from httpOnly cookie (for frontend)
   * SECURITY: Token is no longer exposed in URL
   */
  @Public()
  @Get('token')
  @SkipThrottle()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async getAccessToken(@Req() req: Request) {
    // If refresh token is valid, return success
    // Frontend can use the accessToken cookie directly
    return { success: true };
  }

  /**
   * Logout - clears refresh token cookie
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Consistent cookie policy for all environments (must match set cookies)
    const cookieOptions = {
      httpOnly: true,
      secure: true,  // Always true for iOS Safari compatibility
      sameSite: 'none' as const,  // Always 'none' to eliminate environment drift
      path: '/',
    };

    // Clear refresh token cookie
    res.clearCookie('refreshToken', cookieOptions);

    // Clear access token cookie
    res.clearCookie('accessToken', cookieOptions);

    return { message: 'Logged out successfully' };
  }
}

