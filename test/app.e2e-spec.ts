import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import request from 'supertest';
import { generateKeyPairSync } from 'crypto';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiErrorFilter } from '../src/common/api-error.filter.js';

describe('CryptoController (e2e)', () => {
  let app: INestApplication;
  let privateKeyPath: string;
  let publicKeyPath: string;

  beforeAll(async () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const dir = mkdtempSync(join(tmpdir(), 'nest-crypto-'));
    privateKeyPath = join(dir, 'private.pem');
    publicKeyPath = join(dir, 'public.pem');
    writeFileSync(privateKeyPath, privateKey.export({ type: 'pkcs1', format: 'pem' }).toString());
    writeFileSync(publicKeyPath, publicKey.export({ type: 'pkcs1', format: 'pem' }).toString());
    process.env.PRIVATE_KEY_PATH = privateKeyPath;
    process.env.PUBLIC_KEY_PATH = publicKeyPath;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new ApiErrorFilter());
    const config = new DocumentBuilder().setTitle('test').setVersion('1.0').build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/api-docs', app, doc);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('encrypts and decrypts payload', async () => {
    const payload = 'hello world';
    const encRes = await request(app.getHttpServer())
      .post('/get-encrypt-data')
      .send({ payload })
      .expect(200);
    expect(encRes.body.successful).toBe(true);
    expect(encRes.body.data.data1).toBeDefined();
    expect(encRes.body.data.data2).toBeDefined();

    const decRes = await request(app.getHttpServer())
      .post('/get-decrypt-data')
      .send({ data1: encRes.body.data.data1, data2: encRes.body.data.data2 })
      .expect(200);
    expect(decRes.body.successful).toBe(true);
    expect(decRes.body.data.payload).toBe(payload);
  });

  it('validates payload length and returns error shape', async () => {
    const longPayload = 'a'.repeat(2001);
    const res = await request(app.getHttpServer()).post('/get-encrypt-data').send({ payload: longPayload }).expect(400);
    expect(res.body.successful).toBe(false);
    expect(res.body.error_code).toBeTruthy();
    expect(res.body.data).toBeNull();
  });
});
