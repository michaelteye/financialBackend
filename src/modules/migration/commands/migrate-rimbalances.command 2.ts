import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { UserEntity } from '../../main/entities/user.entity';
import { EntityManager } from 'typeorm';
import { AccountEntity } from '../../account/entities/account.entity';
import { RimEntity } from '../../account/entities/rim.entity';
import { InjectEntityManager } from '@nestjs/typeorm';

@Console()
export class MigrateRimBalancesCommand {
  private db: Connection;
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
     @InjectConnection() private connection: Connection,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:rimbalance'
  })
 
  async execute(opts?: any) {
    console.log('Running rim balances >>>>>')
    try {
      return await this.migrateRimBalances();
    } catch (e) {
      console.error(e);
      return 1;
    }
  }
 

 

  async migrateRimBalances() {
    const users = await this.getAllUsers();
    for (let i = 0; i < users.length; i++) {
      let accounts = await this.getAllUserAccounts(users[i].id);
      let totalBalance = accounts.reduce((sum, obj) => Number(sum) + Number(obj.balance), 0);
      console.log('Total balance is >>'+totalBalance)
      let savingsAccounts = accounts.filter(a=>a.name!=='Primary');
      let totalSavingsBalance = 0;
      if(savingsAccounts.length){
        console.log('Savings accounts length >>',savingsAccounts.length)
        totalSavingsBalance = savingsAccounts.reduce((sum, obj) => Number(sum) + Number(obj.balance), 0);
      }
      await this.saveRimBalance(users[i].id,totalBalance,totalSavingsBalance)
    }
  }
 

  async saveRimBalance(userId:string,totalBalance:number,totalSavingBalance:number) {
    await this.em
      .findOne(RimEntity, {
        where: { userId: userId },
      })
      .then(async (rim: any) => {
        if (rim) {
          rim.totalAccountsBalance=totalBalance;
          rim.totalSavingsGoalBalance=totalSavingBalance;
          rim.updatedAt= new Date();
          console.log('Updating rim balance new rim>>')
          await this.em.save(rim);
        }else{
          console.log('Creating new rim>>')
          let newRim = new RimEntity();
          newRim.totalAccountsBalance = totalBalance;
          newRim.totalSavingsGoalBalance=totalSavingBalance;
          newRim.createdAt= new Date();
          newRim.updatedAt= new Date();
          newRim.userId = userId
          await this.em.save(newRim);
        }
      });
  }


  async getAllUsers(type?: string): Promise<UserEntity[]> {
    const users = await this.em.find(UserEntity);
    console.log('The total users>>' + (users).length)
    return users;
  }

  async getAllUserAccounts(userId:string):Promise<AccountEntity[]> {
    const accounts = await this.em.find(AccountEntity, {
      where: { userId: userId },
    });
    return accounts;
  }
 
  
 
}
