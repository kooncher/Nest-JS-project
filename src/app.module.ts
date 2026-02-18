import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CryptoController } from './crypto.controller.js';
import { CryptoService } from './crypto.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env']
    })
  ],
  controllers: [CryptoController],
  providers: [CryptoService]
})
export class AppModule {}
