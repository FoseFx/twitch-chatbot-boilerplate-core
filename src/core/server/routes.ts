import {
  Request,
  Response,
  Express,
  NextFunction,
  RequestHandler,
} from 'express';
import * as express from 'express';
import { isSetupYet } from '../setup';
import { StartServerOptions, AuthData } from './server.types';
import {
  getOAuthUrl,
  setupCallback,
  obtainAccessToken,
  getBasicProfileInfo,
} from './auth';
import { hasValidToken, onlyWhenSetup, hasCodeQuery } from './util';
import { BasicProfile } from '../core';
import { joinChannel, leaveChannel } from '../bot/bot';

/** @internal */
export function setUpRoutes(
  app: Express,
  startOptions: StartServerOptions,
): void {
  if (startOptions.beforeRouteSetup) {
    startOptions.beforeRouteSetup(app);
  }

  // Add
  app.get('/', _this.home);
  app.get(
    '/add',
    onlyWhenSetup,
    _this.typicalRequestHandler('add', startOptions),
  );
  app.get(
    '/add/callback',
    onlyWhenSetup,
    hasCodeQuery,
    _this.callbackRequestHandler('add', startOptions),
  );

  // Remove
  app.get(
    '/remove',
    onlyWhenSetup,
    _this.typicalRequestHandler('remove', startOptions),
  );
  app.get(
    '/remove/callback',
    onlyWhenSetup,
    hasCodeQuery,
    _this.callbackRequestHandler('remove', startOptions),
  );

  // Setup
  app.get('/setup', hasValidToken('query'), _this.setup(startOptions));
  app.get(
    '/setup/callback',
    hasValidToken('cookies'),
    hasCodeQuery,
    setupCallback(startOptions),
  );

  // Static
  app.use(express.static('public'));
  // 404
  app.get('*', _this.notfound);
  // Error page
  app.use(_this.errorpage);
}

/** @internal */
export function home(_req: Request, res: Response): void {
  res.redirect('/add');
}

/**
 * Using this route the owner can connect the bot's twitch account with the bot
 * @internal
 * */
export function setup(startOptions: StartServerOptions): RequestHandler {
  return function (_req: Request, res: Response): void {
    if (isSetupYet()) {
      res.redirect('/add');
      return;
    }

    res.redirect(
      getOAuthUrl(
        startOptions,
        startOptions.setupScopes,
        `${startOptions.host}/setup/callback`,
      ),
    );
  };
}

/**
 * Using this route streamers can add/remove the bot to/from their chat
 * @internal
 * */
export function typicalRequestHandler(
  type: 'add' | 'remove',
  startOptions: StartServerOptions,
): RequestHandler {
  const { botname } = startOptions;
  return function (_req: Request, res: Response): void {
    const twitchURL = getOAuthUrl(
      startOptions,
      type === 'remove' ? [] : startOptions.scopes,
      `${startOptions.host}/${type}/callback`,
    );
    res.render(type, { botname, twitchURL });
  };
}

/**
 * /add/callback and /remove/callback RequestHandler
 * @internal
 * */
export function callbackRequestHandler(
  type: 'add' | 'remove',
  options: StartServerOptions,
): RequestHandler {
  const { botname } = options;

  const action = type === 'add' ? joinChannel : leaveChannel;
  const okView = type === 'add' ? 'add_success' : 'remove_success';
  const eventName = type === 'add' ? 'join' : 'leave';

  return function (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const { code } = req.query;

    let authData;
    let basicProfile;

    return obtainAccessToken(
      options,
      code as string,
      `${options.host}/setup/callback`,
    )
      .then((auth: AuthData) => (authData = auth))
      .then((auth: AuthData) => getBasicProfileInfo(options, auth))
      .then((profile: BasicProfile) => (basicProfile = profile))
      .then((profile: BasicProfile) => action(profile.login))
      .then((login) => res.render(okView, { botname, login }))
      .then(() =>
        options.eventEmitter.emitEvent(eventName, { authData, basicProfile }),
      )
      .catch((e) => next(e));
  };
}

/** @internal */
export function notfound(_req: Request, res: Response): void {
  res.status(404).render('error', {
    heading: '404 - Not Found',
    message: 'The path you provided is invalid',
  });
}

/** @internal */
export function errorpage(
  error: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  res.status(500);
  res.render('error', {
    heading: '500 - Internal Server Error',
    message: error.message,
  });
  throw error;
}

/** @internal */
export const _this = {
  setUpRoutes,
  home,
  setup,
  typicalRequestHandler,
  notfound,
  errorpage,
  callbackRequestHandler,
};
