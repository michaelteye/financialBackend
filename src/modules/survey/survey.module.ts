import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SurveyEntity } from './entity/survey.entity';
import { SurveyService } from './services/survey.service';
import { SurveyController } from './controllers/survey.controller';


@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([SurveyEntity])],
  providers: [SurveyService],
  controllers: [SurveyController,],
  exports: [SurveyService],
})
export class SurveyModule { }