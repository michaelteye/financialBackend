import {
    Controller,
    UseGuards,
    UsePipes,
    ValidationPipe,
    Post,
    Body,
    Get,
    Param,
    Patch,
  } from '@nestjs/common';
  import { ApiBearerAuth, ApiTags, ApiResponse, ApiParam } from '@nestjs/swagger';


  import { ReferralService } from '../services/referral.service';
 
  
  @ApiTags('Referrals')

  @Controller('users')

  export class LeaderBoardController {
    constructor(private service: ReferralService) {}
  
   
  
    // GET LEADERBOARD INFO

    @Get('/leaderboard')
    async getleaderBoard(): Promise<any> {
      return await this.service.getleaderBoard();
    }

    @Get('/staff/leaderboard')
    async getBezoStaffleaderBoard(): Promise<any> {
      return await this.service.getBezoStaffleaderBoard();
    }

    @Get('/campus/mavericks')
    async getCampusMaverickReferral(): Promise<any> {
      return await this.service.getCampusMaverickReferral();
    }

    


    @Get('/iosandroid')
    async getSignUpAndroidIos(): Promise<any> {
      return await this.service.getSignUpAndroidIos();
    }

    @Get('/all/referred')
    async getUserReferrerAndReferee(): Promise<any> {
      return await this.service.getUserReferrerAndReferee();
    }

    @Get('/referrals/verify/:code')
    @ApiParam({ name: 'code', required: true, type: String })
    async verifyReferralCode(@Param() code:string): Promise<any> {
      return await this.service.verifyReferralCode(code);
    }


  

  }
  