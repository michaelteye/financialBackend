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
import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { STATUS } from '../../auth/entities/enums/status.enum';

@Console()
export class MigrateDeactivateDormantAccountsCommand {
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
    command: 'migrate:deactive-dormant-account',
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

  
    /// Filter for those with number of day more than 365

     result = result.filter((r:any)=>r.number_of_days>=365)

    const chunkSize = 20;
    for (let i = 0; i < result.length; i += chunkSize) {
       // console.log("result",result[i])
    
        const chunk = result.slice(i, i + chunkSize);
        console.log("chunk",chunk)

        const res = await Promise.all(
          chunk.map(async (dataInput) => {
            await this.deactivateAccounts(dataInput);
          }),
        );
        console.log('resMain', res);
      
    }

    console.log("result",result.length)
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
