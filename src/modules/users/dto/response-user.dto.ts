import type { User, UserGender, UserRole, UserStatus } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class ResponseUserDto implements User {
  id: string;
  name: string;
  email: string;
  emailVerified: Date;
  image: string;
  role: UserRole;
  gender: UserGender;
  isTwoFactorEnabled: boolean;
  status: UserStatus;

  @Exclude()
  password: string;
}
