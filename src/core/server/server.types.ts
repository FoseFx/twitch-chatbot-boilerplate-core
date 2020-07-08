import { Express } from 'express';
import { BoilerplateEventEmitter } from '../event';

export interface StartServerOptions {
  eventEmitter: BoilerplateEventEmitter;
  host: string;
  port: number;
  botname: string;
  clientId: string;
  clientSecret: string;
  setupScopes: string[];
  scopes: string[] /** set by the developer */;
  app?: Express;
  beforeRouteSetup?: (app: Express) => void;
}

export interface AuthData {
  access_token: string;
  refresh_token: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string[];
  token_type: 'bearer';
}

export interface BasicProfile {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  provider: 'twitch';
}
