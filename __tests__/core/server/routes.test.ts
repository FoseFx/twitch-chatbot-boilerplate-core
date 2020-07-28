import { Express, Request, Response } from 'express';
import {
  _this as routes,
  typicalRequestHandler,
  callbackRequestHandler,
} from '../../../src/core/server/routes';
import * as auth from '../../../src/core/server/auth';
import * as setup from '../../../src/core/setup';
import * as bot from '../../../src/core/bot/bot';

import {
  StartServerOptions,
  TokenResponse,
  BasicProfile,
} from '../../../src/core/server/server.types';
import { BoilerplateEventEmitter } from '../../../src/core/core';

describe('routes', () => {
  describe('setup', () => {
    it('should redirect to /add when setup already', () => {
      jest.spyOn(setup, 'isSetupYet').mockReturnValue(true);

      const res = ({
        redirect: jest.fn(),
      } as unknown) as Response;

      const opts = { botname: 'Hey-Bot' } as StartServerOptions;

      routes.setup(opts)({} as Request, res, null);

      expect(res.redirect).toHaveBeenCalledWith('/add');
    });

    it('should set cookie and redirect when token valid', () => {
      jest.spyOn(setup, 'isSetupYet').mockReturnValue(false);
      jest.spyOn(setup, 'getOTP').mockReturnValue('testtest');
      const spy = jest.spyOn(auth, 'getOAuthUrl').mockReturnValue('url');

      const req = ({} as unknown) as Request;

      const res = ({
        redirect: jest.fn(),
        cookie: jest.fn(),
      } as unknown) as Response;

      const opts = {
        botname: 'Hey-Bot',
        setupScopes: [''],
        host: 'test',
      } as StartServerOptions;

      routes.setup(opts)(req, res, null);

      expect(spy).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('url');
    });
  });

  describe('setUpRoutes', () => {
    it('should call beforeRouteSetup() and setup routes correctly', () => {
      const addHandler = jest.fn();
      const addCbHandler = jest.fn();
      const removeHandler = jest.fn();
      const removeCbHandler = jest.fn();
      const setupHandler = jest.fn();
      const setupCbHandler = jest.fn();

      jest.spyOn(routes, 'typicalRequestHandler').mockImplementation((type) => {
        return type === 'add' ? addHandler : removeHandler;
      });
      jest
        .spyOn(routes, 'callbackRequestHandler')
        .mockImplementation((type) => {
          return type === 'add' ? addCbHandler : removeCbHandler;
        });

      jest.spyOn(routes, 'setup').mockReturnValue(setupHandler);
      jest.spyOn(auth, 'setupCallback').mockReturnValue(setupCbHandler);

      const map = {};
      let use;
      const fakeApp = {
        get: (key, ...vals) => (map[key] = vals),
        use: (val) => (use = val),
      } as Express;

      const beforeRouteSetup = jest.fn();
      const options = ({ beforeRouteSetup } as unknown) as StartServerOptions;

      routes.setUpRoutes(fakeApp, options);

      expect(beforeRouteSetup).toHaveBeenCalledWith(fakeApp);

      expect(map['/'][0]).toEqual(routes.home);
      expect(map['*'][0]).toEqual(routes.notfound);
      expect(map['/add'][1]).toEqual(addHandler);
      expect(map['/add/callback'][2]).toEqual(addCbHandler);
      expect(map['/remove'][1]).toEqual(removeHandler);
      expect(map['/remove/callback'][2]).toEqual(removeCbHandler);
      expect(map['/setup'][1]).toEqual(setupHandler);
      expect(map['/setup/callback'][2]).toEqual(setupCbHandler);
      expect(use).toEqual(routes.errorpage);
    });
  });

  test('home should redirect to add', () => {
    const res = ({ redirect: jest.fn() } as unknown) as Response;
    routes.home({} as Request, res);
    expect(res.redirect).toHaveBeenCalledWith('/add');
  });

  describe('typicalRequestHandler', () => {
    const opts = {
      botname: 'Hey-Bot',
      host: 'http://localhost:8080',
      scopes: ['test:scopes'],
    } as StartServerOptions;
    const exp = {
      botname: 'Hey-Bot',
      twitchURL: 'https://www.test.com/test?test',
    };

    let res;
    let getOAuthUrlSpy;
    beforeEach(() => {
      getOAuthUrlSpy = jest
        .spyOn(auth, 'getOAuthUrl')
        .mockReset()
        .mockReturnValue('https://www.test.com/test?test');

      res = ({
        render: jest.fn(),
      } as unknown) as Response;
    });
    it('should render add', () => {
      typicalRequestHandler('add', opts)({} as Request, res, null);
      expect(res.render).toHaveBeenCalledWith('add', exp);
      expect(getOAuthUrlSpy).toHaveBeenCalledWith(
        opts,
        ['test:scopes'],
        'http://localhost:8080/add/callback',
      );
    });
    it('should render remove with custom scopes', () => {
      typicalRequestHandler('remove', opts)({} as Request, res, null);
      expect(res.render).toHaveBeenCalledWith('remove', exp);
      expect(getOAuthUrlSpy).toHaveBeenCalledWith(
        opts,
        [],
        'http://localhost:8080/remove/callback',
      );
    });
  });

  describe('callbackRequestHandler: remove', () => {
    it('should leave channel', () => {
      const oATSpy = jest
        .spyOn(auth, 'obtainAccessToken')
        .mockResolvedValue({} as TokenResponse);
      const gBPISpy = jest
        .spyOn(auth, 'getBasicProfileInfo')
        .mockResolvedValue({} as BasicProfile);
      const lCSpy = jest.spyOn(bot, 'leaveChannel').mockResolvedValue('fosefx');

      const res = ({ render: jest.fn() } as unknown) as Response;

      const next = jest.fn();

      const eventEmitter = new BoilerplateEventEmitter();
      const eventCallback = jest.fn();

      eventEmitter.once('leave', eventCallback);

      return callbackRequestHandler('remove', {
        botname: 'test-bot',
        eventEmitter,
      } as StartServerOptions)(
        ({
          query: { code: 'test' },
        } as unknown) as Request,
        res,
        next,
      ).then(() => {
        expect(oATSpy).toHaveBeenCalled();
        expect(gBPISpy).toHaveBeenCalled();
        expect(lCSpy).toHaveBeenCalled();
        expect(res.render).toHaveBeenCalledWith('remove_success', {
          botname: 'test-bot',
          login: 'fosefx',
        });
        expect(next).not.toHaveBeenCalled();
        expect(eventCallback).toHaveBeenCalled();
      });
    });
  });

  describe('callbackRequestHandler: add', () => {
    it('should join channel', () => {
      const oATSpy = jest
        .spyOn(auth, 'obtainAccessToken')
        .mockResolvedValue({} as TokenResponse);
      const gBPISpy = jest
        .spyOn(auth, 'getBasicProfileInfo')
        .mockResolvedValue({} as BasicProfile);
      const jCSpy = jest.spyOn(bot, 'joinChannel').mockResolvedValue('fosefx');

      const res = ({ render: jest.fn() } as unknown) as Response;

      const next = jest.fn();
      const eventEmitter = new BoilerplateEventEmitter();
      const eventCallback = jest.fn();

      eventEmitter.once('join', eventCallback);

      return callbackRequestHandler('add', {
        botname: 'test-bot',
        eventEmitter,
      } as StartServerOptions)(
        ({
          query: { code: 'test' },
        } as unknown) as Request,
        res,
        next,
      ).then(() => {
        expect(oATSpy).toHaveBeenCalled();
        expect(gBPISpy).toHaveBeenCalled();
        expect(jCSpy).toHaveBeenCalled();
        expect(res.render).toHaveBeenCalledWith('add_success', {
          botname: 'test-bot',
          login: 'fosefx',
        });
        expect(next).not.toHaveBeenCalled();
        expect(eventCallback).toHaveBeenCalled();
      });
    });
  });
});
