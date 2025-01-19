import { app } from './app';
import 'dotenv/config';

export const PORT = process.env.PORT;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
