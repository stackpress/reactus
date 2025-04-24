import { Module } from '@nestjs/common';
import { AppService } from './app.service';

@Module({
  providers: [AppService],
  exports: [AppService] 
})
export class AppModule {}
