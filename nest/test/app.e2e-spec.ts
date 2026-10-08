import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

const expectErrorShape = (body: Record<string, unknown>, statusCode: number) => {
  expect(body).toEqual({
    statusCode,
    error: expect.any(String),
    message: expect.anything(),
    path: expect.any(String),
    timestamp: expect.any(String),
  });
};

describe('API (e2e)', () => {
  let app: INestApplication;
  let token: string;
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'johndoe', password: 'susiairtest' })
      .expect(201);
    token = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health is public', async () => {
    await request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok' });
  });

  it.each([
    '/pilot/me',
    '/flight-hours/limits',
    '/flight-hours/summary',
    '/flight-hours?from=2026-05-01&to=2026-05-02',
    '/documents',
    '/schedules?year=2026&month=5',
  ])('GET %s returns 401 without a token', async (path) => {
    const res = await request(app.getHttpServer()).get(path).expect(401);
    expectErrorShape(res.body, 401);
  });

  it('rejects bad credentials with a clear message', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'johndoe', password: 'nope' })
      .expect(401);
    expectErrorShape(res.body, 401);
    expect(res.body.message).toBe('Invalid username or password');
  });

  it('validates the login body', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login').send({}).expect(400);
    expectErrorShape(res.body, 400);
  });

  it('returns the standard shape for unknown routes', async () => {
    const res = await request(app.getHttpServer()).get('/nope').expect(404);
    expectErrorShape(res.body, 404);
    expect(res.body.path).toBe('/nope');
  });

  it('returns the standard shape for malformed JSON', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad json')
      .expect(400);
    expectErrorShape(res.body, 400);
  });

  it('rejects an invalid summary range', async () => {
    const res = await request(app.getHttpServer())
      .get('/flight-hours/summary?range=2y')
      .set(auth())
      .expect(400);
    expectErrorShape(res.body, 400);
  });

  it('GET /pilot/me', async () => {
    const res = await request(app.getHttpServer()).get('/pilot/me').set(auth()).expect(200);
    expect(res.body).toMatchObject({
      name: 'John Doe',
      totalFlightHours: 1444.5,
      today: '2026-05-15',
    });
    expect(res.body.avatarUrl).toEqual(expect.any(String));
  });

  it('GET /flight-hours/summary?range=1w', async () => {
    const res = await request(app.getHttpServer())
      .get('/flight-hours/summary?range=1w')
      .set(auth())
      .expect(200);
    expect(res.body.points).toHaveLength(15);
    expect(res.body.points[7]).toMatchObject({ date: '2026-05-15', rollingSum: 25.2 });
    expect(res.body).toMatchObject({ limit: 40, max: 45 });
  });

  it('GET /documents computes statuses against 15 May 2026', async () => {
    const res = await request(app.getHttpServer()).get('/documents').set(auth()).expect(200);
    expect(res.body.documents.map((d: { status: string }) => d.status)).toEqual([
      'safe',
      'safe',
      'soon',
      'soon',
      'expired',
    ]);
  });

  it('GET /schedules returns one month', async () => {
    const res = await request(app.getHttpServer())
      .get('/schedules?year=2026&month=5')
      .set(auth())
      .expect(200);
    expect(res.body.schedules).toHaveLength(21);
    expect(res.body.legend).toHaveLength(10);
  });

  it('GET /schedules validates its parameters', async () => {
    const res = await request(app.getHttpServer())
      .get('/schedules?year=2026&month=13')
      .set(auth())
      .expect(400);
    expectErrorShape(res.body, 400);
  });
});
