import * as fs from 'fs';
import { _this as bot } from '../../../src/core/bot/bot';
import {
  StartServerOptions,
  AuthData,
} from '../../../src/core/server/server.types';
import ChatClient from 'twitch-chat-client';
import { ChatClientOptions } from 'twitch-chat-client/lib/ChatClient';
import * as clientReadyEventEmitter from '../../../src/core/event';
import * as twitch from 'twitch';
import { EventEmitter } from 'events';

jest.genMockFromModule('twitch-chat-client');
jest.mock('twitch-chat-client');

const opts = {} as StartServerOptions;
const authData = {} as AuthData;

describe('bot.ts', () => {
  let origCreateNewClient;
  beforeEach(() => {
    jest
      .spyOn(twitch, 'StaticAuthProvider')
      .mockReturnValue(({} as unknown) as twitch.StaticAuthProvider);
    jest
      .spyOn(twitch, 'RefreshableAuthProvider')
      .mockReturnValue(({} as unknown) as twitch.RefreshableAuthProvider);

    origCreateNewClient = bot._createNewClient;
  });

  afterEach(() => {
    bot._createNewClient = origCreateNewClient;
  });

  describe('_createNewClient', () => {
    it('should return new Client when connection is successful', () => {
      expect.assertions(1);
      const cl = ({
        connect: jest.fn().mockResolvedValue(undefined),
      } as unknown) as ChatClient;

      ((ChatClient as unknown) as jest.Mock).mockReturnValue(cl);

      return bot._createNewClient(opts, undefined, authData).then((rescl) => {
        expect(rescl).toEqual(cl);
      });
    });
    it('should pass options', async () => {
      expect.assertions(2);
      const cl = ({
        connect: jest.fn().mockResolvedValue(undefined),
      } as unknown) as ChatClient;

      const customOptions: ChatClientOptions = {
        ssl: false,
        channels: ['test'],
      };

      ((ChatClient as unknown) as jest.Mock).mockImplementation(
        (_, options) => {
          expect(options).toEqual(customOptions);
          return cl;
        },
      );

      await bot._createNewClient(opts, customOptions, authData);
      expect(cl.connect).toHaveBeenCalled();
    });
  });

  describe('startBot', () => {
    it('should not start bot when not AuthData provided', () => {
      const spy = jest.spyOn(bot, '_createNewClient');
      bot.startBot(opts, undefined, null);
      expect(spy).not.toHaveBeenCalled();
    });
    it('should start bot when not started already', async () => {
      const fakeEmit = jest.fn();
      const fakeClient = ({ join: jest.fn() } as unknown) as ChatClient;
      jest.spyOn(bot, '_readChannelsFromDisk').mockReturnValue(['test']);
      jest
        .spyOn(clientReadyEventEmitter, 'getClientReadyEmitter')
        .mockReturnValue(({ emit: fakeEmit } as unknown) as EventEmitter);
      const spy = jest
        .spyOn(bot, '_createNewClient')
        .mockReset()
        .mockResolvedValue(fakeClient);
      await bot.startBot(opts, undefined, authData);
      expect(spy).toHaveBeenCalled();
      expect(fakeClient.join).toHaveBeenCalledWith('test');
      expect(fakeEmit).toHaveBeenCalledWith('clientReady', fakeClient);
    });
    it('should not start bot when started already', () => {
      const spy = jest.spyOn(bot, '_createNewClient');
      bot.startBot(opts, undefined, authData);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('joinChannel', () => {
    it('should join channel', () => {
      expect.assertions(1);
      bot._setChannels(['other']);
      const fakeCl = ({
        join: jest.fn().mockResolvedValue([]),
      } as unknown) as ChatClient;
      jest.spyOn(fs, 'writeFileSync').mockReturnValue(undefined);
      bot._setClient(fakeCl);
      return bot.joinChannel('test').then(() => {
        expect(fakeCl.join).toHaveBeenCalledWith('test');
      });
    });
  });

  describe('leaveChannel', () => {
    it('should leave channel', () => {
      expect.assertions(2);
      bot._setChannels(['other', 'test', 'another']);
      const fakeCl = ({
        part: jest.fn().mockResolvedValue([]),
      } as unknown) as ChatClient;
      const wfSSpy = jest
        .spyOn(fs, 'writeFileSync')
        .mockReset()
        .mockReturnValue(undefined);
      bot._setClient(fakeCl);
      return bot.leaveChannel('test').then(() => {
        expect(fakeCl.part).toHaveBeenCalledWith('test');
        expect(wfSSpy).toHaveBeenCalledWith(
          './.config/channels.json',
          JSON.stringify(['other', 'another']),
        );
      });
    });
  });
});
