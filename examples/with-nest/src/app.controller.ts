import { Controller, Get, Res } from '@nestjs/common';
import { ReactusService } from './reactus/reactus.service.js';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly reactusService: ReactusService) {}

  @Get('/')
  async home(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    const html = await this.reactusService.render('@/pages/home', {
      title: 'Home',
    });
    res.end(html);
  }
  @Get('/about')
  async about(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    const html = await this.reactusService.render('@/pages/about', {
      title: 'About',
    });
    res.end(html);
  }
}
