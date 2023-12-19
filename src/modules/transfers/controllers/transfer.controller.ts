import {
  Body,
  Controller,
  Post,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import {
  TransferToAccountDto,
  IntraTransferDto,
} from '../../account/dtos/transfer-account.dto';

import { UserDto } from '../../auth/dto/user.dto';
import { MixedAuthGuard } from '../../auth/guards/mixed-auth.guard';
import {
  RoleAuthGuard,
  RoleAuth,
} from '../../auth/guards/role-auth.guard';
import { AuthUserRole } from '../../auth/types/auth-user.roles';
import { TransferService } from '../services/transfer.service';
import { Throttle } from '@nestjs/throttler';
import { ThrottleExceptionFilter } from '../../../exceptions/throttle.exception';


@ApiTags('Transfer')
@ApiBearerAuth('JWT')
@Controller()
@UseGuards(MixedAuthGuard, RoleAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class TransferController {
  constructor(private service: TransferService) { }

  //@UseFilters(new ThrottleExceptionFilter())
  //@Throttle(1, 60)
  @RoleAuth(AuthUserRole.User)
  @Post('user/transfer')
  @ApiResponse({
    status: 201,
    description: 'Transfer to user account was successful.',
  })
  async transferToUserAccount(
    @Body() input: TransferToAccountDto,
  ): Promise<any> {
    return await this.service.transferToUserAccount(input);
  }



  //@UseFilters(new ThrottleExceptionFilter())
  //@Throttle(1, 60)
  @RoleAuth(AuthUserRole.User)
  @Post('user/intratransfer')
  @ApiResponse({
    status: 201,
    description: 'Transfer between user own accounts e.g. Wallet to SavingsGoal, SavingsGoal to wallet',
  })
  async intraAccountTransfer(
    @Body() input: IntraTransferDto,
  ): Promise<any> {
   return  await this.service.intraAccountTransfer(input);
  }
}
