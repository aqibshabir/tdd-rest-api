import { startServer, pool, PORT } from '../server.js';
import { app } from '../app.js';
import 'dotenv/config';

jest.mock('../app.js', () => ({
  app: {
    listen: jest.fn((port, callback) => {
      const server = {
        close: jest.fn((cb) => cb()),
      };
      callback();
      return server;
    }),
  },
}));

jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    end: jest.fn(),
  })),
}));

describe('server start', () => {
  let mockExit;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExit = jest.spyOn(process, 'exit').mockImplementation();
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  it('should start server and log correct message', () => {
    const log = jest.spyOn(console, 'log').mockImplementation();
    startServer();
    expect(app.listen).toHaveBeenCalledWith(PORT, expect.any(Function));
    expect(log).toHaveBeenCalledWith(`Server is running on http://localhost:${PORT}`);
    log.mockRestore();
  });

  it('should gracefully shut down server and database on SIGTERM', async () => {
    const mockServer = app.listen.mock.results[0]?.value || { close: jest.fn((cb) => cb()) };
    app.listen.mockReturnValue(mockServer);
    startServer();
    await process.emit('SIGTERM');
    expect(pool.end).toHaveBeenCalled();
    expect(mockServer.close).toHaveBeenCalled();
  });

  it('should not automatically start the server if NODE_ENV is "test"', () => {
    process.env.NODE_ENV = 'test';
    jest.isolateModules(() => require('../server.js'));
    expect(app.listen).not.toHaveBeenCalled();
  });

  it('should automatically start the server if NODE_ENV is "development"', () => {
    process.env.NODE_ENV = 'development';
    jest.isolateModules(() => require('../server.js'));
    expect(app.listen).toHaveBeenCalled();
  });
});
