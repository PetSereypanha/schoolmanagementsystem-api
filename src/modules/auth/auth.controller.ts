import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterPayload } from './payloads/register.payload';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  SignUp(@Body() RegisterPayload: RegisterPayload) {
    return this.authService.SignUp(RegisterPayload);
  }

}
