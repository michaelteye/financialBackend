import {
  Body,
  All,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Controller,
  Logger,
  Post,
  Param,
  Get,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, OmitType } from '@nestjs/swagger';
import { AuthUserRole } from '../../auth/types/auth-user.roles';

import { MixedAuthGuard } from '../../auth/guards/mixed-auth.guard';
import { RoleAuth, RoleAuthGuard } from '../../auth/guards/role-auth.guard';
import { VasDto } from '../dtos/vas.dto';

import { VasService } from '../services/vas.service';




@ApiTags('VAS')
@ApiBearerAuth('JWT')
@Controller('users/vas')
@UseGuards(MixedAuthGuard, RoleAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))

export class VasController {
  private readonly logger = new Logger('TransactionController');
  constructor(private service: VasService,
   // private historyService: TransactionHistoryService
   ) { }



  @RoleAuth(AuthUserRole.User)
  @Post('/buy')
  // @ApiResponse({
  //   status: 201,
  //   description: 'VAS Initiated Successfully.',
  // })
  async buy(@Body() request: VasDto): Promise<any> {
    return await this.service.buy(
      request
    );
  }

  @RoleAuth(AuthUserRole.User)
  @Get('/movies')
  async getMovies(): Promise<any> {
    return await this.service.getMovies(
    );
  }



  @RoleAuth(AuthUserRole.User)
  @Get('/getBillers')
  @ApiResponse({
    status: 201,
    description: 'VAS Initiated Successfully.',
  })
  async getBillers(): Promise<any> {
    return await this.service.getBillers();
  }


  @RoleAuth(AuthUserRole.User)
  @Get('/getFormFields/:billerId')
  @ApiResponse({
    status: 201,
    description: 'VAS Initiated Successfully.',
  })
  async getFormFields(@Param("billerId") billerId: string): Promise<any> {
    return await this.service.getFormFields(billerId);
  }


  
 

 

}