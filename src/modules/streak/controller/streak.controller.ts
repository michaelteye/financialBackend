import { plainToClass } from 'class-transformer';
import { isUUID } from 'class-validator';
import { TransactionEntity } from '../..//transactions/entities/transaction.entity';
import { StreakService } from './../service/streak.service';
import { RoleAuth, RoleAuthGuard } from './../../auth/guards/role-auth.guard';
import { MixedAuthGuard } from './../../auth/guards/mixed-auth.guard';
import { Body, Controller, Get, Param, Patch, Post, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { ApiBearerAuth, ApiParam, ApiResponse } from "@nestjs/swagger";
import { StreakRecordResponseDto } from '../dtos/streak.dto';
import { AuthUserRole } from '../..//auth/types/auth-user.roles';
import { DepositInputDto } from '../..//transactions/dtos/deposit.dto';
import { TRANSACTION_TYPE } from '../..//enums/transaction-type.enum';
import { TransactionService } from '../..//transactions/services/transaction.service';

@ApiBearerAuth('JWT')
@Controller('users/streak')
@UseGuards(MixedAuthGuard, RoleAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class StreakController {
  constructor(private service: StreakService, private transactionService: TransactionService) { }

  @RoleAuth(AuthUserRole.User)
  @Get(":id")
  @ApiResponse({
    status: 200,
    description: 'Get streak of user',
    type: StreakRecordResponseDto
  })
  get(
    @Param() params: any
  ) {
    if (params.id && !isUUID(params.id))
      throw new Error(
        `Invalid id, UUID format expected but received ${params.id}`,
      );
    const Streak = this.service.getUsersStreak(params.id);

    return plainToClass(StreakRecordResponseDto, Streak)
  }


  @RoleAuth(AuthUserRole.User)
  @Patch('/update/:id')
  @ApiResponse({ status: 200, type: StreakRecordResponseDto })
  @ApiParam({ name: 'id', required: true, type: String })
  async updateFavourite(
    @Body() dto: { isStreak: boolean },
    @Param() params: any
  ): Promise<StreakRecordResponseDto> {
    if (params.id && !isUUID(params.id))
      throw new Error(
        `Invalid id, UUID format expected but received ${params.id}`,
      );
    const savingsStreak = await this.service.updateStreak(params.id);
    return plainToClass(StreakRecordResponseDto, savingsStreak);
  }

}
