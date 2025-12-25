import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './services/auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import type { UserPayload } from './interfaces/user.interface';
import { RefreshTokenDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from './repositories/user.repository';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private userRepository: UserRepository,
  ) {}

  /**
   * Initiate Google OAuth flow
   * Generates state parameter for CSRF protection
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 attempts per 15 minutes
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
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
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
  @Throttle({ refresh: { limit: 10, ttl: 60000 } }) // 10 refresh requests per minute
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
   */
  @Get('me')
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

