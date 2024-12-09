import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<CreateUserDto> {
    try {
      const { name, email, password, role, status } = createUserDto;
      const hashPassword = await bcrypt.hash(password, 10);

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new BadRequestException('User already exists');
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
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async findOne(id: string) {
    const user = await this.prisma.user
      .findFirstOrThrow({
        where: {
          id: String(id),
        },
      })
      .catch(() => {
        throw new NotFoundException(`User #${id} not found`);
      });
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const { name, email, role, status, phone, address, bloodType } =
        updateUserDto;

      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      console.log(existingUser);
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('User already exists');
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
    } catch (e) {
      console.log(e);
      throw new BadRequestException(e.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  remove(id: string) {
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
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }
}
