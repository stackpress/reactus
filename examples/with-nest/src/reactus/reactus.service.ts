import { Injectable } from '@nestjs/common';
import { IncomingMessage } from 'http';
import { dev, serve } from 'reactus';
import { SR } from 'reactus/types';
import path from 'path';

@Injectable()
export class ReactusService {
  private readonly engine:
    | ReturnType<typeof dev>
    | ReturnType<typeof serve>;

  private readonly isDev = process.env.NODE_ENV !== 'production';

  constructor() {
    const cwd = process.cwd();

    if (this.isDev) {
      this.engine = dev({ cwd });
    } else {
      this.engine = serve({
        cwd,
        clientRoute: '/client',
        pagePath: path.join(cwd, '.build/pages'),
        cssRoute: '/assets',
      });
    }
  }

  async render(path: string, props: Record<string, any> = {}): Promise<string> {
    return this.engine.render(path, props);
  }

  async handleAssets(req: IncomingMessage, res: SR) {
    if (this.isDev && 'http' in this.engine) {
      await this.engine.http(req, res);
    }
  }
}
