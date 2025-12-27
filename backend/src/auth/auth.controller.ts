import {
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
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // Increased limit
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport handles the redirect
  }

  /**
   * Google OAuth callback
   * Validates state parameter and exchanges code for tokens
   */
  @Public()
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // Increased limit
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @CurrentUser() user: UserPayload,
    @Res() res: Response,
  ) {
    const tokens = await this.authService.login(user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Set access token in httpOnly cookie (SECURITY FIX: No longer in URL)
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes (matches access token expiry)
      path: '/',
    });

    // Redirect to frontend without token in URL
    res.redirect(`${frontendUrl}/auth/callback?success=true`);
  }

  /**
   * Refresh access token using refresh token from cookie
   */
  @Public()
  @Throttle({ refresh: { limit: 50, ttl: 60000 } }) // Increased limit
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const tokens = await this.authService.refreshAccessToken(refreshToken);
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    // Update refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Set access token in httpOnly cookie
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    return {
      success: true,
    };
  }

  /**
   * Get current user profile
   * Skip global throttling - this endpoint is called frequently for auth checks
   */
  @Get('me')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: UserPayload) {
    // Fetch fresh user data from database
    const dbUser = await this.userRepository.findById(user.sub);

    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

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

    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
    });

    // Clear access token cookie
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
    });

    return { message: 'Logged out successfully' };
  }
}

