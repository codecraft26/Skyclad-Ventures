import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Actions E2E', () => {
  let app: INestApplication;
  const mockJwt =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMSIsImVtYWlsIjoidXNlcjFAbXlhcHAuY29tIiwicm9sZSI6InVzZXIifQ.test';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/actions/run (POST) - should validate scope rule', () => {
    return request(app.getHttpServer())
      .post('/v1/actions/run')
      .set('Authorization', `Bearer ${mockJwt}`)
      .send({
        scope: { type: 'folder', name: 'invoices', ids: ['id1'] },
        messages: [{ role: 'user', content: 'test' }],
        actions: ['make_document'],
      })
      .expect(400);
  });

  it('/actions/run (POST) - should require folder name for folder scope', () => {
    return request(app.getHttpServer())
      .post('/v1/actions/run')
      .set('Authorization', `Bearer ${mockJwt}`)
      .send({
        scope: { type: 'folder' },
        messages: [{ role: 'user', content: 'test' }],
        actions: ['make_document'],
      })
      .expect(400);
  });
});

