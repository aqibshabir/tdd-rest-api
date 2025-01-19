import express from 'express';
import cors from 'cors';

export const app = express();

const corsOptions = {
  origin: 'http://localhost:3000',
};
app.use(cors(corsOptions));

app.get('/', (req, res) => {
  res.send('hello world');
});
