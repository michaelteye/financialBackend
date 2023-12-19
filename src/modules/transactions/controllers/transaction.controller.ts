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
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, OmitType, ApiParam } from '@nestjs/swagger';
import { AuthUserRole } from '../../auth/types/auth-user.roles';

import { MixedAuthGuard } from '../../auth/guards/mixed-auth.guard';
import { RoleAuth, RoleAuthGuard } from '../../auth/guards/role-auth.guard';
import { DepositInputDto } from '../dtos/deposit.dto';
import { TransactionService } from '../services/transaction.service';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { TransactionEntity } from '../entities/transaction.entity';
import { TransactionHistoryService } from '../services/transaction.history.service';
import { TransactionHistoryItemDto, TransactionHistoryWithCountItemDto } from '../dtos/transactionhistoryitem.dto';
import { SavingsGoalTransactionHistoryRequest, TransactionHistoryRequest } from '../dtos/transactionhistoryrequest.dto';
import { TransactionRecordResponse } from '../dtos/tranactionrecords.dto';
import { Throttle } from '@nestjs/throttler';
import { ThrottleExceptionFilter } from '../../../exceptions/throttle.exception';
import { isUUID } from 'class-validator';

@ApiTags('Transactions')
@ApiBearerAuth('JWT')
@Controller('transactions')
@UseGuards(MixedAuthGuard, RoleAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class TransactionController {
  private readonly logger = new Logger('TransactionController');
  constructor(private service: TransactionService,
    private historyService: TransactionHistoryService) { }

  @RoleAuth(AuthUserRole.User)
  @Post('/deposit')
  @ApiResponse({
    status: 201,
    description: 'Transaction Initiated Successfully.',
  })
  async deposit(@Body() request: DepositInputDto): Promise<any> {
    return await this.service.deposit(
      request
    );
  }

  @RoleAuth(AuthUserRole.User)
  @Post('/deposit/paystack')
  @ApiResponse({
    status: 201,
    description: 'Transaction Initiated Successfully.',
  })
  async depositPaystack(@Body() request: DepositInputDto): Promise<any> {
    return await this.service.depositPaystack(
      request
    );
  }

  ///VERIFY PAYMENT
  @RoleAuth(AuthUserRole.User)
  @Post('/deposit/paystack/verify')
  @ApiResponse({
    status: 201,
    description: 'Transaction Verified Successfully.',
  })
  async depositPaystackVerify(@Body() request): Promise<any> {
    try {
     const res= await this.service.depositPaystackVerify(
        request
      );
      return res
    } catch (error) {
      throw new Error(JSON.stringify(error))
      
    } 
  }



  @RoleAuth(AuthUserRole.User)
  @Patch('/deposit/paystack/cancel/:id')
  @ApiParam({ name: 'id', required: true, type: String })
  @ApiResponse({
    status: 200,
  })
  async delete(@Param() params: any): Promise<any> {
    if (params.id && !isUUID(params.id))
      throw new Error(
        `Invalid id, UUID format expected but received ${params.id}`,
      );
    await this.service.cancelDepositWithPaystack(params.id);
  }

  @UseFilters(new ThrottleExceptionFilter())
  @Throttle(100, 60)
  @RoleAuth(AuthUserRole.User)
  @Post('/withdrawal')
  @ApiResponse({
    status: 201,
    description: 'Transaction Initiated Successfully.',
  })
  async withdrawal(@Body() request: DepositInputDto): Promise<any> {
    return await this.service.withdrawal(
      request
    );
  }

  @RoleAuth(AuthUserRole.User)
  @Get('/history')
  @ApiResponse({
    status: 201,
    description: 'Primary Account Transaction History.',
    type: [TransactionHistoryItemDto],
  })
  async history(@Query('pageNumber') pageNumber: number, @Query('itemsPerPage') itemsPerPage: number): Promise<TransactionHistoryWithCountItemDto> {
    return await this.historyService.getPrimaryAccountTransactionHistory(itemsPerPage, pageNumber);
  }


  @RoleAuth(AuthUserRole.User)
  @Get('/all')
  @ApiResponse({
    status: 200,
    description: 'Transactions for a user',
    type: [TransactionRecordResponse],
  })
  async getTransactionsFromAllUserAccounts(@Query('pageNumber') pageNumber: number, @Query('itemsPerPage') itemsPerPage: number, @Query('type') type: string,): Promise<TransactionHistoryWithCountItemDto> {
    return await this.historyService.getTransactionsFromAllUserAccounts(pageNumber, itemsPerPage, type);
  }

  @RoleAuth(AuthUserRole.User)
  @Get('/history/savingsgoal/:savingsGoalId')
  @ApiResponse({
    status: 201,
    description: 'Primary Account Transaction History.',
    type: [TransactionHistoryItemDto],
  })
  async savingsGoalTransactionHistory(@Param('savingsGoalId') goalId: string, @Query('pageNumber') pageNumber: number,
    @Query('itemsPerPage') itemsPerPage: number, @Query('type') transactionType): Promise<TransactionHistoryWithCountItemDto> {
    return await this.historyService.getSavingsGoalTransactionHistory(goalId, itemsPerPage, pageNumber, transactionType);
  }

  @RoleAuth(AuthUserRole.User)
  @Post('/history/bydate')
  @ApiResponse({
    status: 201,
    description: 'Get Account Transaction History By Date Range.',
    type: [TransactionHistoryItemDto],
  })
  async historyByDate(request: TransactionHistoryRequest): Promise<TransactionHistoryItemDto[]> {
    return await this.historyService.getAccountHistoryByAccountIdDateRange(request);
  }

  @RoleAuth(AuthUserRole.User)
  @Post('/history/savingsgoal/bydate')
  @ApiResponse({
    status: 201,
    description: 'Get Account Transaction History By Date Range.',
    type: [TransactionHistoryItemDto],
  })
  async savingsGoalHistoryByDate(request: SavingsGoalTransactionHistoryRequest): Promise<TransactionHistoryItemDto[]> {
    return await this.historyService.getSavingsGoalTransactionHistoryByDate(request);
  }

  @RoleAuth(AuthUserRole.User)
  @Get('status/:ref')
  @ApiResponse({
    status: 201,
    description: 'Get Transaction Status.',
  })
  async transactionStatus(
    @Param('ref') ref: string,
  ): Promise<TransactionEntity> {
    return await this.service.getTransactionStatus(ref);
  }
}