import { EntityManager, Not, Repository } from 'typeorm';
import { Inject, HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { AccountTypeEntity } from '../../account/entities/account-type.entity';

import { InterestEntity } from '../entities/interest.entity';
import { INTEREST_TYPE } from '../enums/interest-type.enum';
import { INTEREST_FORMAT } from '../enums/interest-format.enum';
import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
import { DailyInterestPaymentDto } from '../dtos/dailyinterest.dto';
import { DailyInterestPaymentEntity } from '../entities/dailyinterest.entity';
import { INTEREST_STATUS_TYPE } from '../enums/interest-status.enum';
import { AccountDepositWithrawalDto } from '../../transfers/dto/AccountDepositDto';
import { TransferService } from '../../transfers/services/transfer.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { getMonth, getYear, format, subMonths } from 'date-fns';
import { InterestPaymentsEntity } from '../entities/interest_payments.entity';

@Injectable()
export class InterestPaymentService {
  private logger = new Logger('InterestPaymentService');

  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    private transferService: TransferService,
    private notificationService: NotificationService,
  ) {}

  async dailyInterestCalcForBezoLockUsers() {
    const interestData = await this.getAccountInterestType(
      INTEREST_TYPE.BEZOLOCK,
    );
    const bezoLockAccount = await this.getAccounTypeByAlias('bezo-lock');

    const allUserWithBezoLockAccount = await this.getallUserWithBezoLockAccount(
      bezoLockAccount.id,
    );

    const chunkSize = 20;
    for (let i = 0; i < allUserWithBezoLockAccount.length; i += chunkSize) {
      const chunk = allUserWithBezoLockAccount.slice(i, i + chunkSize);

      await Promise.all(
        chunk.map(async (accountData) => {
          console.log('accountData', accountData);
          await this.writeInterestPayment(interestData, accountData);
        }),
      );
    }
  }

  async dailyInterestCalBezoFlexUsers() {
    const interestData = await this.getAccountInterestType(
      INTEREST_TYPE.BEZOFLEX,
    );
    const bezoLockAccount = await this.getAccounTypeByAlias('flexi-save');

    const allUserWithBezoLockAccount = await this.getallUserWithBezoFlexAccount(
      bezoLockAccount.id,
    );

    // console.log("allUserWithBezoLockAccount",allUserWithBezoLockAccount)

    const chunkSize = 20;
    for (let i = 0; i < allUserWithBezoLockAccount.length; i += chunkSize) {
      const chunk = allUserWithBezoLockAccount.slice(i, i + chunkSize);
      console.log('chunk', chunk);
      await Promise.all(
        chunk.map(async (accountData) => {
          console.log('accountData', accountData);
          await this.writeInterestPayment(interestData, accountData);
        }),
      );
      // console.log('resMain', res);
    }
  }

  async dailyInetrestCalckForBezoFlexUsersCreatedBeforeFebruary() {
    const interestData = await this.getAccountInterestType(
      INTEREST_TYPE.BEZOLOCK,
    );
    console.log('interestData', interestData);

    const bezoLockAccount = await this.getAccounTypeByAlias('flexi-save');

    const allUserAccountsBeforeFebruary2023 =
      await this.getSavingGoalBeforeFeb2023(bezoLockAccount.id);

    console.log(
      'allUserAccountsBeforeFebruary2023',
      allUserAccountsBeforeFebruary2023.length,
    );

    const chunkSize = 20;
    for (
      let i = 0;
      i < allUserAccountsBeforeFebruary2023.length;
      i += chunkSize
    ) {
      const chunk = allUserAccountsBeforeFebruary2023.slice(i, i + chunkSize);

      await Promise.all(
        chunk.map(async (accountData) => {
          await this.writeInterestPayment(interestData, accountData);
        }),
      );
    }
  }

  async payInterestForMonthEnd() {
    //Select all from daily_interest_entiy where paymentStatus is Pending group by userId
    //Sum all the amount and tranfer from the interest Account to the user
    //for each interest payment transfer write a record to the interest payments_entity
    //Send sms for each interest payment

    const query = `SELECT  "accountId","userId","name","phone",sum(amount) as total
     FROM public.daily_interest_payment_entity
     GROUP BY "accountId","userId","phone","paymentStatus","name"
     HAVING COUNT(*) >= 1 and "paymentStatus"='PENDING'`;

    const dataToTransfer = await this.em.query(query);
    const chunkSize = 20;
    for (let i = 0; i < dataToTransfer.length; i += chunkSize) {
      const chunk = dataToTransfer.slice(i, i + chunkSize);

      await Promise.all(
        chunk.map(async (data) => {
          await this.transferInterestPayment(data);
        }),
      );
    }

    //  let pendingPayments = await this.em.find(DailyInterestPaymentEntity,{where:{paymentStatus:INTEREST_STATUS_TYPE.PENDING}})
    //  let paymentsSum ={};
    //  let processedPaymentIds =[];
    //  for(let item of pendingPayments){
    //   processedPaymentIds.push(item.id)
    //    if(paymentsSum[item.accountId]){
    //     paymentsSum[item.accountId]+=Number(item.amount);
    //    }else{
    //     paymentsSum[item.accountId]=Number(item.amount)
    //    }
    //  }
    //  Object.keys(processedPaymentIds).forEach(function(payment){

    //  })
  }

  async transferInterestPayment(data: any) {
    //  const  getAssociatedAccount = await this.em.findOne(AccountEntity,{where:{id:data.accountId }})

    if (data.total > 0) {
      const sumTotalInterest = Number(data.total).toFixed(2);
      console.log('Interest Calculated', sumTotalInterest);
      const deposite = new AccountDepositWithrawalDto();
      deposite.amount = Number(sumTotalInterest);
      deposite.accountId = data.accountId;
      deposite.narration = `Interest Payment`;

      // if (deposite.amount > 0) {
      const resultAfterPay =
        await this.transferService.userAccountDepositInterest(deposite);

      /// adding to InterestPaymentsEntity
      data.amount = deposite.amount;
      data.narration = deposite.narration;
      await this.em.save(InterestPaymentsEntity, data);

      const allRecordsToUpdate = await this.em.find(
        DailyInterestPaymentEntity,
        {
          where: {
            accountId: data.accountId,
            paymentStatus: INTEREST_STATUS_TYPE.PENDING,
          },
        },
      );

      await Promise.all(
        allRecordsToUpdate.map(async (accountData) => {
          console.log('accountData BB', accountData);

          await this.em.save(DailyInterestPaymentEntity, {
            ...accountData,
            paymentStatus: INTEREST_STATUS_TYPE.COMPLETED,
            paymentDate: new Date(),
          });
        }),
      );

      const date = new Date();
      const currentYear = getYear(date);
      // const currentMonth = format(date, 'MMMM');

      const previousMonth = subMonths(date, 1);
      const previousMonthInWords = format(previousMonth, 'MMMM');

      this.notificationService.sendSms({
        to: data.phone,
        sms: `An amount of GHS${deposite.amount} has been credited to you savings goal with name ${data.name} as interest payment for ${previousMonthInWords} ${currentYear}.Trxn ID: ${resultAfterPay.userRef}. Thank you for choosing Bezo.`,
        // provider: 'nalo',
      });

      return resultAfterPay;
      // }
    }
  }

  async getSavingGoalBeforeFeb2023(accountTypeId): Promise<any> {
    /// GET ALL BEZOLOCK USERS IN PROGRESS
    const queryMain = `SELECT account_entity."id",account_entity."userId",savings_goal_entity."createdAt" as savingGoalCreatedAt,account_entity."name",account_entity."accountTypeId",account_entity."balance",auth_user_entity."phone" FROM account_entity,auth_user_entity, savings_goal_entity
    where account_entity."accountTypeId"='${accountTypeId}'
    and savings_goal_entity."accountId"=account_entity."id" and
    savings_goal_entity."userId"=auth_user_entity."userId" and
    savings_goal_entity."goalStatus"='INPROGRESS' and savings_goal_entity."createdAt" < '2023-02-01'`;

    return await this.em.query(queryMain);
  }

  async getallUserWithBezoFlexAccount(accountTypeId): Promise<any> {
    /// GET ALL BEZOFLEX USERS IN PROGRESS
    const queryMain = `SELECT account_entity."id",account_entity."userId",account_entity."name",account_entity."accountTypeId",account_entity."balance",auth_user_entity."phone" FROM account_entity,auth_user_entity, savings_goal_entity
    where account_entity."accountTypeId"='${accountTypeId}'
    and savings_goal_entity."accountId"=account_entity."id" and
    savings_goal_entity."userId"=auth_user_entity."userId" and
    savings_goal_entity."goalStatus"='INPROGRESS' and savings_goal_entity."createdAt" >= '2023-02-01'`;
    return await this.em.query(queryMain);
  }

  async getallUserWithBezoLockAccount(accountTypeId): Promise<any> {
    /// GET ALL BEZOLOCK USERS IN PROGRESS
    const queryMain = `SELECT account_entity."id",account_entity."userId",account_entity."name",account_entity."accountTypeId",account_entity."balance",auth_user_entity."phone" FROM account_entity,auth_user_entity, savings_goal_entity
    where account_entity."accountTypeId"='${accountTypeId}'
    and savings_goal_entity."accountId"=account_entity."id" and
    savings_goal_entity."userId"=auth_user_entity."userId" and
    savings_goal_entity."goalStatus"='INPROGRESS' `;
    return await this.em.query(queryMain);
  }

  async writeInterestPayment(interestData: InterestEntity, accountData: any) {
    if (interestData.feeFormat == INTEREST_FORMAT.PERCENTAGE) {
      let amountToPay = (
        ((interestData.value / 100) * accountData.balance) /
        365
      ).toFixed(5);

      console.log('amountToPay', amountToPay);

      const dailyInterestPay = new DailyInterestPaymentDto();
      dailyInterestPay.amount = Number(amountToPay);
      dailyInterestPay.accountId = accountData.id;
      dailyInterestPay.narration = `Interest Payment`;
      dailyInterestPay.phone = accountData.phone;
      dailyInterestPay.userId = accountData.userId;
      dailyInterestPay.paymentStatus = INTEREST_STATUS_TYPE.PENDING;
      dailyInterestPay.name = accountData.name;

      console.log('dailyInterestPay', dailyInterestPay);

      const res = await this.em.save(
        DailyInterestPaymentEntity,
        dailyInterestPay,
      );
      return dailyInterestPay;
    }
  }

  // async writeInterestForBezoFlexUsers(
  //   interestData: InterestEntity,
  //   accountData: any,
  // ) {
  //   if (interestData.feeFormat == INTEREST_FORMAT.PERCENTAGE) {
  //     let amountToPay = (
  //       ((interestData.value / 100) * accountData.balance) /
  //       365
  //     ).toFixed(5);
  //     console.log("interestData",interestData)
  //   //   console.log("amountToPay",amountToPay)
  //     const dailyInterestPay = new DailyInterestPaymentDto();
  //     dailyInterestPay.amount = Number(amountToPay);
  //     dailyInterestPay.accountId = accountData.id;
  //     dailyInterestPay.narration = `Interest Payment`;
  //     dailyInterestPay.phone=accountData.phone
  //     dailyInterestPay.userId=accountData.userId
  //     await this.em.save(DailyInterestPaymentEntity,dailyInterestPay)
  //     return dailyInterestPay
  //   }
  // }

  async getAccounTypeByAlias(name) {
    const accountType = await this.em.findOne(AccountTypeEntity, {
      where: { alias: name },
    });
    return accountType;
  }

  async getAccountInterestType(type: INTEREST_TYPE): Promise<InterestEntity> {
    return this.em.findOne(InterestEntity, {
      where: {
        interestType: type,
      },
    });
  }

  async savingsGoalExist(name: string, userId: string) {
    return await this.em.findOne(SavingsGoalEntity, {
      where: { name: name, userId: userId },
    });
  }
}
