import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  data: T;
}

@Injectable()
export class ResponseTransform<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        isSuccess: true,
        statusCode: 200,
        data: data as T,
      })),
    );
  }
}

@Injectable()
export class PostStatusInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse();
    return next.handle().pipe(
      map((value) => {
        if (req.method === 'POST') {
          if (res.statusCode === HttpStatus.CREATED) {
            res.status(HttpStatus.OK);
          }
        }
        return value;
      }),
    );
  }
}
