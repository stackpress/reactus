import map from '@stackpress/lib/map';

export default class VirtualServer {
  //virtual file system
  public readonly fs = map();

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
   * Encodes the contents and saves it to the VFS
   */
  public set(filepath: string, contents: string) {
    //encode the code
    const data = Buffer.from(contents).toString('base64');
    //save to VFS
    this.fs.set(filepath, data);
    return `vfs:${filepath}`;
  }
}