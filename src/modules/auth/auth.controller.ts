import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterPayload } from './payloads/register.payload';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Public } from '../common/decorator/public.decorator';
import {
  ApiBadRequestResponse,
  ApiBasicAuth,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ForbiddenDto } from '../common/schema/forbidden.dto';
import { ForgotPasswordPayload } from './payloads/forgot.payload';
import RequestWithUser from '../common/interface/request_user.interface';
import { JwtAuthGuard } from '../common/guard/jwt.guard';
import { NoCache } from '../common/decorator/no-cache.decorator';
import { NewPasswordPayload } from './payloads/password.payload';
import { LoginPayload } from './payloads/login.payload';
import { GoogleOauthGuard } from '../common/guard/google-oauth.guard';
import { ProviderSocial } from '@prisma/client';
import { FacebookGuard } from '../common/guard/facebook.guard';
import { ResetPayload } from './payloads/reset.payload';
import { RefreshTokenGuard } from '../common/guard/refresh.guard';
import { ConfirmMail } from './payloads/confirm_mail.payload';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'Register a user and send mail verification' })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenDto })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @Post('/register')
  async SignUp(
    @Body() registerPayload: RegisterPayload,
    @I18n() i18n: I18nContext,
  ) {
    return await this.authService.register(registerPayload, i18n);
  }

  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ description: 'Login successful' })
  @ApiBadRequestResponse({ description: 'Unsuccessful login' })
  @Post('/login')
  async login(@Body() loginPayload: LoginPayload, @I18n() i18n: I18nContext) {
    return await this.authService.login(loginPayload, i18n);
  }

  @Public()
  @ApiOperation({ summary: 'Forgot password' })
  @ApiResponse({ description: 'Forgot password successful' })
  @ApiBadRequestResponse({ description: 'Unsuccessful forgot password' })
  @Post('/forgot-password')
  async forgotPassword(
    @Body() forgotPayload: ForgotPasswordPayload,
    @I18n() i18n: I18nContext,
  ) {
    return await this.authService.forgotPassword(forgotPayload, i18n);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @NoCache()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ description: 'Logout successful' })
  @Post('/logout')
  async logout(@Req() req: RequestWithUser) {
    return await this.authService.logout(req.user.id);
  }

  @Public()
  @Post('/reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ description: 'Password reset successful' })
  async newPassword(
    @Body() payload: NewPasswordPayload,
    @I18n() i18n: I18nContext,
  ) {
    return await this.authService.newPassword(payload, i18n);
  }

  @ApiBearerAuth()
  @UseGuards(   RefreshTokenGuard)
  @NoCache()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ description: 'Token refreshed' })
  @ApiBadRequestResponse({ description: 'Invalid refresh token' })
  @Get('/refresh-token')
  async refreshToken(@Req() req: RequestWithUser) {
    console.log(req);
    return await this.authService.refreshToken(
      req.user.id,
      req.user.refresh_token,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @NoCache()
  @ApiOkResponse({ description: 'Get current user profile' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @Get('/me')
  async me(@Req() req: RequestWithUser) {
    return req.user;
  }

  @Public()
  @NoCache()
  @Get('/reset-token/:token')
  @ApiOperation({ summary: 'Verify reset token validity' })
  @ApiResponse({ description: 'Token is valid' })
  @ApiBadRequestResponse({ description: 'Invalid or expired token' })
  async verifyResetToken(
    @Param('token') token: string,
    @I18n() i18n: I18nContext,
  ) {
    return await this.authService.verifyResetToken(token, i18n);
  }

  @Public()
  @Post('/confirm-email')
  @ApiOperation({ summary: 'Confirm email address' })
  @ApiResponse({ description: 'Email confirmed successfully' })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenDto })
  async confirmEmail(@Body() payload: ConfirmMail, @I18n() i18n: I18nContext) {
    const mail = await this.authService.decodeConfirmToken(payload.token, i18n);
    return await this.authService.createEmail(mail, i18n);
  }

  @UseGuards(GoogleOauthGuard)
  @NoCache()
  @Post('google/callback')
  async googleLogin(@Req() req) {
    return await this.authService.handleAuth(
      req,
      ProviderSocial.GOOGLE,
      'firstname',
    );
  }

  @UseGuards(FacebookGuard)
  @NoCache()
  @Post('facebook/callback')
  async facebookLogin(@Req() req) {
    return await this.authService.handleAuth(
      req,
      ProviderSocial.FACEBOOK,
      'firstname',
    );
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'User request to reset password' })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenDto })
  async resetPassword(
    @Body() payload: ResetPayload,
    @I18n() i18n: I18nContext,
  ) {
    return await this.authService.resetPassword(payload, i18n);
  }

  @Public()
  @Post('reset-email')
  @ApiOperation({ summary: 'User request to reset email' })
  @ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenDto })
  async resetEmail(@Body() payload: ResetPayload, @I18n() i18n: I18nContext) {
    return await this.authService.resetEmail(payload, i18n);
  }
}
