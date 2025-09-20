import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { AuthService } from 'src/core/services/auth.service';
import { UserService } from 'src/database/user/user.service';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const token = request?.headers?.authorization?.split(
      'Bearer ',
    )[1] as string;

    // console.log({ token });

    if (!token) {
      throw new HttpException('Invalid Token', HttpStatus.UNAUTHORIZED);
    }

    const payload = this.authService.verifyToken(token);

    const user = await this.userService.findById(payload._id);

    if (!user) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    (request as any).user = user;

    return true;
  }
}
