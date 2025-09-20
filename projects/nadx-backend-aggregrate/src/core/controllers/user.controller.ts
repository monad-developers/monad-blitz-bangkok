import {
  Controller,
  Post,
  Body,
  Get,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from 'src/database/user/user.service';

interface CreateUserDto {
  email: string;
  password: string;
}

@Controller('/api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.findByEmail(createUserDto.email);
    if (user) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }
    return this.userService.createUser(createUserDto);
  }

  @Get('')
  getAll() {
    return this.userService.getAll();
  }
}
