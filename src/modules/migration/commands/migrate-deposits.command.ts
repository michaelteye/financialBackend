import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { EntityManager } from 'typeorm';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { MigrationDepositsEntity } from '../entitites/migration.deposits.entity';
import { MigrationService } from '../services/migration.service';

@Console()
export class MigrateDepositsCommand {
  private db: Connection;
  constructor(
    private em: EntityManager,
    @InjectConnection() private connection: Connection,
    private service: MigrationService,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:deposits',
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
    console.log('Migrating deposits ....');
    await this.migrateTransactions();
    console.log('Migration complete ....');
  }

  // load account type

  async getDeposits() {
    const deposits = await this.db
      .collection('personal_deposit')
      .aggregate([
        // {$limit:150}
      ])
      .lookup({
        from: 'personal_savings',
        localField: 'savingsRefNo',
        foreignField: 'refNo',
        as: 'personal_savings',
      })
      .lookup({
        from: 'account',
        localField: 'personal_savings.account_id',
        foreignField: '_id',
        as: 'accounts',
      })
      .lookup({
        from: 'account_type',
        localField: 'accounts.account_type_id',
        foreignField: '_id',
        as: 'account_type',
      }).lookup({
        from: 'user_profile',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'user_profile',
      })
      

      .toArray();
    return deposits;
  }

  async migrateTransactions() {
    const userDeposits = await this.getDeposits();
    for (let i = 0; i < userDeposits.length; i++) {

      const mentity = new MigrationDepositsEntity();
      mentity.user_id = userDeposits[i].user_id;
      mentity.data = userDeposits[i];
      const migration = await this.em.save(mentity);
      await this.createTransactions(userDeposits[i], migration);

    }
    

    console.log(userDeposits.length);
  }

  


  async createTransactions(transaction: any, migration: MigrationDepositsEntity) {
    //  console.log("transaction>>>>>>",transaction)
    
    try {
      let result = await this.service.saveTransaction(transaction, TRANSACTION_TYPE.DEPOSIT);
      if (result) {
        migration.migrated = true;
      } else {
        migration.migrated = false;
        migration.error = "Transaction returned error. Account could not be mapped";
      
      }
      return await this.em.save(migration);

    } catch (error: any) {
      console.log('error', error);
      migration.migrated = false;
      migration.error = error;
      await this.em.save(migration);
    }
  }
}

