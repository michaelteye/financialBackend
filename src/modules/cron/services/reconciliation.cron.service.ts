import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Equal } from 'typeorm';
// import { SavingsGoalEntity } from "src/modules/savings-goal/entities/savings-goal.entity";
import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpException, Injectable, Logger } from '@nestjs/common';
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
import { NETWORK } from '../../main/entities/enums/network.enum';
import { DepositInputDto } from '../dtos/debit.dto';
import { PlATFORM } from '../../main/entities/enums/platform.enum';
import { UserPinService } from '../../userpin/services/userpin.service';
import { gen } from 'n-digit-token';
import { deprecate } from 'util';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { TRANSACTION_STATUS } from '../../enums/transaction.status';
import { CustomerAutoDebitEntity } from '../entities/customer.auto.debit.entity';
import { CRON_STATUS } from '../constants/cron.status';
import { uuid } from 'uuidv4';
import { InterestPaymentService } from '../../interest/services/interest-payment.service';
import { STATUS } from '../../auth/entities/enums/status.enum';
import { HttpRequestService } from 'src/modules/shared/services/http.request.service';

Injectable();
export class ReconcileAccountCronService extends HttpRequestService {
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    // @InjectRepository(SavingsGoalEntity)
    // private savingGoalRepository: Repository<SavingsGoalEntity>,
    // private accountGoalRepository: Repository<AccountEntity>,
    // @InjectSchedule() private readonly schedule: Schedule
    private interestPaymentService: InterestPaymentService,
    private notificationService: NotificationService,
    private transaction: TransactionService, //private readonly logger = new Logger('CronService')
  ) {
    super();
  }

  /**
   *
   * TODO Write comments on each of the functions
   */
  @Cron('*/3 * * * *')
  async deactivateDormantAccounts() {
    this.logger.log('------- RECONCILIATION CRON ---------');

    await this.getAllLegibleAccountsToDeactivate();
  }

  @Cron('*/2 * * * *')
  async retryFailedDepositReconciliation() {
    this.logger.log('------- DEPOSIT RETRY RECONCILIATION CRON ---------');

    await this.getAllFailedTransactionDepositAndUpdate();
  }

  async getAllLegibleAccountsToDeactivate() {
    //

    const query = `SELECT id, amount, "userId", "transactionId", "userRef", "senderPhone", "recipientPhone", "fromAccountId", "toAccountId", narration, "transactionStatus", platform, "transactionData", "transactionType", "accountId", "createdAt", "updatedAt"
	FROM public.transaction_entity where "transactionType" in ('DEPOSIT','WITHDRAWAL') and "transactionStatus"='PENDING' 
	and Date("createdAt") BETWEEN CURRENT_DATE - INTERVAL '2 days' AND CURRENT_DATE; `;

    let result = await this.em.query(query);

    const chunkSize = 3;
    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize);

      const res = await Promise.all(
        chunk.map(async (dataInput) => {
          await this.resolveTransactionCallback(dataInput);
        }),
      );
      console.log('resMain', res);
    }
  }

  async resolveTransactionCallback(data: any) {
    //  const  getAssociatedAccount = await this.em.findOne(AccountEntity,{where:{id:data.accountId }})
    /// CALL END POINT

    const payload = {
      transactionId: data.transactionId,
    };
    console.log('PAYLOAD>>>', payload);
    const url = `${this.cfg.payment.url}/status`;

    await this.post(url, payload);

    if (this.error) {
      this.logger.log('Error Calling payment gateway>>' + this.error);
      throw new HttpException(this.error, 400);
    }

    console.log('RESPONSE', this.response);

    try {
      if (this.response.status == 'NOT_FOUND') {
        console.log('TRANSACTION NOT FOUND');
      } else {
        const callBackData = {
          transactionRef: this.response.reference,
          status: this.response.status,
        };
        const res = await this.transaction.transactionCallback(callBackData);
        console.log('res after callback', res);
      }
    } catch (error) {
      console.log('FAILED TO CALL CALLBACK FUNCTION', error);
    }
  }

  async resolveTransactionCallbackRetry(data: any) {
    //  const  getAssociatedAccount = await this.em.findOne(AccountEntity,{where:{id:data.accountId }})
    /// CALL END POINT

    const payload = {
      transactionId: data.transactionId,
    };
    console.log('PAYLOAD>>>', payload);
    const url = `${this.cfg.payment.url}/status`;

    await this.post(url, payload);

    if (this.error) {
      this.logger.log('Error Calling payment gateway>>' + this.error);
      throw new HttpException(this.error, 400);
    }

    console.log('RESPONSE', this.response);

    try {
      if (this.response.status == 'NOT_FOUND') {
        console.log('TRANSACTION NOT FOUND');
      } else {
        if (this.response.status == 'SUCCESS') {
          if (data.transactionType == TRANSACTION_TYPE.DEPOSIT) {
            const query = `UPDATE public.transaction_entity
            SET  "transactionStatus"='PENDING'
            WHERE "transactionId"='${data.transactionId}'`;

            const res = await this.em.query(query);
            console.log('res>> after update deposit', res[0]);
          } else {
            const query2 = `UPDATE public.transaction_entity
          SET  "transactionStatus"='SUCCESS'
          WHERE "transactionId"='${data.transactionId}'`;

            const res2 = await this.em.query(query2);
            console.log('res>> after update withdrawal', res2[0]);
          }
        }
      }
    } catch (error) {
      console.log('FAILED TO CALL CALLBACK FUNCTION', error);
    }
  }

  async getAllFailedTransactionDepositAndUpdate() {
    const query = `
    SELECT id, amount, "userId", "transactionId", "userRef", "senderPhone", "recipientPhone", "fromAccountId", "toAccountId", narration, "transactionStatus", platform, "transactionData", "transactionType", "accountId", "createdAt", "updatedAt"
	FROM public.transaction_entity where "transactionType" in ('DEPOSIT','WITHDRAWAL') and "transactionStatus"='FAILED' 
	and Date("createdAt")=Date(now()) order by "createdAt" desc limit 200`;

    let result = await this.em.query(query);

    const chunkSize = 10;
    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize);

      const res = await Promise.all(
        chunk.map(async (dataInput) => {
          await this.resolveTransactionCallbackRetry(dataInput);
        }),
      );
      console.log('resMain', res);
    }
  }
}
