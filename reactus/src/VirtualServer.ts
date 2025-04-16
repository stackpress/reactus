//stackpress
import type { CallableMap } from '@stackpress/lib/types';
import map from '@stackpress/lib/map';
//common
import { VFS_PROTOCOL } from './constants.js';

export default class VirtualServer {
  //virtual file system
  public readonly fs: CallableMap<string, string>;

  public constructor() {
    this.fs = map();
  }

  /**
   * Returns the contents of the file from the VFS
   */
  public get(filepath: string) {
    const data = this.fs.get(filepath);
    if (typeof data === 'string') {
      return Buffer.from(data, 'base64').toString('utf8');
    }
    return null;
  }

  /**
   * Returns true if the file exists in the VFS
   */
  public has(filepath: string) {
    return this.fs.has(filepath);
  }

  /**
   * Encodes the contents and saves it to the VFS
   */
  public set(filepath: string, contents: string) {
    //encode the code
    const data = Buffer.from(contents).toString('base64');
    //save to VFS
    this.fs.set(filepath, data);
    return `${VFS_PROTOCOL}${filepath}`;
  }
}