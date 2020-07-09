import * as fs from 'fs';
import * as crypto from 'crypto';
import {
  AuthData,
  StartServerOptions,
  TokenResponse,
} from './server/server.types';
import { startBot } from './bot/bot';
import { ensureDirExists } from './util';

/** @internal */
const AUTH_PATH = './.config/auth.json';
/** @internal */
let _isSetupYet = false;
/** @internal */
let _otp = '';

/** @internal */
export function isSetupYet(): boolean {
  return _isSetupYet;
}

/** @internal */
export function getOTP(): string {
  return _otp;
}

/**
 * This function checks if OAuth credentials were already obtained, if so returns them.
 * If not it starts set setup proccess and prompts the user
 * @internal
 */
export async function setup(
  opts: StartServerOptions,
): Promise<AuthData | null> {
  const dataFromDisk = _this.readFromDisk();

  if (dataFromDisk !== null) {
    // already set up
    _isSetupYet = true;
    return dataFromDisk;
  }

  _otp = crypto.randomBytes(30).toString('hex'); // used to authenticate the user
  const setupURL = `${opts.host}/setup?token=${_otp}`;

  console.log(
    `===================================================\n` +
      `Please make sure\n` +
      `   '${opts.host}/setup/callback', \n` +
      `   '${opts.host}/add/callback' and \n` +
      `   '${opts.host}/remove/callback'\n` +
      `are in the list of OAuth redirects of your Twitch-App!\n\n` +
      `To connect the bot with it's twitch account log in with it on twitch and visit\n\n` +
      `'${setupURL}'.\n\n` +
      `There you connect the twitch account with the bot\n\n` +
      `This only needs to be done once.\n` +
      `===================================================n`,
  );

  return null;
}

/** @internal */
export async function finishSetup(
  options: StartServerOptions,
  token: TokenResponse,
): Promise<void> {
  _this.writeToDisk(token);
  _isSetupYet = true;
  startBot(options, token);
}

/** @internal */
export function writeToDisk(token: TokenResponse): void {
  const dir = './.config';
  ensureDirExists(dir);

  const { access_token, refresh_token } = token;

  fs.writeFileSync(
    dir + '/auth.json',
    JSON.stringify(
      {
        access_token,
        refresh_token,
      },
      null,
      2,
    ),
  );
}

/**
 * Reads OAuth data from disk and returns it
 * @internal
 */
export function readFromDisk(): AuthData | null {
  try {
    const content = fs.readFileSync(AUTH_PATH, 'utf8');
    const obj = JSON.parse(content);
    return obj;
  } catch (e) {
    return null;
  }
}

/** 
 * Used so we can stub the functions
 * @internal
 * */
export const _this = {
  writeToDisk,
  readFromDisk,
  finishSetup,
  setup,
  getOTP,
  isSetupYet,
};
