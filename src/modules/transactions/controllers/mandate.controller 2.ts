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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, OmitType } from '@nestjs/swagger';
import { AuthUserRole } from '../../auth/types/auth-user.roles';
import { MixedAuthGuard } from '../../auth/guards/mixed-auth.guard';
import { RoleAuth, RoleAuthGuard } from '../../auth/guards/role-auth.guard';
import { CreateMandateDto, UserMandateListItemDto } from '../dtos/createmandate.dto';
import { MandateService } from '../services/mandate.service';

@ApiTags('AutoDeduct')
@ApiBearerAuth('JWT')
@Controller('autodeduct')
@UseGuards(MixedAuthGuard, RoleAuthGuard)
export class MandateController {
  private readonly logger = new Logger('TransactionController');
  constructor(private service: MandateService
  ) { }


  @RoleAuth(AuthUserRole.User)
  @Get('/getmymandates')
  @ApiResponse({
    status: 201,
    description: 'Create Auto deduct mandate.',
  })
  async getAllUserMandates(): Promise<UserMandateListItemDto[]> {
    return await this.service.findAll()
  }

  @RoleAuth(AuthUserRole.User)
  @Post('/createmandate')
  @ApiResponse({
    status: 201,
    description: 'Create Auto deduct mandate.',
  })
  async createAutoDeductMandate(@Body() request: CreateMandateDto): Promise<any> {
    return await this.service.create(request)
  }

  @RoleAuth(AuthUserRole.User)
  @Get('/cancelmandate/:mandateId')
  @ApiResponse({
    status: 201,
    description: 'Mandate successfully Cancelled.',
  })
  async cancelAutoDeductMandate(@Param("mandateId") mandateId: string): Promise<any> {
    return await this.service.deactivate(mandateId);
  }

}