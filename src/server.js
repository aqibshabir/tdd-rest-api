import { app } from './app.js';
import 'dotenv/config';

export const PORT = process.env.PORT;

export const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

if (process.env.NODE_ENV === 'development') {
  startServer();
}
