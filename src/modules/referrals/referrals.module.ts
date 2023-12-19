import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ReferralEntity } from './entities/referral.entity';
import { ReferralService } from './services/referral.service';
import { ReferralController } from './controllers/referral.controller';
import { LeaderBoardController } from './controllers/leaderboard.controller';
import { ReferralCampaignEntity } from './entities/referral-campaign.entity';
// import { MandateService } from '../transactions/services/mandate.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([ReferralEntity,ReferralCampaignEntity]),],
  providers: [ReferralService],
  controllers: [ReferralController,LeaderBoardController],
  exports: [ReferralService],
})
export class ReferralModule { }
