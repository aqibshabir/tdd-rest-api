import { app } from '../app';
import { PORT } from '../server';

describe('intialising server', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(PORT, () => {
      done();
    });
  });

  afterAll((done) => {
    server.close(() => {
      done();
    });
  });

  it('should start the server on port 9000', () => {
    expect(server.address().port).toBe(9000);
  });
});
