import { Inject, Module } from '@nestjs/common';
import { SignUpService } from './services/signup';
import { globalConfig } from 'src/config/config';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule.forRoot({ load: [globalConfig] }),
  ],
   providers: [SignUpService],
})
export class EventConsumerModule {}