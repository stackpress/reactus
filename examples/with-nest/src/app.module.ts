import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ReactusService } from './reactus/reactus.service.js';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ReactusService],
})
export class AppModule {}
