import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Hello World', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('hello world', () => {
    return request(app.getHttpServer()).get('/api').expect(200).expect({
      status: 'running',
      version: '1',
    });
  });

  it('healthz check', () => {
    return request(app.getHttpServer()).get('/api/healthz').expect(200).expect({
      status: 'running',
      version: '1',
    });
  });
});
