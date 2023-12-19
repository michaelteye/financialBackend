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

Injectable();
export class AutoDebitFromPrimaryCronService {
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
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Run this every week.
  async autodeductFromPrimaryDaily() {
    let mandateSubscribers = await this.getAutoDebitFromPrimarySubscribers(
      FREQUENCY_TYPE.daily,
    );

    console.log('mandateSubscribers', mandateSubscribers);

    const chunkSize = 2;
    for (let i = 0; i < mandateSubscribers.length; i += chunkSize) {
      const chunk = mandateSubscribers.slice(i, i + chunkSize);

      const res = await Promise.all(
        chunk.map(async (dataInput) => {
          await this.debitSubscriberPrimaryAccount(dataInput);
        }),
      );
    }
  }

  @Cron(CronExpression.EVERY_WEEK) // Run this every week.
  async autodeductFromPrimaryWeekly() {
    let mandateSubscribers = await this.getAutoDebitFromPrimarySubscribers(
      FREQUENCY_TYPE.weekly,
    );

    console.log('mandateSubscribers', mandateSubscribers);

    const chunkSize = 2;
    for (let i = 0; i < mandateSubscribers.length; i += chunkSize) {
      const chunk = mandateSubscribers.slice(i, i + chunkSize);

      const res = await Promise.all(
        chunk.map(async (dataInput) => {
          await this.debitSubscriberPrimaryAccount(dataInput);
        }),
      );
    }
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT) // Run this every week.
  async autodeductFromPrimaryMonthly() {
    let mandateSubscribers = await this.getAutoDebitFromPrimarySubscribers(
      FREQUENCY_TYPE.monthly,
    );

    console.log('mandateSubscribers', mandateSubscribers);

    const chunkSize = 2;
    for (let i = 0; i < mandateSubscribers.length; i += chunkSize) {
      const chunk = mandateSubscribers.slice(i, i + chunkSize);

      const res = await Promise.all(
        chunk.map(async (dataInput) => {
          await this.debitSubscriberPrimaryAccount(dataInput);
        }),
      );
    }
  }

  async getAutoDebitFromPrimarySubscribers(frequency: any): Promise<any> {
    // GET ALL MANDATE THAT ARE ACTIVE AND HAS NOT ENDED
    const query = `SELECT *
    FROM public.mandate_entity
    WHERE "endDate" > CURRENT_DATE AND frequency='${frequency}'  and status='${MandateStatus.ACTIVE}' and category='${MandateCategory.BEZOPRIMARY}' `;

    return await this.em.query(query);
  }

  async debitSubscriberPrimaryAccount(data: MandateEntity): Promise<any> {
    /// GET SUBSCRIBER PRIMARY ACCOUNT
    const userPrimary = await this.em.findOne(AccountEntity, {
      where: {
        name: 'Primary',
        userId: data.userId,
      },
    });

    // const goalAccount = await this.em.findOne(AccountEntity, {
    //   where: {
    //     id: data.accountId,
    //     userId:data.userId
    //   },
    // });

     const queryAccount= `SELECT * from account_entity where 
     "id"='${data.accountId}' and "userId"='${data.userId}'`

    const resp= await this.em.query(queryAccount)
    /// check if balance can absolve deduction

     if(resp.length>0){

    const checker = Number(userPrimary.balance) - Number(data.amount);
    console.log('checker', checker);
    if (checker > 0) {
      // if (goalAccount) {
        const transToPrimary = new IntraTransferDto();
        transToPrimary.amount = data.amount;
        transToPrimary.fromAccountId = userPrimary.id;
        transToPrimary.toAccountId = resp[0].id;

        await this.transferService.intraAccountTransferWithoutAuthorization(
          transToPrimary,
        );

        //SEND SMS TO USER AFTER TRANSFER
        await this.notificationService.sendSms({
          to: data.phoneNumber,
          sms: `Transfered ${data.amount} from your Primary Account to your goal ${resp[0].name}. (Auto Deduct)`,
        });
      //}
    }
  }
  }
}
