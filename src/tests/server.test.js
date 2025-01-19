import { app } from '../app';
import { PORT } from '../server';
import request from 'supertest';

describe('intialising server', () => {
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

  it('should start the server on port 9000', () => {
    expect(server.address().port).toBe(9000);
  });
});

describe('CORS middleware', () => {
  it('should set the access-control-allow-origin header', async () => {
    const response = await request(app).get('/');
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });
});
