import { app } from '../app.js';
import { PORT, pool } from '../server.js';
import request from 'supertest';

let server;

beforeAll((done) => {
  server = app.listen(PORT, () => {
    done();
  });
});

afterAll(async () => {
  await server.close();
  await pool.end();
});

describe('intialising server', () => {
  it('should start the server on port 9000', () => {
    expect(server.address().port).toBe(Number(PORT));
  });
});

describe('initialising database', () => {
  it('should connect to the database successfully', async () => {
    const client = await pool.connect();
    try {
      const isConnected = await client.query('SELECT 1;');
      expect(isConnected.rowCount).toBe(1);
    } finally {
      client.release();
    }
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

  it('should return 404 when incorrect route', async () => {
    const response = await request(app).get('/nonexistent');
    expect(response.status).toBe(404);
    expect(response.text).toContain('Not Found');
  });

  it('should return 500 for errors', async () => {
    const response = await request(app).get('/error');
    expect(response.status).toBe(500);
    expect(response.text).toContain('Internal Server Error');
  });
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

describe('Database tests', () => {
  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
    await pool.query(
      "INSERT INTO users (name, email) VALUES ('Aqib Shabir', 'aqib@email.com'), ('Georgie Roberts', 'georgie@email.com');"
    );
  });

  afterEach(async () => {
    await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
  });

  describe('GET /users route (getting all users)', () => {
    it('should fetch all users from database', async () => {
      const response = await request(app).get('/users');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should return the correct data in asc order from the database', async () => {
      const response = await request(app).get('/users');
      expect(response.body).toEqual([
        { id: 1, name: 'Aqib Shabir', email: 'aqib@email.com' },
        { id: 2, name: 'Georgie Roberts', email: 'georgie@email.com' },
      ]);
    });

    it('should handle empty database', async () => {
      await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
      const response = await request(app).get('/users');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it('should return JSON content type', async () => {
      const response = await request(app).get('/users');
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle 500 errors when database error occurs', async () => {
      const query = pool.query;
      pool.query = jest.fn().mockRejectedValue(new Error('simulating an error'));
      const response = await request(app).get('/users');
      expect(response.status).toBe(500);
      pool.query = query;
    });
  });
});
