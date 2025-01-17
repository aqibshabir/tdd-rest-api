import { app, port } from './server';

test('port should be 9000', () => {
  return expect(port).toMatch(/9000/);
});
