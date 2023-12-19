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

Injectable();
export class DeactivateDormantAccountsCronService {
  private readonly logger = new Logger('CronService');
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    // @InjectRepository(SavingsGoalEntity)
    // private savingGoalRepository: Repository<SavingsGoalEntity>,
    // private accountGoalRepository: Repository<AccountEntity>,
    // @InjectSchedule() private readonly schedule: Schedule
    private interestPaymentService: InterestPaymentService,
    private notificationService: NotificationService,
  ) {}

  /**
   *
   * TODO Write comments on each of the functions
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async deactivateDormantAccounts() {
    this.logger.log('------- DEACTIVATE DORMANT ---------');

    await this.getAllLegibleAccountsToDeactivate()
  }

  async getAllLegibleAccountsToDeactivate() {
    //

    const query = `
        SELECT concat("firstName",' ',"lastName") as "fullName","phone","email","social",
        "referralCode", "dateOfBirth" as "Date_of_birth","gender","occupation",
        "level","region",u."id" as "userId","total_balance","lastLoginDate", EXTRACT(DAY FROM AGE(NOW(), au."lastLoginDate")) 
            + EXTRACT(MONTH FROM AGE(NOW(), au."lastLoginDate")) * 30 AS number_of_days
                FROM public.user_entity u
                INNER JOIN (
                         SELECT "userId", SUM(balance) AS total_balance
                        FROM public.account_entity
                        GROUP BY "userId" 
                ) a ON u."id" = a."userId"
                left JOIN  auth_user_entity au on
                au."userId"=u.id
                order by "total_balance" desc 
       `;

    let result = await this.em.query(query);

    result = result.filter((r:any)=>r.number_of_days>=365)

    const chunkSize = 20;
    for (let i = 0; i < result.length; i += chunkSize) {
    
        const chunk = result.slice(i, i + chunkSize);

        const res = await Promise.all(
          chunk.map(async (dataInput) => {
            await this.deactivateAccounts(dataInput);
          }),
        );
        console.log('resMain', res);
      }
    
  }

  async deactivateAccounts(data: any) {
    //  const  getAssociatedAccount = await this.em.findOne(AccountEntity,{where:{id:data.accountId }})

    if (
      data.total_balance <= 5 &&
      data.number_of_days >= 365 &&
      data.lastLoginDate != null
    ) {
      const authData = await this.em.findOne(AuthUserEntity, {
        where: {
          userId: data.userId,
        },
      });

      authData.accountStatus = STATUS.disabled;
      await this.em.save(authData);
      //console.log("")
        this.notificationService.sendSms({
          to: data.phone,
          sms: `Your account has been deactivated due to inactivity. Kindly visit our customer care on 0599699469 to re-activate your account`,
          // provider: 'nalo',
        });

      return true;
    }
  }
}
