import { app } from '../app.js';
import { PORT } from '../server.js';
import request from 'supertest';

let server;

beforeAll((done) => {
  server = app.listen(PORT, () => {
    done();
  });
});

afterAll((done) => {
  server.close(() => {
    done();
  });
});

describe('intialising server', () => {
  it('should start the server on port 9000', () => {
    expect(server.address().port).toBe(Number(PORT));
  });
});

describe('Middleware', () => {
  it('should set the access-control-allow-origin header', async () => {
    const response = await request(app).get('/');
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('should parse JSON body', async () => {
    const payload = { key: 'value' };
    const response = await request(app)
      .post('/')
      .send(payload)
      .set('Content-Type', 'application/json');
    expect(response.body).toEqual(payload);
  });

  it('should return 400 for invalid JSON', async () => {
    const response = await request(app)
      .post('/')
      .send('not valid json')
      .set('Content-Type', 'application/json');
    expect(response.status).toBe(400);
    expect(response.text).toContain('Invalid JSON');
  });

  describe('GET / route', () => {
    it('should return JSON with the expected info message', async () => {
      const expectedPayload = {
        info: 'Created using Node.js, Express, PostgreSQL, Jest and Supertest',
      };
      const response = await request(app).get('/').set('Content-Type', 'application/json');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expectedPayload);
    });
  });
});
