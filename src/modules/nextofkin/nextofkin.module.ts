import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { UserNextOfKinEntity } from './entities/user_next_of_kin.entity';
import { NextOfKinService } from './services/nextofkin.service';
import { NextOfKinController } from './controllers/nextofkin.controller';
// import { MandateService } from '../transactions/services/mandate.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([UserNextOfKinEntity]),],
  providers: [NextOfKinService],
  controllers: [NextOfKinController],
  exports: [NextOfKinService],
})
export class NextOfKinModule { }