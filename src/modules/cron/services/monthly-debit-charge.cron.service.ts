import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Equal } from 'typeorm';
// import { SavingsGoalEntity } from "src/modules/savings-goal/entities/savings-goal.entity";
import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { Module } from '@nestjs/common';
// import { InjectSchedule, Schedule, Timeout} from "nest-schedule";
import { GOAL_STATUS } from '../../auth/entities/enums/goal-status.enum';
import {
  isBefore,
  isEqual,
  subMonths,
  intervalToDuration,
  parseISO,
  format,
  differenceInDays,
} from 'date-fns';
import { AccountEntity } from '../../account/entities/account.entity';
import { NotificationService } from '../../notifications/services/notification.service';
// import {Injectable} from '@nestjs/common'
import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { LessThanOrEqual, LessThan } from 'typeorm';
import { number } from 'joi';
import { NOTIFICATIONS } from '../../enums/notification.providers';
import { AccountService } from '../../account/services/account.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { DepositDto } from '../../ussdapi/dtos/deposit.dto';
import { MandateEntity } from '../../transactions/entities/mandate.entity';

import { MandateCategory } from '../../enums/mandate.category.enum';
import { MandateStatus } from '../../enums/mandate.status.enum';
import { FREQUENCY_TYPE } from '../../main/entities/enums/savingsfrequency.enum';
import { FrequencyTypes } from '../../enums/frequency-types.enum';
import { IntraTransferDto } from '../../account/dtos/transfer-account.dto';
import { TransferService } from '../../transfers/services/transfer.service';
import { SYSTEM_ACCOUNT } from '../../transfers/services/systemaccts.constants';

Injectable();
export class MonthlyDebitChargeCronService {
  private readonly logger = new Logger('CronService');
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    // @InjectRepository(SavingsGoalEntity)
    // private savingGoalRepository: Repository<SavingsGoalEntity>,
    // private accountGoalRepository: Repository<AccountEntity>,
    // @InjectSchedule() private readonly schedule: Schedule
    private notificationService: NotificationService,
    private accountService: AccountService,
    private transferService: TransferService,
  ) {}

  /**
   *
   * TODO Write comments on each of the functions
   */

  /**
   *
   * Unlock Bezo-Lock accounts to allow withdrawals with fees
   */
  @Cron(CronExpression.EVERY_6_MONTHS) // Run this every week.
  async autodeductFromPrimaryDaily() {
    ///THESE USERS DOES NOT INCLUDE BEZOSTAFFF
    let mandateSubscribers =
      await this.getUsersWhoTransacatedWithInPreviousMonth();

    console.log('mandateSubscribers', mandateSubscribers);

    const chunkSize = 5;
    for (let i = 0; i < mandateSubscribers.length; i += chunkSize) {
      const chunk = mandateSubscribers.slice(i, i + chunkSize);

      const res = await Promise.all(
        chunk.map(async (dataInput) => {
          await this.debitSubscriberPrimaryAccount(dataInput);
        }),
      );
    }
  }

  async getUsersWhoTransacatedWithInPreviousMonth(): Promise<any> {
    // GET ALL MANDATE THAT ARE ACTIVE AND HAS NOT ENDED
    const query = `select "userId",SUM("amount") as "totalSum" from transaction_entity where "userId" in(
        SELECT "userId" FROM public.auth_user_entity  where "roles"<>'{User,BezoStaff}')
        and "transactionStatus"='SUCCESS' and "transactionType"='TRANSFER' and "createdAt" >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
      AND "createdAt" < DATE_TRUNC('month', CURRENT_DATE)
        or "transactionStatus"='SUCCESS' and "transactionType"='WITHDRAWAL' 
         and "createdAt" >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
      AND "createdAt" < DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY "userId" 
        
    `;

    return await this.em.query(query);
  }

  async debitSubscriberPrimaryAccount(data: any): Promise<any> {
    /// GET SUBSCRIBER PRIMARY ACCOUNT

    if (data.totalSum >= 100) {
      const userPrimary = await this.em.findOne(AccountEntity, {
        where: {
          name: 'Primary',
          userId: data.userId,
        },
      });

      const goalAccount = await this.em.findOne(AccountEntity, {
        where: {
          id: data.accountId,
        },
      });

      /// check if balance can absolve deduction

      if (userPrimary.balance >= 15) {
        const transferToServiceAccount = new IntraTransferDto();
        transferToServiceAccount.amount = 5;
        transferToServiceAccount.fromAccountId = userPrimary.id;
        transferToServiceAccount.toAccountId = (
            await this.accountService.getAccountbyType(
              SYSTEM_ACCOUNT.MONTHLY_SERVICE_FEES,
            )
          ).id;

        await this.transferService.intraAccountTransferWithoutAuthorization(
            transferToServiceAccount,
        );

        //SEND SMS TO USER AFTER TRANSFER
        // await this.notificationService.sendSms({
        //   to: data.phoneNumber,
        //   sms: `Transfered ${data.amount} from your Primary Account to your goal ${goalAccount.name}. (Auto Debit)`,
        // });
      }
    }
  }
}
