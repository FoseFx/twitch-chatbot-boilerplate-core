import { EventEmitter } from 'events';
import { AuthData, BasicProfile } from './server/server.types';

interface AuthDataAndBasicProfile {
  authData: AuthData;
  basicProfile: BasicProfile;
}

export declare interface BoilerplateEventEmitter {
  on(
    event: 'join' | 'leave',
    listener: (obj: AuthDataAndBasicProfile) => void,
  ): this;
}

export class BoilerplateEventEmitter extends EventEmitter {
  emitEvent(type: 'join' | 'leave', obj: AuthDataAndBasicProfile): void {
    this.emit(type, obj);
  }
}

//
// Client-ready event emitter
//

let _eventEmitter: EventEmitter;

export function setClientReadyEmitter(ee: EventEmitter): void {
  _eventEmitter = ee;
}

export function getClientReadyEmitter(): EventEmitter {
  return _eventEmitter;
}
