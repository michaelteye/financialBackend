import { TransferService } from '../../transfers/services/transfer.service';
import { AccountDepositWithrawalDto } from './../../transfers/dto/AccountDepositDto';
import { AccountEntity } from './../../account/entities/account.entity';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { EntityManager } from 'typeorm';
import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { MigrationDepositsEntity } from '../entitites/migration.deposits.entity';
import { MigrationService } from '../services/migration.service';
import { differenceInDays } from 'date-fns';
import { NotificationService } from '../../notifications/services/notification.service';

@Console()
export class MigrateInterestJanuaryFebruaryCommand {
  private db: Connection;
  constructor(
    private em: EntityManager,
    @InjectConnection() private connection: Connection,
    private service: MigrationService,
    private transferService: TransferService,
    private notificationService: NotificationService,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:interest-backpay',
  })
  async execute(opts?: any) {
    try {
      return await this._execute(opts);
    } catch (e) {
      console.error(e);
      return 1;
    }
  }

  // write you
  async _execute(opts?: any) {
    console.log('Migrating interest ....');

    const query = `SELECT account_transaction_entity."accountId",
    GREATEST(account_transaction_entity."initialBalance",account_transaction_entity."currentBalance") as finalBalance,
    account_transaction_entity."initialBalance",account_transaction_entity."currentBalance",
    auth_user_entity."userId",
    auth_user_entity."phone",
    auth_user_entity."email",
     savings_goal_entity."name",
    account_transaction_entity."createdAt" as acc_t_CreatedAt
    
    FROM public.account_transaction_entity 
     inner join account_entity
     on account_entity."id"=account_transaction_entity."accountId"
     
      inner join auth_user_entity
     on account_entity."userId"=auth_user_entity."userId"
     
      inner join savings_goal_entity
      on savings_goal_entity."accountId"=account_transaction_entity."accountId"
     
       WHERE account_transaction_entity."createdAt" BETWEEN '2023-01-01' AND '2023-03-01'
        AND account_transaction_entity."id" IN (
            SELECT  max(account_transaction_entity."id")
            FROM account_transaction_entity
        WHERE account_transaction_entity."createdAt" BETWEEN '2023-01-01' AND '2023-03-01'
            GROUP BY "accountId"
        )
      AND account_transaction_entity."accountId"  IN (
      SELECT account_transaction_entity."accountId"
      FROM public.savings_goal_entity
       WHERE ("endDate" >= '2023-02-01' AND "endDate" < '2023-03-01')
          OR "goalStatus" = 'INPROGRESS') 
   `     

    const result = await this.em.query(query);

    const chunkSize = 100;
    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize);

      const res = await Promise.all(
        chunk.map(async (dataInput) => {
          await this.migratePayInterest(dataInput);
        }),
      );

      console.log('resMain', res);
    }
  }

  async migratePayInterest(data: any) {
    //  const  getAssociatedAccount = await this.em.findOne(AccountEntity,{where:{id:data.accountId }})

    if (data.finalbalance > 0) {
      const zeroPointSevenInterest = (0.0075 * data.finalbalance).toFixed(2);
      console.log('Interest Calculated', zeroPointSevenInterest);
      const deposite = new AccountDepositWithrawalDto();
      deposite.amount = Number(zeroPointSevenInterest);
      deposite.accountId = data.accountId;
      deposite.narration = `Interest Payment`;

      const resultAfterPay =
        await this.transferService.userAccountDepositInterest(deposite);

      console.log('resultAfterPay', resultAfterPay);
      //console.log("")
      this.notificationService.sendSms({
        to: data.phone,
        sms: `An amount of GHS${deposite.amount} has been credited to you savings goal with name ${data.name} as interest payment for February 2023.Trxn ID: ${resultAfterPay.userRef}. Thank you for choosing BezoSusu.`,
       // provider: 'nalo',
      });

      return resultAfterPay;
    }
  }
}
