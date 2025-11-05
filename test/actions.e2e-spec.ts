import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';

describe('Actions E2E', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let mockJwt: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();

    // Generate a valid JWT token for testing
    jwtService = moduleFixture.get<JwtService>(JwtService);
    mockJwt = jwtService.sign({
      sub: 'user1',
      email: 'user1@myapp.com',
      role: 'user',
    });
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

