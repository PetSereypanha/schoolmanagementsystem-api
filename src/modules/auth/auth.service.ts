import { Injectable } from '@nestjs/common';
import { Sign } from 'crypto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  SignUp(signupDto: SignupDto) {
    return 'This action adds a new auth';
  }
}
