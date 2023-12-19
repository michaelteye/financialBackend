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
import { SEQUENCE_COUNT } from '../constants/sequence.count';

Injectable();
export class SavingGoalCronService {
  private readonly logger = new Logger('CronService');
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    // @InjectRepository(SavingsGoalEntity)
    // private savingGoalRepository: Repository<SavingsGoalEntity>,
    // private accountGoalRepository: Repository<AccountEntity>,
    // @InjectSchedule() private readonly schedule: Schedule
    private notificationService: NotificationService,
    private accountService: AccountService,
    private transactionService: TransactionService,
  ) {}

  /**
   *
   * TODO Write comments on each of the functions
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resolveInactiveUsersWithinTwoMonths() {
    this.logger.log(
      '------- Inactive Customers within two months running ---------',
    );
    const data = await this.getInactiveUsers();
    this.logger.log(data);
    if (data.length != 0) {
      for (let k = 0; k < data.length; k++) {
        const info = await this.getCustomerInfoById(data[k].userId);
        await this.notificationService.sendSms({
          to: [info[k].phone],
          sms: `Dear ${info[k].firstName}, your account has been inactive for the past two months. 
                    Kindly login to Bezosusu and enjoy the amazing experience. Thank you.`,
        });
      }
    }
  }

  // @Cron(CronExpression.EVERY_DAY_AT_10AM)
  // async autodepositPrompt() {
  //   this.logger.log('------- Auto Debit Prompt running ---------');
  //   try {
  //     const data = await this.getCustomersWithZeroBalance();

  //     if (data.length != 0) {
  //       for (let k = 0; k < data.length; k++) {
  //         let sequenceManager = await this.manageAutoDebitStatus(
  //           data[k].userid,
  //           data[k].phone,
  //         );

  //         if (
  //           sequenceManager.status === CRON_STATUS.INPROGRESS &&
  //           sequenceManager.count < 5
  //         ) {
  //           // Send the customer an SMS before sending the auto debit prompt.
  //           let firstName = data[k].firstName
  //             ? data[k].firstName
  //             : 'Bezo Customer';
  //           let mobile = data[k].phone;

  //           await this.notificationService.sendSms({
  //             to: [mobile],
  //             sms: `Dear ${firstName}, Kindly make an initial deposit of 10GHS to activate your account. Thank you!`,
  //           });

  //           /* let res = await this.deposit(
  //             data[k].userid,
  //             data[k].accountid,
  //             data[k].phone,
  //             10,
  //             data[k].network,
  //             'Auto Debit',
  //           );
  //           this.logger.log(res); */
  //         }
  //       }
  //     }
  //   } catch (err) {
  //     this.logger.error(err);
  //   }
  // }

  /**
   *
   * TODO Write comments on each of the functions
   */
  //@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Run this every week.
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async resolveCompletedSavingsGoals() {
    let savingsGoals = await this.getSavingsGoalsInProgressEndingToday();
    console.debug('------- Completed Savings Goal Cron Running ---------');

    const chunkSize = 5;
    for (let i = 0; i < savingsGoals.length; i += chunkSize) {
      const chunk = savingsGoals.slice(i, i + chunkSize);
      const res = await Promise.all(
        chunk.map(async (dataInput) => {
          await this.updateSavingGoal(dataInput);
        }),
      );
    }
    // for (let k = 0; k < savingsGoals.length; k++) {
    //   let savingsGoal = savingsGoals[k];
    //   let account = await this.accountService.getUserAccount(
    //     savingsGoal.accountId,
    //   );
    //   account.allowWithdrawalWithFees = false;
    //   account.allowWithdrawal = true;
    //   await this.em.save(account);
    //   if (account.balance >= savingsGoal.amountToRaise) {
    //     savingsGoal.goalStatus = GOAL_STATUS.COMPLETED;
    //     this.logger.log(account.userId);
    //     this.notificationService.sendSms({
    //       to: ['233594951335'],
    //       sms:
    //         'Hello Customer, you have successfully completed' +
    //         ' your savings goal. You are now entitled to withdrawing your funds.',
    //     });
    //   } else {
    //     savingsGoal.goalStatus = GOAL_STATUS.FAILED;
    //   }
    //   await this.em.save(savingsGoal);
    //   //await this.calculateSavingsGoalsLikelyToFail(savingsGoal, account);
    // }
  }

  async updateSavingGoal(savingsGoal: SavingsGoalEntity): Promise<any> {
    let account = (await this.accountService.getUserAccount(
      savingsGoal.accountId,
    )) as unknown as AccountEntity;

    account.allowWithdrawalWithFees = false;
    account.allowWithdrawal = true;
    console.log('account', account);
    await this.em.save(account);
    if (account.balance >= savingsGoal.amountToRaise) {
      savingsGoal.goalStatus = GOAL_STATUS.COMPLETED;
      this.logger.log(account.userId);
      // this.notificationService.sendSms({
      //   to: ['233594951335'],
      //   sms:
      //     'Hello Customer, you have successfully completed' +
      //     ' your savings goal. You are now entitled to withdrawing your funds.',
      // });
    } else {
      savingsGoal.goalStatus = GOAL_STATUS.FAILED;
    }

    console.log('savingsGoal', savingsGoal);
    await this.em.update(
      SavingsGoalEntity,
      { id: savingsGoal.id },
      savingsGoal,
    );
  }

  /**
   *
   * Unlock Bezo-Lock accounts to allow withdrawals with fees
   */
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Run this every week.
  //  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async unlockBezoLockSavingsGoalsForWithDrawal() {
    // await this.em.query(`select s."accountId" from savings_goal_entity s
    //     inner join account_entity a on s."accountId"=a.id
    //     inner join account_type_entity at on a."accountTypeId"=at.id
    //     where at.alias='bezo-lock' and s."goalStatus"='INPROGRESS'
    //     and s."createdAt" > NOW() - INTERVAL '1 month'`);

    let savingsGoals =
      await this.getInProgressBezoLockSavingsGoalsOlderThanAMonth();

    const chunkSize = 5;
    for (let i = 0; i < savingsGoals.length; i += chunkSize) {
      const chunk = savingsGoals.slice(i, i + chunkSize);

      const res = await Promise.all(
        chunk.map(async (dataInput) => {
          await this.UpdateBezoLockAccounts(dataInput);
        }),
      );

      //console.log("res",res)
    }
  }

  async UpdateBezoLockAccounts(data): Promise<any> {
    let lockedSavingsGoal = data;
    //Release locked account to allow Withdrawals with fees
    await this.em.query(
      `update public.account_entity set  "allowWithdrawal"=true ,"allowWithdrawalWithFees"=true where id='${lockedSavingsGoal.accountId}'`,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resolveCustomerCelebration() {
    console.debug(
      '------- Customers Celebrating Birthdays Today Running ---------',
    );
    const customers = await this.getCustomersWhoseBirthdaysFallToday();
    for (let k = 0; k < customers.length; k++) {
      let phoneNumber = customers[k].phone;
      let customerName = customers[k].firstName;
      this.notificationService.sendSms({
        to: [phoneNumber],
        sms: `Hello ${customerName}, Bezo wishes you a happy birthday on this special day. 
        Happy birthday to you from the Bezo Team`,
      });
    }
  }

  async getInactiveUsers() {
    return await this.em.query(`SELECT * FROM public.user_entity AS ue 
        JOIN public.auth_user_entity as aue ON ue."id"=aue."userId"
        AND aue."lastLoginDate" <= NOW() - INTERVAL '2 months'`);
  }

  async getCustomersWhoseBirthdaysFallToday() {
    return await this.em
      .query(`SELECT * FROM public.user_entity AS ue JOIN public.auth_user_entity 
                AS au ON ue."id"=au."userId" 
                WHERE EXTRACT(MONTH FROM "dateOfBirth")=EXTRACT(MONTH FROM NOW()) 
                AND EXTRACT(DAY FROM "dateOfBirth")=EXTRACT(DAY FROM NOW())`);
  }

  async calculateSavingsGoalsLikelyToFail(
    savingsGoal: SavingsGoalEntity,
    account: AccountEntity,
  ) {
    let endDate = parseISO(format(new Date(savingsGoal.endDate), 'yyyy-MM-dd'));

    let startDate = parseISO(
      format(new Date(savingsGoal.startDate), 'yyyy-MM-dd'),
    );

    this.logger.log(`Start Date -----> ${startDate}`);

    this.logger.log(`End Date ------> ${endDate}`);

    let duration = intervalToDuration({
      start: new Date(endDate),
      end: new Date(startDate),
    });

    let days = subMonths(endDate, 3);

    let threeMonthsBehind = intervalToDuration({
      start: new Date(days),
      end: new Date(),
    });

    this.logger.log(`Three months behind --->  ${threeMonthsBehind}`);

    console.log(`Savings goal days ---> ${duration}`);

    if (
      duration.months < threeMonthsBehind.months &&
      account.balance < savingsGoal.amountToRaise
    ) {
      console.log('--- These customers may not reach their savings goal ---');

      console.log(savingsGoal.userId);
      /* this.notificationService.sendSms({
                to: [''],
                sms: `Hello, your ${savingsGoal.name} savings goal is almost coming to an end. 
                          kindly top up your account to enable you reach your savings goal. Thank you.`
            }); */
    }
  }

  async getCustomerInfoById(userId: string) {
    return this.em.query(
      `
           SELECT * FROM auth_user_entity AS aue JOIN user_entity AS ue 
           ON aue."userId" = ue."id" AND ue."id"=?`,
      [userId],
    );
  }

  async getSavingsGoalsInProgressEndingToday() {
    return await this.em.query(
      `SELECT * FROM savings_goal_entity WHERE DATE("endDate")=DATE(NOW()) AND "goalStatus"='INPROGRESS'`,
    );
  }

  ///THIS FUNCTION NEEDS TO BE TRIMMED AS THE DATA GROWS
  async getInProgressBezoLockSavingsGoalsOlderThanAMonth(): Promise<
    SavingsGoalEntity[]
  > {
    return (await this.em.query(`
    select s.* from savings_goal_entity s 
    inner join account_entity a on s."accountId"=a.id
    inner join account_type_entity at on a."accountTypeId"=at.id
    where at.alias='bezo-lock' 
and s."goalStatus"='INPROGRESS'
  and s."createdAt" < NOW() - INTERVAL '1 month'
order by s."createdAt" desc
        `)) as SavingsGoalEntity[];
  }

  async getCustomersMobileNumbers(userId: string) {
    try {
      const result = await this.em.query(
        'select * from public.auth_user_entity where "userId"=?',
        [userId],
      );
      // console.log(result);
      return result;
    } catch (e) {
      console.log(e);
    }
  }

  async updateCompletedGoalStatus(userId: number, goalStatus: string) {
    return this.em.update(SavingsGoalEntity, userId, {
      goalStatus: goalStatus,
    });
  }

  async releaseWithdrawalsForCompletedSavingsGoalJob() {
    let today = new Date();
    const savingsGolsInProgress = await this.em.find(SavingsGoalEntity, {
      where: { accountId: GOAL_STATUS.INPROGRESS },
    });
    if (savingsGolsInProgress.length) {
      for (let k = 0, len = savingsGolsInProgress.length; k < len; k++) {
        const savingGoal = savingsGolsInProgress[k];
        if (isBefore(savingGoal.endDate, today)) {
          let account = await this.em.findOne(AccountEntity, {
            where: { id: savingGoal.accountId },
          });
          account.allowWithdrawal = true;
          savingGoal.goalStatus = GOAL_STATUS.COMPLETED;
          await this.em.save(account);
          return await this.em.save(savingGoal);
        }
      }
    }
  }

  async getNewCustomers() {
    return await this.em.query(
      `
            SELECT * FROM user_entity ua
            JOIN account_entity ae ON ua."id" = ae."userId"
            WHERE DATE(ua."createdAt") = DATE(NOW()) AND "balance" = 0;
            `,
    );
  }

  async getCustomersWithZeroBalance(): Promise<any> {
    return await this.em.query(
      `
      SELECT ua."id" AS userId, pm."network" 
      AS network, ae."id" AS accountId, aue."phone" AS phone, ua."firstName" AS firstName, ae."balance" AS balance, sqe."amountToSave" AS savings_balance
      FROM user_entity ua JOIN account_entity ae ON ua."id" = ae."userId"
      JOIN auth_user_entity aue ON ua."id" = aue."userId"
      JOIN payment_method_entity pm ON ua."id" = pm."userId"
      JOIN savings_goal_entity sqe ON ua."id" = sqe."userId"
      WHERE ae."balance" < 10 AND sqe."amountToSave" < 10 AND ua."createdAt" >= NOW() - INTERVAL '1 WEEK'
            `,
    );
  }

  async deposit(
    userId: string,
    accountId: string,
    phone: string,
    amount: number,
    network: string,
    description: string,
  ): Promise<any> {
    //let account = await this.accountService.getUserAccount(accountId);
    const reference = uuid();
    let transaction = new TransactionEntity();
    transaction.amount = 5.0;
    transaction.userId = userId;
    transaction.transactionId = reference;
    transaction.userRef = '' + gen(5);
    transaction.transactionStatus = TRANSACTION_STATUS.PENDING;
    transaction.accountId = accountId;
    transaction.transactionType = TRANSACTION_TYPE.DEBIT;
    transaction.platform = PlATFORM.web;
    let depositResponse =
      await this.transactionService.callPaymentGateWayForDepositWithdrawal(
        phone,
        amount,
        description,
        TRANSACTION_TYPE.DEBIT,
        network,
      );

    console.log(depositResponse);

    if (depositResponse.status === TRANSACTION_STATUS.PENDING) {
      transaction.senderPhone = phone;
      transaction.transactionData = depositResponse;

      if (description == null) {
        description = 'Auto Debit';
      }

      const depositedTransaction = await this.em.save(transaction);
      return depositedTransaction;
    } else {
      await this.em.save(transaction);
      await this.notificationService.sendSms({
        to: ['233594951335'],
        sms: `BEZADMIN: Payment GateWay issue Deposit from cron. ${transaction.transactionId}.`,
      });
    }
  }

  async manageAutoDebitStatus(userId: string, phone: string) {
    try {
      let record = await this.em.findOne(CustomerAutoDebitEntity, {
        where: {
          userId: userId,
        },
      });

      if (record != null) {
        if (record.status == CRON_STATUS.INPROGRESS && record.count < 5) {
          record.count = record.count + 1;
          await this.em.save(record);
        } else {
          record.status = CRON_STATUS.COMPLETED;
          await this.em.save(record);
        }
      } else {
        let customerAutoDebitEntity = new CustomerAutoDebitEntity();
        customerAutoDebitEntity.userId = userId;
        customerAutoDebitEntity.phone = phone;
        customerAutoDebitEntity.count = 1;
        customerAutoDebitEntity.status = CRON_STATUS.INPROGRESS;
        return await this.em.save(customerAutoDebitEntity);
      }

      return record;
    } catch (e) {
      this.logger.error(e);
    }
  }
}
