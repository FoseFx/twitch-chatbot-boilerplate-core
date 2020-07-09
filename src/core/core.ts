import { Express } from 'express';
import { Client } from 'tmi.js';
import { EventEmitter } from 'events';
import {
  StartServerOptions,
  AuthData,
  BasicProfile,
} from './server/server.types';
import { loadEnvVariables } from './env';
import { startServer } from './server/server';
import { setup } from './setup';
import * as bot from './bot/bot';
import {
  setClientReadyEmitter,
  BoilerplateEventEmitter,
  AuthDataAndBasicProfile,
} from './event';

export interface InitializeOptions {
  /**
   * You can use an existing Express instance
   *
   * Note: initialize() will call app.listen()
   * Note: initialize() will change the view engine to ejs
   * Note: initialize() will add the cookieParser middelware
   * */
  app?: Express;
  /** This hook gets called before the routes are added to the express app */
  beforeRouteSetup?: (app: Express) => void;
}

export interface InitializeObject {
  client: Client;
  app: Express;
  boilerplate: BoilerplateEventEmitter;
}

export function initialize(
  initializeOptions: InitializeOptions = {},
): Promise<InitializeObject> {
  return new Promise((resolve, reject) => {
    loadEnvVariables(); // make sure all variables are available

    const opts: StartServerOptions = {
      eventEmitter: new BoilerplateEventEmitter(),
      host: process.env.HOST,
      port: +process.env.PORT,
      botname: process.env.BOTNAME,
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      setupScopes: ['chat:read', 'chat:edit'],
      beforeRouteSetup: initializeOptions.beforeRouteSetup,
      app: initializeOptions.app,
    };

    // after the bot is ready the "clientReady" event is fired on this one
    const clientEventEmitter = new EventEmitter();
    setClientReadyEmitter(clientEventEmitter);

    let app: Express;

    startServer(opts)
      .then((expressApp) => {
        app = expressApp;
        return setup(opts);
      })
      .then((authData) => bot.startBot(opts, authData))
      .catch((error) => reject(error));

    clientEventEmitter.once('clientReady', (client: Client) => {
      client.connect = () => {
        throw new Error(
          'The twitch-chatbot-boilerplate core gave you an already connected client, there is no need to call connect()',
        );
      };
      client.disconnect = () => {
        throw new Error('You should not call disconnect()');
      };

      resolve({ client, app, boilerplate: opts.eventEmitter });
    });
  });
}

export const joinChannel = bot.joinChannel;

export const leaveChannel = bot.leaveChannel;

export {
  BoilerplateEventEmitter,
  AuthDataAndBasicProfile,
  AuthData,
  BasicProfile,
};
