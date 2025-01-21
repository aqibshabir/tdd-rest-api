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
  res.send('hello world');
});

app.post('/', (req, res) => {
  res.json(req.body);
});
