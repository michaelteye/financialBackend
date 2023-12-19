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
import {
  RoleAuthGuard,
  RoleAuth,
} from '../../../../src/modules/auth/guards/role-auth.guard';
import { AuthUserRole } from '../../../../src/modules/auth/types/auth-user.roles';
import { isUUID } from 'class-validator';
import { ReferralService } from '../services/referral.service';
import { ReferralDto } from '../dtos/referrals.dto';
import { ReferralEntity } from '../entities/referral.entity';
import { MixedAuthGuard } from '../../auth/guards/mixed-auth.guard';

@ApiTags('Referrals')
@ApiBearerAuth('JWT')
@Controller('users/referrals')
@UseGuards(MixedAuthGuard, RoleAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class ReferralController {
  constructor(private service: ReferralService) {}

  @RoleAuth(AuthUserRole.User)
  @Post()
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: ReferralDto,
  })
  async create(@Body() request: ReferralDto): Promise<ReferralEntity> {
    return await this.service.createReferral(request);
  }

  @RoleAuth(AuthUserRole.User)
  @Get('/:id')
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
    type: ReferralDto,
  })
  async getUserReferrals(@Param() params: any): Promise<ReferralEntity> {
    if (params.id && !isUUID(params.id))
      throw new Error(
        `Invalid id, UUID format expected but received ${params.id}`,
      );
    return await this.service.getUserReferrals(params.id);
  }



 
}
///feature/admin