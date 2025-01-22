import express from 'express';
import cors from 'cors';
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

// 404 not found
app.use((req, res) => {
  res.status(404).send('Not Found');
});
// 500 errors
app.use((err, req, res, next) => {
  res.status(500).send('Internal Server Error');
});
