import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserRequest = createParamDecorator(
  (data, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    return (request as any).user;
  },
);
