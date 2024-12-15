import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma';
import { UserRole, UserStatus } from '@prisma/client';
import { ResponseUserDto } from './dto/response-user.dto';
import { plainToInstance } from 'class-transformer';
import { Hash } from 'src/utils/Hash';
import { RegisterPayload } from '../auth/payloads/register.payload';
import { I18nContext } from 'nestjs-i18n';
import type { ResetPayload } from '../auth/payloads/reset.payload';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly prisma: PrismaService) {}

  async save(
    userPayLoad: RegisterPayload, 
    status: UserStatus = UserStatus.ACTIVE, 
    role: UserRole = UserRole.STUDENT) {
    const newUser = await this.prisma.user.create({
      data: {
        ...userPayLoad,
        role,
        status,
      },
    });
    return newUser;
  }

  async updateUserPassword(userId: string, password: string) {
    const hashPassword = await Hash.make(password);
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashPassword,
      },
    }).then(() => {
      this.logger.log(`User password updated successfully: ${user.email}`);
    });
  }

  async create(createUserDto: CreateUserDto, i18n: I18nContext) {
    const { name, email, password, role, status } = createUserDto;
    const hashPassword = await Hash.make(password);

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException(i18n.t('error.user_not_exist'));
    }
    const newUser = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashPassword,
        role,
        status,
      },
    });

    if (newUser.role === UserRole.TEACHER) {
      await this.prisma.teachers.create({
        data: {
          name,
          userId: newUser.id,
        },
      });
    }
    if (newUser.role === UserRole.STUDENT) {
      await this.prisma.students.create({
        data: {
          name,
          userId: newUser.id,
        },
      });
    }
    if (newUser.role === UserRole.PARENT) {
      await this.prisma.parents.create({
        data: {
          name,
          userId: newUser.id,
        },
      });
    }
    return newUser;
  }

  async findOne(id: string): Promise<ResponseUserDto> {
    const user = await this.prisma.user.findUnique({
        where: {
          id: String(id),
        },
      });
    if(!user) {
      this.logger.error(`User lookup failed: ID ${id} not found`);
      throw new NotFoundException(`User with ID ${id} not found`);
    };
    return plainToInstance(ResponseUserDto, user);
  }

  async findEmail(email: string, i18n: I18nContext) {
    const user = await this.prisma.user.findUnique({
        where: {
          email
        },
      });
    if(!user) {
      this.logger.error(`User lookup failed ${email} not found`);
      throw new NotFoundException(i18n.t('error.user_not_found', {
        args: { email }
      }));
    };
    return user;
  }

  async getIntegrationById(userId: string) {
    try {
      return await this.prisma.account.findMany({
        where: {
          userId: userId,
        },
        select: {
          id: true,
          provider: true,
          providerAccountId: true,
          byUser: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(`Failed to get integrations for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto, i18n: I18nContext) {
    const { name, email, role, status, phone, address, bloodType } =
      updateUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    console.log(existingUser);
    if (existingUser && existingUser.id !== id) {
      throw new BadRequestException(i18n.t('error.user_not_exist'));
    }
    const updatedUser = await this.prisma.user.update({
      where: { id: String(id) },
      data: {
        name,
        email,
        role,
        status,
        teacher: {
          updateMany: {
            where: { userId: String(id) },
            data: {
              name,
              phone,
              address,
              bloodType,
            },
          },
        },
        student: {
          updateMany: {
            where: { userId: String(id) },
            data: {
              name,
              phone,
              address,
              bloodType,
            },
          },
        },
        parent: {
          updateMany: {
            where: { userId: String(id) },
            data: {
              name,
              phone,
              address,
            },
          },
        },
      },
      include: {
        teacher: true,
        student: true,
        parent: true,
      },
    });

    if (role === UserRole.TEACHER) {
      await this.prisma.teachers.create({
        data: {
          name: name,
          phone: phone,
          address: address,
          bloodType: bloodType,
          userId: updatedUser.id,
        },
      });

      updatedUser.role === UserRole.STUDENT
        ? await this.prisma.students.deleteMany({
            where: { userId: updatedUser.id },
          })
        : await this.prisma.parents.deleteMany({
            where: { userId: updatedUser.id },
          });
    } else if (role === UserRole.STUDENT) {
      await this.prisma.students.create({
        data: {
          name: name,
          phone: phone,
          address: address,
          bloodType: bloodType,
          userId: updatedUser.id,
        },
      });

      updatedUser.role === UserRole.TEACHER
        ? await this.prisma.teachers.deleteMany({
            where: { userId: updatedUser.id },
          })
        : await this.prisma.parents.deleteMany({
            where: { userId: updatedUser.id },
          });
    } else if (role === UserRole.PARENT) {
      await this.prisma.parents.create({
        data: {
          name: name,
          phone: phone,
          address: address,
          userId: updatedUser.id,
        },
      });

      updatedUser.role === UserRole.STUDENT
        ? await this.prisma.students.deleteMany({
            where: { userId: updatedUser.id },
          })
        : await this.prisma.teachers.deleteMany({
            where: { userId: updatedUser.id },
          });
    }
    return updatedUser;
  }

  remove(id: string, i18n: I18nContext) {
    const user = this.prisma.user.update({
      where: { id: String(id) },
      data: {
        teacher: {
          updateMany: {
            where: { userId: id },
            data: { deletedAt: new Date() },
          },
        },
        student: {
          updateMany: {
            where: { userId: id },
            data: { deletedAt: new Date() },
          },
        },
        parent: {
          updateMany: {
            where: { userId: id },
            data: { deletedAt: new Date() },
          },
        },
      },
      include: {
        teacher: true,
        student: true,
        parent: true,
      },
    });
    if (!user) {
      throw new NotFoundException(i18n.t('error.user_not_found', {
        args: { id }
      }));
    }
    return user;
  }
}
