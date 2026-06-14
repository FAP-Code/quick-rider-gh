import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { OAuthCallbackDto, OAuthCallbackParamsDto } from './dto/oauth-callback.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { PasswordResetConfirmDto, PasswordResetRequestDto } from './dto/password-reset.dto';
import { AuthTokenResponseDto } from './dto/auth-response.dto';

/**
 * Auth endpoints (docs/10-authentication-system.md, api/openapi.yaml `Auth` tag).
 * All routes here are marked @Public() except `logout`, matching
 * `security: []` overrides in openapi.yaml (docs/09 §5.4).
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user (email/password)' })
  @ApiResponse({ status: 201, type: AuthTokenResponseDto })
  register(@Body() dto: RegisterDto): Promise<AuthTokenResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email/password' })
  @ApiResponse({ status: 200, type: AuthTokenResponseDto })
  login(@Body() dto: LoginDto): Promise<AuthTokenResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Exchange a refresh token for a new access/refresh token pair (rotation)' })
  @ApiResponse({ status: 200, type: AuthTokenResponseDto })
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokenResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a refresh token (log out this device)' })
  @ApiResponse({ status: 204, description: 'Logged out' })
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }

  @Public()
  @Post('oauth/:provider/callback')
  @ApiOperation({ summary: 'Exchange a Google/Apple/Facebook identity token for a FaithGPT session' })
  @ApiResponse({ status: 200, type: AuthTokenResponseDto })
  oauthCallback(
    @Param() params: OAuthCallbackParamsDto,
    @Body() dto: OAuthCallbackDto,
  ): Promise<AuthTokenResponseDto> {
    return this.authService.oauthCallback(params.provider, dto);
  }

  @Public()
  @Post('verify-phone')
  @ApiOperation({ summary: 'Verify a phone number via Twilio Verify OTP, or sign in/up with PHONE_OTP' })
  @ApiResponse({ status: 200, type: AuthTokenResponseDto })
  verifyPhone(@Body() dto: VerifyPhoneDto): Promise<AuthTokenResponseDto> {
    return this.authService.verifyPhone(dto);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email via single-use token (24h expiry)' })
  @ApiResponse({ status: 200, description: 'Email verified' })
  async verifyEmail(@Query('token') token: string): Promise<{ verified: boolean }> {
    await this.authService.verifyEmail(token);
    return { verified: true };
  }

  @Public()
  @Post('password-reset/request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request a password reset email (always returns 202)' })
  @ApiResponse({ status: 202, description: 'Accepted (no account-existence leakage)' })
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto): Promise<void> {
    await this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Post('password-reset/confirm')
  @ApiOperation({ summary: 'Confirm a password reset, revoking all existing refresh tokens' })
  @ApiResponse({ status: 200, description: 'Password updated, all sessions revoked' })
  async confirmPasswordReset(@Body() dto: PasswordResetConfirmDto): Promise<{ success: boolean }> {
    await this.authService.confirmPasswordReset(dto);
    return { success: true };
  }
}
