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

@Console()
export class MigrateSavingInterestCommand {
  private db: Connection;
  constructor(
    private em: EntityManager,
    @InjectConnection() private connection: Connection,
    private service: MigrationService,
    private transferService: TransferService
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:saving-interest',
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
    const pendingUsers = await this.em.find(SavingsGoalEntity,{
        where:{goalStatus:'INPROGRESS'}
      })
      const result=await Promise.all(
        pendingUsers.map(async (r)=>{
        const savingStartDate = new Date(r.startDate);
        const currentDate = new Date()
        
        const datediference = differenceInDays(currentDate,savingStartDate)
      

        if(datediference >= 30){
          console.log("datediference more than 30",datediference)
         const  getAssociatedAccount = await this.em.findOne(AccountEntity,{where:{id:r.accountId }})
         const zeroPointSevenInterest = ((0.0075) * getAssociatedAccount.balance).toFixed(2)
          console.log("Interest Calculated",zeroPointSevenInterest)
         const deposite = new AccountDepositWithrawalDto();
         deposite.amount = Number(zeroPointSevenInterest)
         deposite.accountId = getAssociatedAccount.id
         deposite.narration = `Interest Payment`
        
         return await this.transferService.userAccountDepositInterest(deposite)


        }


      }))

      console.log("result",result)
      //looping the pendinguser to get the start date 
      //base on the starting date check if it a month old
      //find the difference between the start date and the ending date
      //cont get associatedaccount = 
      // this is the s2end code where id 
      // calculate o.75% 
    // await this.em.savi();
    console.log('Migration complete ....');
  }

  // load account type



  async createTransactions(transaction: any, migration:MigrationDepositsEntity) {
  //  console.log("transaction>>>>>>",transaction)

    
    try {

        await this.service.saveTransaction(transaction, TRANSACTION_TYPE.DEPOSIT);
        migration.migrated=true;
        await this.em.save(migration);
      } catch (error: any) {
        console.log('error', error);
        migration.migrated=false;
        migration.error= error;
        await this.em.save(migration);
      }
  }
}