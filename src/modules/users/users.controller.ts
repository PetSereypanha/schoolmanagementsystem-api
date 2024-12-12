import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBody,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { NoCache } from '../common/decorator/no-cache.decorator';
import type { ResponseUserDto } from './dto/response-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    operationId: 'CreateNewUser',
    summary: 'Create a new user',
    description: 'Create a new user information',
  })
  @Post()
  @ApiBody({
    description:
      'User creation object information. At least name, email, password, role and status are required',
    type: CreateUserDto,
  })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @NoCache()
  create(@Body() createUserDto: CreateUserDto) {
    try {
      return this.usersService.create(createUserDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({
    operationId: 'GetUserById',
    summary: 'Get a user by ID',
    description: 'Retrieve user information by user ID',
  })
  @ApiParam({ name: 'id', description: 'The ID of the user to retrieve' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ResponseUserDto> {
    try {
      return await this.usersService.findOne(id);
    } catch (error) {
      if (error.status === 404) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({
    operationId: 'UpdateUserById',
    summary: 'Update a user by ID',
    description: 'Update user information by user ID',
  })
  @ApiParam({ name: 'id', description: 'The ID of the user to update' })
  @ApiBody({
    description: 'User update object information',
    type: UpdateUserDto,
  })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      return this.usersService.update(id, updateUserDto);
    } catch (error) {
      if (error.status === 404) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({
    operationId: 'DeleteUserById',
    summary: 'Delete a user by ID',
    description: 'Delete user information by user ID',
  })
  @ApiParam({ name: 'id', description: 'The ID of the user to delete' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    try {
      return this.usersService.remove(id);
    } catch (error) {
      if (error.status === 404) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }
}
