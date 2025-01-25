import express from 'express';
import cors from 'cors';
import { pool } from './server.js';
import isInvalidJSON from './utils/isInvalidJSON.js';

export const app = express();

// middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use((err, req, res, next) => {
  if (isInvalidJSON(err)) {
    res.status(400).send('Invalid JSON');
  }
  next(err);
});

// routes
app.get('/', (req, res) => {
  res.json({ info: 'Created using Node.js, Express, PostgreSQL, Jest and Supertest' });
});

app.post('/', (req, res) => {
  res.json(req.body);
});

// test route for 500 status errors
app.get('/error', (req, res) => {
  throw new Error('this is an error');
});

app.get('/users', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * from users ORDER BY id ASC');
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
});

app.get('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // validate ID (has to be positive integer)
    if (isNaN(Number(id)) || Number(id) <= 0 || !Number.isInteger(Number(id))) {
      return res.status(400).send('Provided Invalid ID');
    }
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    // checks if user found
    if (rows.length === 0) {
      return res.status(404).send('User Not Found');
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/users', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      res.status(400).send('Missing Field(s)');
    }
    if (typeof name !== 'string') {
      res.status(400).send('Name must be a string');
    }
    const { rows } = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json(rows[0]);
  } catch (error) {}
});

// 404 not found
app.use((req, res) => {
  res.status(404).send('Not Found');
});
// 500 errors
app.use((err, req, res, next) => {
  res.status(500).send('Internal Server Error');
});
