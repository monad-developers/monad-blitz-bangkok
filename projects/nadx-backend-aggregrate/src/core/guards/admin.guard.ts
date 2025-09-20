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
import { UserRole } from 'src/database/user/user.schema';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const user = (request as any).user;

    if (user.role !== UserRole.ADMIN) {
      throw new HttpException('User is not an admin', HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}
