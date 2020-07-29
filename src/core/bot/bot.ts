import * as fs from 'fs';
import ChatClient from 'twitch-chat-client';
import { ChatClientOptions } from 'twitch-chat-client/lib/ChatClient';
import {
  AccessToken,
  RefreshableAuthProvider,
  StaticAuthProvider,
} from 'twitch';
import {
  AuthData,
  StartServerOptions,
  TokenResponse,
} from '../server/server.types';
import { getClientReadyEmitter } from '../event';
import { ensureDirExists } from '../util';
import { writeToDisk } from '../setup';

/** @internal */
let _client: ChatClient | null = null;
/** @internal */
let _channels: string[] = [];

/** @internal **/
export async function startBot(
  options: StartServerOptions,
  tmiOptions: ChatClientOptions,
  authData: AuthData | null,
): Promise<void> {
  if (_client !== null || authData === null) {
    return;
  }
  _client = await _this._createNewClient(options, tmiOptions, authData);
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
  _client.part(channel);
  _channels = _channels.filter((c) => c !== channel);
  _this._storeChannelsOnDisk();
  return channel;
}

/** @internal */
export async function _createNewClient(
  options: StartServerOptions,
  chatClientOptions: ChatClientOptions,
  authData: AuthData,
): Promise<ChatClient> {
  const authProvider = new RefreshableAuthProvider(
    new StaticAuthProvider(
      options.clientId,
      authData.access_token,
      options.setupScopes,
    ),
    {
      clientSecret: options.clientSecret,
      refreshToken: authData.refresh_token,
      onRefresh: (token: AccessToken) => {
        writeToDisk({
          access_token: token.accessToken,
          refresh_token: token.refreshToken,
        } as TokenResponse);
      },
    },
  );

  const client = new ChatClient(authProvider, chatClientOptions);

  // Note: _handleConnectError causes recursion to this function
  return client.connect().then(() => client);
}

/** @internal */
export function isBotRunning(): boolean {
  return !!_client;
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
export function _setClient(cl: ChatClient): void {
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
  _storeChannelsOnDisk,
  _readChannelsFromDisk,
  _setClient,
  _setChannels,
};
