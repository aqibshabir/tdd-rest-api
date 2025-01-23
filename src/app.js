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
    const result = await pool.query('SELECT * from users ORDER BY id ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/users/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// 404 not found
app.use((req, res) => {
  res.status(404).send('Not Found');
});
// 500 errors
app.use((err, req, res, next) => {
  res.status(500).send('Internal Server Error');
});
