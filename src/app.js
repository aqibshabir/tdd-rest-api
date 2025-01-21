import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

export const app = express();

const corsOptions = {
  origin: 'http://localhost:3000',
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('hello world');
});

app.post('/', (req, res) => {
  res.json(req.body);
});
