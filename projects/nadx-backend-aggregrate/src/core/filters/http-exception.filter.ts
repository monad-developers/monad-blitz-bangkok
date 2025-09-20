import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { MongooseError } from 'mongoose';
import { ValidationException } from 'src/core/exceptions/validation.exception';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status = exception ? exception.getStatus() : 500;

    console.log(exception.getResponse());

    response.status(status).json({
      isSuccess: status == 200,
      statusCode: status,
      message: exception.getResponse(),
    });
  }
}

@Catch(MongooseError)
export class MongooseExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    // const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    console.log(exception);

    response.status(500).json({
      isSuccess: false,
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    return response.status(404).json({
      isSuccess: false,
      statusCode: 404,
      message: 'Not found',
    });
  }
}

@Catch(ValidationException)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: ValidationException, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    return response.status(400).json({
      isSuccess: false,
      statusCode: 400,
      validationErrors: exception.validationErrors,
    });
  }
}

@Catch(ThrottlerException)
export class ThrottlerFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    return response.status(429).json({
      isSuccess: false,
      statusCode: 429,
      message: 'Too many requests, please try again later',
    });
  }
}
