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
import { AccountDuplicatePrimaryEntity } from '../../account/entities/account_duplicate_primary.entity';
import { IntraTransferDto } from '../../account/dtos/transfer-account.dto';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { AccountTransactionEntity } from '../../transactions/entities/account-transaction.entity';
import { AccountTransactionBackupEntity } from '../../transactions/entities/account-transaction-backup.entity';
import { TransactionBackupEntity } from '../../transactions/entities/transaction_backup.entity';
import { AuthUserDuplicateEntity } from '../../auth/entities/auth-duplicate-user.entity';
import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { UserEntity } from '../../main/entities/user.entity';
import { UserDuplicateEntity } from '../../main/entities/user-duplicate.entity';
import { StreakEntity } from '../../streak/entities/streak.entity';

@Console()
export class MigrateDeleteDuplicateAuthUserUserEntityPrimaryCommand {
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

  ///RUN MIGRATION
  @Command({
    command: 'migrate:delete:authdup-userdup',
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
    console.log('Migrating Delete Duplicates ....');

    const query = `SELECT phone, COUNT(*) AS account_count
    FROM public.auth_user_entity
    GROUP BY phone
    HAVING COUNT(*) > 1;
     `;

    const result = await this.em.query(query);
    console.log('result', result);

    // const result = [
    //   {
    //     userId: 'b8ca2314-4d65-49e3-8928-7d4e6608114f',
    //     name: 'Primary',
    //   },
    // ];
    const chunkSize = 5;
    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize);

      const res = await Promise.all(
        chunk.map(async (dataInput) => {
          await this.migrateDeleteDupAuthUserAndUserData(dataInput);
        }),
      );

      console.log('resMain', res);
    }
  }

  async migrateDeleteDupAuthUserAndUserData(data: any) {
    const authAllUsers = await this.em.find(AuthUserEntity, {
      where: {
        phone: data.phone,
      },
    });

    let saveAllAuthDetails = await Promise.all(
      authAllUsers.map(async (dataInputToSave) => {
        try {
          await this.em.save(AuthUserDuplicateEntity, dataInputToSave);
        } catch (error) {
          console.log('error deleting ', error);
        }
      }),
    );



    const authLeft = authAllUsers.shift();
    console.log('left user>> not deleted', authLeft);

    authAllUsers.map(async (dataInputToSave) => {
      try {
        //await this.em.save(AuthUserDuplicateEntity,data)
        await this.em.delete(AuthUserEntity, { id: dataInputToSave.id });
      } catch (error) {
        console.log('error deleting ', error);
      }
    });

     /////////////GETTING ALL USERS

    const allUsers = await this.em.find(UserEntity, {
        where: {
          id: authLeft.userId,
        },
      });

      let saveAllUsersDuplicate = await Promise.all(
        allUsers.map(async (dataInputToSave) => {
          try {
            await this.em.save(UserDuplicateEntity, dataInputToSave);
          } catch (error) {
            console.log('error deleting ', error);
          }
        }),
      );

     const leftUser= allUsers.shift()
     console.log("leftUser",leftUser)

     allUsers.map(async (dataInputToSave2) => {
        try {
            console.log("deleting user",dataInputToSave2)
          //await this.em.save(AuthUserDuplicateEntity,data)
          await this.em.delete(StreakEntity,{userId:dataInputToSave2.id})
          await this.em.delete(UserEntity, { id: dataInputToSave2.id });
        } catch (error) {
          console.log('error deleting ', error);
        }
      });

  

   
  }
}
