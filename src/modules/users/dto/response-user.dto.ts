import { User, UserGender, UserRole, UserStatus } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';

@Expose()
export class ResponseUserDto implements Partial<User> {
  id: string;
  name: string;
  email: string;
  emailVerified: Date;
  image: string;
  role: UserRole;
  gender: UserGender;
  status: UserStatus;
  isTwoFactorEnabled: boolean;
  scope?: string;
  token_type?: string;
  access_token?: string;
  refresh_token?: string;
  
  @Exclude()
  password: string;

  constructor(partial: Partial<ResponseUserDto>) {
    Object.assign(this, partial);
  }
}