import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UserRequest } from 'src/core/decorators/user.decolator';
import {
  IJWTpayload,
  LoginDto,
  RegisterDto,
  UserResponseDto,
} from 'src/core/dtos/auth.dto';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { AuthService } from 'src/core/services/auth.service';
import { UserService } from 'src/database/user/user.service';

@Controller('/api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: RegisterDto) {
    const { user, tokens } = await this.authService.registerUser(createUserDto);

    const userRes = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });

    return {
      user: userRes,
      tokens,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { user, tokens } = await this.authService.loginUser(loginDto);

    const userRes = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });

    return {
      user: userRes,
      tokens,
    };
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  async profile(@UserRequest() user: IJWTpayload) {
    const userFind = await this.userService.findById(user._id);

    const userRes = plainToInstance(UserResponseDto, userFind, {
      excludeExtraneousValues: true,
    });

    return userRes;
  }
}
