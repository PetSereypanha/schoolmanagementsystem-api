// auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { I18nContext } from 'nestjs-i18n';
import { RegisterPayload } from './payloads/register.payload';
import { ConflictException } from '@nestjs/common';
import { ResendService } from 'nestjs-resend';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let configService: ConfigService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        PrismaService,
        ConfigService,
        UsersService,
        JwtService,
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      const registerPayload: RegisterPayload = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };
      const i18n: I18nContext = { t: (key: string) => key } as I18nContext;

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce({ id: '1' } as any);

      await expect(service.register(registerPayload, i18n)).rejects.toThrow(ConflictException);
    });

    it('should register a new user successfully', async () => {
      const registerPayload: RegisterPayload = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
      };
      const i18n: I18nContext = { t: (key: string) => key } as I18nContext;

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce(null);
      jest.spyOn(prismaService.user, 'create').mockResolvedValueOnce({ id: '2', email: 'newuser@example.com' } as any);

      const result = await service.register(registerPayload, i18n);

      expect(result).toEqual({ id: '2', email: 'newuser@example.com' });
    });

    // Add more tests for other scenarios
  });
});