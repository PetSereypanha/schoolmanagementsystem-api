import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Sign } from 'crypto';
import { PrismaService } from '../prisma';
import { ConfigService } from '@nestjs/config';
import { I18nContext } from 'nestjs-i18n';
import { RegisterPayload } from './payloads/register.payload';
import { UsersService } from '../users';
import { UserRole, UserStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { Hash } from 'src/utils/Hash';

@Injectable()
export class AuthService {
  private readonly  logger = new Logger(AuthService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly userService:  UsersService,
    private readonly jwtService: JwtService,
  ) {}
  async registerDto(registerPayload: RegisterPayload, i18n: I18nContext,) {
    const { name, email, password } = registerPayload;
    const userExists = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })
    if (userExists) {
      throw new ConflictException(i18n.t('error.user_already_existed'));
    }
    const newUser = await this.userService.save(
      registerPayload,
      UserStatus.IN_ACTIVE,
      UserRole.STUDENT
    );

    const token = await this.getTokens(newUser.id);
    return 'This action adds a new auth';
  }

  async getTokens(userId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id: userId,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET_KEY'),
          expiresIn: Number(this.configService.get('JWT_EXPIRATION_TIME')),
        },
      ),
      this.jwtService.signAsync(
        {
          id: userId,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: Number(
            this.configService.get('JWT_REFRESH_EXPIRATION_TIME'),
          ),
        },
      ),
    ]);
    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = Hash.make(refreshToken);
    await this.userRepository.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

}
