import { IsEmail, IsOptional, IsString } from 'class-validator';

export class GoogleCallbackDto {
  @IsString()
  code: string;

  @IsString()
  state: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class AuthResponseDto {
  @IsString()
  accessToken: string;

  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  picture?: string;
}

export class ExchangeCodeDto {
  @IsString()
  code: string;
}

