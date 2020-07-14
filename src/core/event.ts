import { EventEmitter } from 'events';
import { AuthData, BasicProfile } from './server/server.types';

/** @public */
export interface AuthDataAndBasicProfile {
  authData: AuthData;
  basicProfile: BasicProfile;
}

/** @public */
export declare interface BoilerplateEventEmitter {
  on(
    event: 'join' | 'leave',
    listener: (obj: AuthDataAndBasicProfile) => void,
  ): this;
}

/**
 * Emits events 'join' and 'leave', see {@link BoilerplateEventEmitter.on | on()}
 * 
 * [Wiki](https://github.com/FoseFx/twitch-chatbot-boilerplate/wiki/Caveats#on-join-and-part)
 * @public
 */ export class BoilerplateEventEmitter extends EventEmitter {
  emitEvent(type: 'join' | 'leave', obj: AuthDataAndBasicProfile): void {
    this.emit(type, obj);
  }
}

//
// Client-ready event emitter
//

/** @internal */
let _eventEmitter: EventEmitter;

/** @internal */
export function setClientReadyEmitter(ee: EventEmitter): void {
  _eventEmitter = ee;
}

/** @internal */
export function getClientReadyEmitter(): EventEmitter {
  return _eventEmitter;
}
