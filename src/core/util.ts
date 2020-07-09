import * as fs from 'fs';

/** @internal */
export function ensureDirExists(dir: fs.PathLike): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}
