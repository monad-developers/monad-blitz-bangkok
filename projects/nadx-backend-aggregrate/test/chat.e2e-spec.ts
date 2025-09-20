import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('CHAT E2E Test', () => {
  let app: INestApplication<App>;
  let app2: INestApplication<App>;
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

    const moduleFixture2: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app2 = moduleFixture2.createNestApplication();
    await app.init();
    await app2.init();

    currentUser = getRandomUser();

    const result = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(currentUser);
    accessToken = result.body.tokens.accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  it('Need Auth to chat with AI', async () => {
    const result = await request(app.getHttpServer()).post('/api/chat').send({
      message: 'Hello',
    });
    expect(result.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('Chat with AI', async () => {
    const result = await request(app.getHttpServer())
      .post('/api/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        message: '2+2=',
      });

    expect([200, 201]).toContain(result.status);
    expect(result.body.message).toBeDefined();
    expect(result.body.conversationId).toBeDefined();
    expect(result.body.message).toBe('4');
  });

  it('Chat with AI with ConversationId', async () => {
    const result = await request(app.getHttpServer())
      .post('/api/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        message: '1+1',
      });

    expect([200, 201]).toContain(result.status);
    expect(result.body.message).toBeDefined();
    expect(result.body.conversationId).toBeDefined();

    const result2 = await request(app.getHttpServer())
      .post('/api/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        message: '2+2',
        conversationId: result.body.conversationId,
      });

    expect([200, 201]).toContain(result2.status);
    expect(result2.body.message).toBeDefined();
    expect(result2.body.conversationId).toBeDefined();

    const getByConversationRes = await request(app.getHttpServer())
      .get(`/api/chat/${result.body.conversationId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    // Get chat by conversation id
    expect([200, 201]).toContain(getByConversationRes.status);
    expect(getByConversationRes.body.length).toBe(4);
  });

  it('Get conversation list', async () => {
    const testUser = getRandomUser();

    const result = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser);
    const accessTokenTest = result.body.tokens.accessToken;

    const resultConversationListBefore = await request(app.getHttpServer())
      .get('/api/conversations')
      .set('Authorization', `Bearer ${accessToken}`);

    expect([200, 201]).toContain(resultConversationListBefore.status);
    expect(resultConversationListBefore.body.length).toBe(0);

    // Create chat with test user
    const chat = await request(app.getHttpServer())
      .post('/api/chat')
      .set('Authorization', `Bearer ${accessTokenTest}`)
      .send({
        message: '2+2=',
      });

    // Create chat with old conversation
    await request(app.getHttpServer())
      .post('/api/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        message: '2+2',
        conversationId: chat.body.conversationId,
      });

    // Create chat with test user
    await request(app.getHttpServer())
      .post('/api/chat')
      .set('Authorization', `Bearer ${accessTokenTest}`)
      .send({
        message: '1+1=',
      });

    // Get conversation list
    const resultConversationListAfter = await request(app.getHttpServer())
      .get('/api/conversations')
      .set('Authorization', `Bearer ${accessTokenTest}`);

    expect([200, 201]).toContain(resultConversationListAfter.status);
    expect(resultConversationListAfter.body.length).toBe(2);
  });

  it('Test Rate Limit with Chat Request', async () => {
    const testUser = getRandomUser();

    const result = await request(app2.getHttpServer())
      .post('/api/auth/register')
      .send(testUser);
    const accessTokenTest = result.body.tokens.accessToken;

    const promises = Array(20)
      .fill(null)
      .map(() =>
        request(app2.getHttpServer())
          .post('/api/chat')
          .set('Authorization', `Bearer ${accessTokenTest}`)
          .send({
            message: '2+2=',
          }),
      );

    const results = await Promise.all(promises);
    results.forEach((result) => {
      expect([200, 201]).toContain(result.status);
    });

    const resultWithRateLimit = await request(app2.getHttpServer())
      .post('/api/chat')
      .set('Authorization', `Bearer ${accessTokenTest}`)
      .send({
        message: '2+2=',
      });

    expect(resultWithRateLimit.status).toBe(HttpStatus.TOO_MANY_REQUESTS);

    // Wait 1 hour with jest fake timer
    jest.useFakeTimers({ advanceTimers: true });
    jest.advanceTimersByTime(60 * 60 * 1000);

    const resultAfter1Hour = await request(app2.getHttpServer())
      .post('/api/chat')
      .set('Authorization', `Bearer ${accessTokenTest}`)
      .send({
        message: '2+2=',
      });

    expect([200, 201]).toContain(resultAfter1Hour.status);
  });
});
