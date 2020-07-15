import { Express } from 'express';
import * as util from '../../../src/core/server/util';
import * as routes from '../../../src/core/server/routes';
import * as server from '../../../src/core/server/server';
import { StartServerOptions } from '../../../src/core/server/server.types';

describe('Server', () => {
  let verifyFilesExistMock;
  let consoleMock;
  let routesMock;
  let expressMock;
  let useMock;
  let setMock;
  let listenMock;

  const app = ({
    use: jest.fn(),
    set: jest.fn(),
    listen: jest.fn(),
  } as unknown) as Express;

  beforeEach(() => {
    consoleMock = jest.spyOn(console, 'log');
    routesMock = jest.spyOn(routes, 'setUpRoutes').mockReturnValue(undefined);

    useMock = jest.fn();
    setMock = jest.fn();
    listenMock = jest.fn().mockImplementation((port, cb) => {
      cb();
      return port;
    });
    expressMock = jest.spyOn(util, 'newExpressApp').mockReturnValue({
      use: useMock,
      set: setMock,
      listen: listenMock,
    } as Express);

    verifyFilesExistMock = jest
      .spyOn(util, 'verifyFilesExist')
      .mockImplementation(() => ({}));
  });
  describe('startServer()', () => {
    it('should start express server and attach routes and middleware', () => {
      server.startServer({ port: 6969 } as StartServerOptions);
      expect(verifyFilesExistMock).toBeCalled();
      expect(expressMock).toBeCalled();
      expect(setMock).toBeCalled();
      expect(routesMock).toBeCalled();
      expect(listenMock).toHaveLastReturnedWith(6969);
      expect(consoleMock).toHaveBeenCalledWith(
        'HTTP-Server listening on port 6969',
      );
    });
    it('should still listen even when listen: false, but no app provided', () => {
      server.startServer({ port: 6969, listen: false } as StartServerOptions);
      expect(listenMock).toHaveBeenCalled();
    });
    it('should not listen when listen: false and app provided', () => {
      server.startServer({
        port: 6969,
        listen: false,
        app,
      } as StartServerOptions);
      expect(app.listen).not.toHaveBeenCalled();
    });
    it('should listen when listen: true and app provided', () => {
      server.startServer({
        port: 6969,
        listen: true,
        app,
      } as StartServerOptions);
      expect(app.listen).toHaveBeenCalled();
    });
  });
});
