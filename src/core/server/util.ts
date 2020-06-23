import * as express from 'express';
import { Response as FetchResponse } from 'node-fetch';
import {
  Express,
  RequestHandler,
  Request,
  Response,
  NextFunction,
} from 'express';
import { getOTP, isSetupYet } from '../setup';

export function newExpressApp(): Express {
  return express();
}
/**
 * This middleware ensures only the admin with the correct token can access the resource.
 * It also sets the cookie, in case there is none
 * */
export function hasValidToken(medium: 'query' | 'cookies'): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction): void {
    const { token } = req[medium];

    if (!token || token !== getOTP()) {
      res.status(401);
      res.render('error', {
        heading: '401 - Unauthorized',
        message: 'Token invalid or not provided',
      });
    } else {
      res.cookie('token', token, { httpOnly: true });
      next();
    }
  };
}

export function onlyWhenSetup(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (isSetupYet()) {
    next();
    return;
  }
  res.status(503);
  res.render('error', {
    heading: '503 - Not set up yet',
    message: 'The owner did not finish the setup yet. Please be patient.',
  });
}

/** Makes sure the code query parameter is set */
export function hasCodeQuery(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { code } = req.query;
  if (!code) {
    res.status(400);
    res.render('error', {
      heading: 'Invalid response',
      message: 'Code not provided',
    });
    return;
  }
  next();
}

export async function ensureFetchIsOk(
  resp: FetchResponse,
): Promise<FetchResponse> {
  if (resp.ok) {
    return resp;
  }

  const errorMessage =
    'An error has occurred while reaching out to the TwitchAPI';

  return resp
    .json()
    .catch(() => null)
    .then((j) => {
      throw new Error(
        `${errorMessage}${
          j !== null ? ': ' + extractFetchErrorMessage(j) : ''
        }`,
      );
    });
}

export function extractFetchErrorMessage(json: {
  status?: number;
  message?: string;
}): string {
  if (json.message) {
    return json.message;
  }
  if (json.status) {
    return json.status + '';
  }
  return JSON.stringify(json);
}
