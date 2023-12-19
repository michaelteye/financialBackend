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
import { uuid } from 'uuidv4';
import { NotificationService } from '../../notifications/services/notification.service';

@Console()
export class MigratePayUserCashbackFrom28AprilToMay8Command {
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
    command: 'migrate:paycashback-april-may',
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
    // const query=`SELECT savings_goal_entity."id",savings_goal_entity."accountId",savings_goal_entity."name",account_entity."balance",auth_user_entity."phone"
    // FROM public.savings_goal_entity,account_entity,auth_user_entity  where savings_goal_entity."accountId"=account_entity."id" and
    // auth_user_entity."userId"= savings_goal_entity."userId"
    // and  Date(savings_goal_entity."createdAt")>='2023-04-28'  and Date(savings_goal_entity."createdAt")<='2023-05-08'
    // and "goalStatus"='INPROGRESS' and account_entity."balance">0`

    const query = `SELECT savings_goal_entity."id",savings_goal_entity."accountId",savings_goal_entity."name",account_entity."balance",auth_user_entity."phone",
    savings_goal_entity."createdAt" as "SavingGoalDate" FROM public.savings_goal_entity,account_entity,auth_user_entity  where savings_goal_entity."accountId"=account_entity."id" and
     auth_user_entity."userId"= '5bb628a0-11d2-4d40-876d-e83c1d9a1921'
     and "goalStatus"='INPROGRESS' and account_entity."balance">0`;

    const result = await this.em.query(query);

    const chunkSize = 20;
    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize);

      const res = await Promise.all(
        chunk.map(async (dataInput) => {
          await this.migratePayCashback(dataInput);
        }),
      );

      console.log('resMain', res);
    }

    console.log('Migration complete ....');
  }

  async migratePayCashback(data: any) {
    try {
      if (data.balance > 0) {
        const depositRef = new AccountDepositWithrawalDto();
        const cashbackCal = Number((0.01 * data.balance).toFixed(2));
        depositRef.amount = cashbackCal;
        depositRef.accountId = data.accountId;
        depositRef.phone = data.phone;
        depositRef.reference = uuid();
        depositRef.narration = 'Deposit Cashback 1%';
        console.log('Got Herr >>>', depositRef);
        await this.transferService.userAccountDeposit(depositRef);
        await this.notificationService.sendSms({
          to: data.phone,
          sms: `Congratulations BezoSaver! You have successfully received GHS${cashbackCal} in your account through our cashback program. Keep saving and earning!`,
        });
      }
    } catch (error: any) {
      console.log('error', error);
    }
  }
}
