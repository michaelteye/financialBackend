import {
  Body,
  Controller,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import {
  AdminTransferToAccountDto,
  AdminTransferResponseDto,
  TransferToAccountDto,
  AdminDebitCreditAccountDto,
} from '../../account/dtos/transfer-account.dto';

import { UserDto } from '../../auth/dto/user.dto';
import { MixedAuthGuard } from '../../auth/guards/mixed-auth.guard';
import {
  RoleAuthGuard,
  RoleAuth,
} from '../../auth/guards/role-auth.guard';
import { AuthUserRole } from '../../auth/types/auth-user.roles';
import { TransferCoreResponseDto } from '../dto/TransferCoreResponseDto';
import { ValidateAdminTransactionAuthGuard } from '../guards/validate-adminapi.guard';
import { TransferService } from '../services/transfer.service';



@Controller()
@UsePipes(new ValidationPipe({ transform: true }))
export class AdminTransferController {
  constructor(private service: TransferService) { }

  @Post('admin/transfer')
  @UseGuards(ValidateAdminTransactionAuthGuard)
  async adminTransfer(
    @Body() input: AdminTransferToAccountDto,
  ): Promise<TransferCoreResponseDto> {
    return await this.service.adminTransferToUserAccount(input);
  }


  @Post('admin/debitCredit')
  @UseGuards(ValidateAdminTransactionAuthGuard)
  async adminDebitCredit(
    @Body() input: AdminDebitCreditAccountDto,
  ): Promise<TransferCoreResponseDto> {
    return await this.service.adminDebitCreditUserAccount(input);
  }
}
