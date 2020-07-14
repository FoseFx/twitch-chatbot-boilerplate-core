/**
 * This is your entrypoint to the boilerplate-core,
 * check out the [Setup Guide](https://github.com/FoseFx/twitch-chatbot-boilerplate-core#how-does-it-work) to get started
 * @packageDocumentation
 */

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
  /**
   * Ask the streamer for more permissions,
   * you can recieve the token using the {@link InitializeObject.boilerplate | boilerplate events}
   *
   * More on scopes: https://dev.twitch.tv/docs/authentication#scopes
   *
   * @example
   * ```TypeScript
   * const { client, boilerplate } = await initialize({
   *  scopes: ['channel:read:hype_train', 'user:read:email']
   * });
   *
   * boilerplate.on('join', async ({ authData, basicProfile }) => {
   *   await sendVerificationEmail(basicProfile.email);
   *   addListenerForHypeTrain(authData.access_token);
   * })
   * ```
   *
   * */
  scopes?: string[];
}

export interface InitializeObject {
  client: Client;
  app: Express;
  /**
   * You can use this EventEmitter to listen to events like 'join' and 'leave',
   * read about it in the [Wiki](https://github.com/FoseFx/twitch-chatbot-boilerplate/wiki/Caveats#on-join-and-part)
   * */
  boilerplate: BoilerplateEventEmitter;
}

/**
 * The heart of this package,
 * read more in the [Setup Guide](https://github.com/FoseFx/twitch-chatbot-boilerplate-core#how-does-it-work)
 *
 * @example
 * ```TypeScript
 * const { initialize } = require('twitch-chatbot-boilerplate');
 *
 * async function main() {
 *     const { client } = await initialize();
 *
 *     // This is the example on the tmi.js website
 *     client.on('message', (channel, userstate, message, self) => {
 *         if (self) return;
 *         if (message.toLowerCase() === '!hello') {
 *             client.say(channel, `@${userstate.username}, heya!`);
 *         }
 *     });
 * }
 * main().catch((e) => console.error(e));
 * ```
 * @public
 */
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
      scopes: initializeOptions.scopes ?? [],
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
