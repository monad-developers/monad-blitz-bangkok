import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Auth E2E Test', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  const getRandomUser = () => {
    return {
      email: `test${Math.random()}@test.com`,
      password: 'test',
    };
  };

  let currentUser: any;

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

  it('Register complete get user and access token and set remain TOKEN', async () => {
    currentUser = getRandomUser();

    const result = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(currentUser);
    expect([200, 201]).toContain(result.status);
    expect(result.body.tokens.accessToken).toBeDefined();
    expect(result.body.user.email).toBe(currentUser.email);
    expect(result.body.user.remainingTokens).toBe(10000);

    accessToken = result.body.tokens.accessToken;
  });

  it('Get user Profile', async () => {
    const result = await request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect([200, 201]).toContain(result.status);
    expect(result.body.email).toBe(currentUser.email);
  });

  it('Login', async () => {
    const result = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(currentUser);
    expect([200, 201]).toContain(result.status);
    expect(result.body.tokens.accessToken).toBeDefined();
    expect(result.body.user.email).toBe(currentUser.email);
    expect(result.body.user.remainingTokens).toBe(10000);
  });

  it('Login password wrong', async () => {
    const result = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: currentUser.email,
        password: 'wrong',
      });
    expect([200, 201]).not.toContain(result.status);
  });

  it('Login email wrong', async () => {
    const result = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'wrong',
        password: currentUser.password,
      });
    expect([200, 201]).not.toContain(result.status);
  });

  it('No token get profile', async () => {
    const result = await request(app.getHttpServer()).get('/api/auth/profile');

    expect(result.status).toBe(HttpStatus.UNAUTHORIZED);

    const result2 = await request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}XXX`);
    expect([200, 201]).not.toContain(result.status);
  });

  it('Token expired', async () => {
    const expiredToken = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(currentUser);

    jest.useFakeTimers({ advanceTimers: true });
    jest.advanceTimersByTime(48 * 60 * 60 * 1000);

    const result = await request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${expiredToken.body.tokens.accessToken}`);

    expect([200, 201]).not.toContain(result.status);
  });
});
