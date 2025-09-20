import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as morgan from 'morgan';
import {
  HttpException,
  HttpStatus,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ValidationException } from 'src/core/exceptions/validation.exception';
import {
  PostStatusInterceptor,
  ResponseTransform,
} from 'src/core/interceptors/response-transform.interceptor';
import {
  HttpExceptionFilter,
  MongooseExceptionFilter,
  NotFoundExceptionFilter,
  ThrottlerFilter,
  ValidationFilter,
} from 'src/core/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV === 'dev') {
    app.use(morgan('tiny'));
  }

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new NotFoundExceptionFilter());
  app.useGlobalFilters(new MongooseExceptionFilter());
  app.useGlobalFilters(new ValidationFilter());
  app.useGlobalFilters(new ThrottlerFilter());
  app.useGlobalInterceptors(new PostStatusInterceptor());
  app.useGlobalInterceptors(new ResponseTransform());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: false,
      skipMissingProperties: false,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.map((error) => {
          return {
            error: `${error.property} has wrong value ${error.value}.`,
            message: Object.values(error.constraints || {}).join(''),
          };
        });
        return new ValidationException(messages);
      },
    }),
  );

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.FRONTEND_URL?.split(',') || [];
      if (
        (!origin || allowedOrigins.includes(origin)) &&
        process.env.NODE_ENV === 'prod'
      ) {
        callback(null, true);
      } else if (process.env.NODE_ENV === 'dev') {
        callback(null, true);
      } else {
        callback(
          new HttpException(
            `Not allowed by CORS : ${origin}`,
            HttpStatus.FORBIDDEN,
          ),
        );
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
