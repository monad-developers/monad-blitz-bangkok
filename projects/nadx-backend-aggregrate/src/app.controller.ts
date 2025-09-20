import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class AppController {
  @Get()
  getHello(): any {
    return {
      status: 'running',
      version: '1',
    };
  }

  @Get('healthz')
  getHealth(): any {
    return {
      status: 'running',
      version: '1',
    };
  }
}
