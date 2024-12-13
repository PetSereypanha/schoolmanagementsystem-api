import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterPayload } from './payloads/register.payload';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Public } from '../common/decorator/public.decorator';
import { ApiBadRequestResponse, ApiForbiddenResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ForbiddenDto } from '../common/schema/forbidden.dto';
import { LoginPayload } from './payloads/login.payload';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/register')
  @ApiOperation({ summary: 'Register a user and send mail verification' })
  @ApiForbiddenResponse({
    description: 'Forbidden',
    type: ForbiddenDto,
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'User already exists' 
  })
  async SignUp(@Body() registerPayload: RegisterPayload,@I18n() i18n: I18nContext){
    return await this.authService.register(registerPayload, i18n);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful' 
  })
  @ApiBadRequestResponse({description: 'Unsuccessful login'})
  async login(@Body() LoginPayload: LoginPayload,@I18n() i18n: I18nContext) {
    return await this.authService.login(LoginPayload, i18n);
  }
}

