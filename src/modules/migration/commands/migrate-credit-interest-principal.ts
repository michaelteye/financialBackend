import { TransferService } from '../../transfers/services/transfer.service';
import { AccountDepositWithrawalDto } from './../../transfers/dto/AccountDepositDto';
import { AccountEntity } from './../../account/entities/account.entity';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { EntityManager } from 'typeorm';
import { MigrationService } from '../services/migration.service';
import { UserEntity } from '../../main/entities/user.entity';

@Console()
export class MigrateInvestmentPrincipalPaymenCommand {
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
    command: 'migrate:creditinterestprincipal',
  })
  async execute(opts?: any) {
    try {
      return await this._execute(opts);
    } catch (e) {
      console.log(`There was an erro ${e}`)
    }
  }
  private getInvestments() {
    return [{
      "_id": "ff007e32-59d1-4d85-9f60-80462cd4947f",
      "amount": 1000,
      "period": 5,
      "ref": "397723",
      "startDate": "2022-07-09",
      "endDate": "2023-07-09",
      "user_id": "31b6813cb47a69a39bb33f7358010fef2cc14f4d",
      "investment_account_id": "1e908d0b-7598-4af0-8dd1-025b0bb03408",
      "status": "active",
      "package_id": "73417af7-b2e7-4a57-8d58-689b1a0e7109",
      "createdAt": {
        "$date": "2022-07-09T20:54:00.431Z"
      },
      "updatedAt": {
        "$date": "2022-07-09T20:54:00.431Z"
      }
    }, {
      "_id": "13080872-5a63-4f7b-aa62-828345c7a795",
      "amount": 1000,
      "period": 5,
      "ref": "037690",
      "startDate": "2022-08-30",
      "endDate": "2023-08-30",
      "user_id": "9999d305555bae808eca26b4b459b6cca75a4ea8",
      "investment_account_id": "3c838b8c-f74a-4182-810e-43fca73846a2",
      "status": "active",
      "package_id": "73417af7-b2e7-4a57-8d58-689b1a0e7109",
      "createdAt": {
        "$date": "2022-08-30T16:03:38.429Z"
      },
      "updatedAt": {
        "$date": "2022-08-30T16:03:38.429Z"
      }
    }, {
      "_id": "6d430493-b10f-4627-8b5b-43330fc6d268",
      "amount": 10000,
      "period": 5,
      "ref": "599538",
      "startDate": "2022-10-27",
      "endDate": "2023-10-27",
      "user_id": "31b6813cb47a69a39bb33f7358010fef2cc14f4d",
      "investment_account_id": "1f696c98-c9a4-44de-9267-cd7bbe8c061f",
      "status": "active",
      "package_id": "73417af7-b2e7-4a57-8d58-689b1a0e7109",
      "createdAt": {
        "$date": "2022-10-27T14:17:40.152Z"
      },
      "updatedAt": {
        "$date": "2022-10-27T14:17:40.152Z"
      }
    }, {
      "_id": "a6a096d3-c0a6-4729-98aa-18f75c5a041c",
      "amount": 1000,
      "period": 5,
      "ref": "304990",
      "startDate": "2022-10-28",
      "endDate": "2023-10-28",
      "user_id": "6048c6d6ecdb2e73d00afd08607470fb37d2f93b",
      "investment_account_id": "6cce2ab1-3556-4a99-a050-55f85d51b87f",
      "status": "active",
      "package_id": "73417af7-b2e7-4a57-8d58-689b1a0e7109",
      "createdAt": {
        "$date": "2022-10-28T14:36:05.890Z"
      },
      "updatedAt": {
        "$date": "2022-10-28T14:36:05.890Z"
      }
    }]
  }

  // write you 
  async _execute(opts?: any) {
    const investments = this.getInvestments();
    for (let k=0;k<investments.length;k++) {
      let investment= investments[k];
      console.log('The current user is >>'+investment.user_id)
      let user =  await this.em.findOne(UserEntity,{
        where:{user_id:investment.user_id}
      });
      console.log(`Found user ${user.firstName} ${user.lastName}>>`);
      if(user){
          const primaryAccount = await this.em.findOne(AccountEntity, { where: { userId: user.id, name:"Primary" } });
          console.log(`Found useraccount ${user.userName} - ${primaryAccount.name} `);
          const deposite = new AccountDepositWithrawalDto();
          deposite.amount = investment.amount;
          deposite.accountId = primaryAccount.id
          deposite.narration = `Investment Princiapal Payment`
         await this.transferService.userAccountDepositInterest(deposite)
      }else{
        console.log(`User ID not found ${investment.user_id}`);
      }
    }
  }
}