import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import {
  IJWTpayload,
  LoginDto,
  RegisterDto,
  UserResponseDto,
} from 'src/core/dtos/auth.dto';
import { User, UserDocument } from 'src/database/user/user.schema';
import { UserService } from 'src/database/user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(dto: RegisterDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (user) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }
    const newUser = await this.userService.createUser(dto);

    const tokens = this.generateTokens(newUser);

    return {
      user: newUser,
      tokens,
    };
  }

  async loginUser(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new HttpException(
        'Email or password is incorrect',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new HttpException(
        'Email or password is incorrect',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokens = this.generateTokens(user);

    return {
      user,
      tokens,
    };
  }

  generateTokens(user: UserDocument) {
    const payload = {
      email: user.email,
      _id: user._id.toString(),
      role: user.role,
    } as IJWTpayload;

    const accessToken = this.jwtService.sign(payload, { expiresIn: '24h' });

    return {
      accessToken,
    };
  }

  verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify<IJWTpayload>(token);
      return payload;
    } catch (error) {
      throw new HttpException('Invalid Token', HttpStatus.UNAUTHORIZED);
    }
  }
}
