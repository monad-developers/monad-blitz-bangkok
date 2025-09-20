import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from 'src/database/user/user.schema';

export class RegisterDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}

export class UserResponseDto {
  @Expose()
  email: string;

  @Expose()
  isEnabled: boolean;

  @Expose()
  isEmailVerified: boolean;

  @Expose()
  role: UserRole;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  remainingTokens: number;

  @Expose()
  tokensUsed: number;
}

export interface IJWTpayload {
  email: string;
  role: UserRole;
  _id: string;
}

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
