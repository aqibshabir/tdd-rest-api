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

  describe('GET /users/:id route (get specific user)', () => {
    it('should only return one user from the database', async () => {
      const response = await request(app).get('/users/1');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 1, name: 'Aqib Shabir', email: 'aqib@email.com' });
    });

    it('should return 404 error when user is not found', async () => {
      const response = await request(app).get('/users/99');
      expect(response.status).toBe(404);
      expect(response.text).toContain('User Not Found');
    });

    it('should return 400 when invalid id given', async () => {
      const response = await request(app).get('/users/invalid-id');
      expect(response.status).toBe(400);
      expect(response.text).toContain('Provide Valid ID');
    });

    it('should handle 500 errors when database errors occurs', async () => {
      const query = pool.query;
      pool.query = jest.fn().mockRejectedValue(new Error('simulating an error'));
      const response = await request(app).get('/users/1');
      expect(response.status).toBe(500);
      pool.query = query;
    });
  });

  describe('POST /users route (create a new user)', () => {
    it('should create a new user', async () => {
      const payload = { name: 'Jake Smith', email: 'jake@email.com' };
      const response = await request(app).post('/users').send(payload);
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(payload);
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 error when missing field(s)', async () => {
      const payload = { name: '', email: '' };
      const response = await request(app).post('/users').send(payload);
      expect(response.status).toBe(400);
      expect(response.text).toContain('Missing Field(s)');
    });

    it('should return 400 error when name is not a string', async () => {
      const payload = { name: 123, email: 'hello@email.com' };
      const response = await request(app).post('/users').send(payload);
      expect(response.status).toBe(400);
      expect(response.text).toContain('Name Must Be a String');
    });

    it('should return 400 error when email is invalid', async () => {
      const payload = { name: 'Henry', email: 'invalid-email-format' };
      const response = await request(app).post('/users').send(payload);
      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid Email Address');
    });

    it('should return 400 error when inputting duplicate email', async () => {
      const payload = { name: 'Another Aqib', email: 'aqib@email.com' };
      const response = await request(app).post('/users').send(payload);
      expect(response.status).toBe(400);
      expect(response.text).toBe('Email Already Exists');
    });

    it('should return 500 error when database error occurs', async () => {
      const query = pool.query;
      pool.query = jest.fn().mockRejectedValue(new Error('simulating an error'));
      const payload = { name: 'Jake Smith', email: 'jake@email.com' };
      const response = await request(app).post('/users').send(payload);
      expect(response.status).toBe(500);
      pool.query = query;
    });
  });

  describe('PUT /users/:id (update an existing user)', () => {
    it('should update single user', async () => {
      const payload = { name: 'New Person', email: 'edited@email.com' };
      const response = await request(app).put('/users/1').send(payload);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 1,
        name: 'New Person',
        email: 'edited@email.com',
      });
    });

    it('should return 400 error when invalid id sent', async () => {
      const payload = { name: 'New Person', email: 'edited@email.com' };
      const response = await request(app).put('/users/invalid-id').send(payload);
      expect(response.status).toBe(400);
      expect(response.text).toContain('Provide Valid ID');
    });

    it('should return 400 error when missing field(s)', async () => {
      const payload = { name: '', email: '' };
      const response = await request(app).put('/users/1').send(payload);
      expect(response.status).toBe(400);
      expect(response.text).toBe('Missing Field(s)');
    });

    it('should return 400 error when name is not a string', async () => {
      const payload = { name: 123, email: 'edited@email.com' };
      const response = await request(app).put('/users/1').send(payload);
      expect(response.status).toBe(400);
      expect(response.text).toBe('Name Must Be a String');
    });

    it('should return 400 error when email is invalid', async () => {
      const payload = { name: 'George', email: 'invalid-email' };
      const response = await request(app).put('/users/1').send(payload);
      expect(response.status).toBe(400);
      expect(response.text).toBe('Invalid Email Address');
    });

    it('should return 400 error when inputting duplicate email', async () => {
      const payload = { name: 'edited', email: 'georgie@email.com' };
      const response = await request(app).put('/users/1').send(payload);
      expect(response.status).toBe(400);
      expect(response.text).toContain('Email Already Exists');
    });

    it('should return 404 error when user not found', async () => {
      const payload = { name: 'New Person', email: 'edited@email.com' };
      const response = await request(app).put('/users/99').send(payload);
      expect(response.status).toBe(404);
      expect(response.text).toContain('User Not Found');
    });

    it('should return 500 error when database errors occurs', async () => {
      const query = pool.query;
      pool.query = jest.fn().mockRejectedValue(new Error('simulated error'));
      const payload = { name: 'edited', email: 'edited@email.com' };
      const response = await request(app).put('/users/1').send(payload);
      expect(response.status).toBe(500);
      pool.query = query;
    });
  });

  describe('DELETE /users/:id (delete an existing user)', () => {
    it('should delete an existing user', async () => {
      const response = await request(app).delete('/users/1');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 1, name: 'Aqib Shabir', email: 'aqib@email.com' });
    });

    it('should decrement id of remaining users after deletion', async () => {
      await request(app).delete('/users/1');
      const response = await request(app).get('/users/1');
      expect(response.body).toEqual({ id: 1, name: 'Georgie Roberts', email: 'georgie@email.com' });
    });

    it('should return 400 error when invalid id sent', async () => {
      const response = await request(app).delete('/users/invalid-id');
      expect(response.status).toBe(400);
      expect(response.text).toContain('Provide Valid ID');
    });

    it('should return 404 when user not found', async () => {
      const response = await request(app).delete('/users/99');
      expect(response.status).toBe(404);
      expect(response.text).toBe('User Not Found');
    });

    it('should return 404 when deleting in empty database', async () => {
      await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
      const response = await request(app).delete('/users/1');
      expect(response.status).toBe(404);
      expect(response.text).toBe('User Not Found');
    });

    it('should return 500 error for database error', async () => {
      const query = pool.query;
      pool.query = jest.fn().mockRejectedValue(new Error('simulating error'));
      const response = await request(app).delete('/users/1');
      expect(response.status).toBe(500);
      pool.query = query;
    });
  });
});
