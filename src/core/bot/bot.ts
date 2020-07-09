import * as fs from 'fs';
import { Client } from 'tmi.js';
import { AuthData, StartServerOptions } from '../server/server.types';
import { refreshAccessToken } from '../server/auth';
import { getClientReadyEmitter } from '../event';
import { ensureDirExists } from '../util';

/** @internal */
let _client: Client | null = null;
/** @internal */
let _channels: string[] = [];

/** @internal **/
export async function startBot(
  options: StartServerOptions,
  authData: AuthData | null,
): Promise<void> {
  if (_client !== null || authData === null) {
    return;
  }
  _client = await _this._createNewClient(options, authData);
  _channels = _this._readChannelsFromDisk();

  for (const channel of _channels) {
    _client.join(channel);
  }
  getClientReadyEmitter().emit('clientReady', _client);
}

/**
 * @public
 * @return {Promise<string>} - the channel the bot has joined
 * @example
 * ```
 * import { joinChannel } from 'twitch-chatbot-boilerplate';
 * await joinChannel("fosefx");
 * ```
 */
export async function joinChannel(channel: string): Promise<string> {
  if (_channels.includes(channel)) {
    throw new Error('Bot already joined this chat');
  }

  return _client.join(channel).then(() => {
    _channels.push(channel);
    _this._storeChannelsOnDisk();
    return channel;
  });
}

/**
 * @public
 * @return {Promise<string>} - the channel the bot has left
 * @example
 * ```
 * import { leaveChannel } from 'twitch-chatbot-boilerplate';
 * await leaveChannel("fosefx");
 * ```
 */
export async function leaveChannel(channel: string): Promise<string> {
  return _client.part(channel).then(() => {
    _channels = _channels.filter((c) => c !== channel);
    _this._storeChannelsOnDisk();
    return channel;
  });
}

/** @internal */
export async function _createNewClient(
  options: StartServerOptions,
  authData: AuthData,
): Promise<Client> {
  const client = Client({
    options: {
      debug: true,
    },
    connection: {
      secure: true,
      reconnect: true,
    },
    identity: {
      username: options.clientId,
      password: authData.access_token,
    },
  });

  // Note: _handleConnectError causes recursion to this function
  return client
    .connect()
    .then(() => client)
    .catch((e) => _this._handleConnectError(options, authData, e));
}

/** @internal */
export function isBotRunning(): boolean {
  return !!_client;
}

/** @internal */
export async function _handleConnectError(
  opts: StartServerOptions,
  authData: AuthData,
  error: string,
): Promise<Client> {
  if (error === 'Login authentication failed') {
    return _this._handleAuthError(opts, authData);
  } else {
    throw new Error(error);
  }
}

/** @internal */
export function _handleAuthError(
  opts: StartServerOptions,
  authData: AuthData,
): Promise<Client> {
  return refreshAccessToken(opts, authData, true).then((newData) =>
    _this._createNewClient(opts, newData),
  );
}

/** @internal */
export function _storeChannelsOnDisk(): void {
  const dir = './.config';
  ensureDirExists(dir);
  fs.writeFileSync(dir + '/channels.json', JSON.stringify(_channels));
}

/** @internal */
export function _readChannelsFromDisk(): string[] {
  const dir = './.config';
  ensureDirExists(dir);
  try {
    const str = fs.readFileSync(dir + '/channels.json', 'utf-8');
    return JSON.parse(str);
  } catch {
    return [];
  }
}

/** @internal */
export function _setClient(cl: Client): void {
  _client = cl;
}

/** @internal */
export function _setChannels(ch: string[]): void {
  _channels = ch;
}

/** @internal */
export const _this = {
  startBot,
  joinChannel,
  leaveChannel,
  _createNewClient,
  _handleConnectError,
  _handleAuthError,
  _storeChannelsOnDisk,
  _readChannelsFromDisk,
  _setClient,
  _setChannels,
};
