// import { HttpException } from '@nestjs/common';

import { HttpException } from '@nestjs/common/exceptions';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
// import { GlobalConfig } from 'rxjs';
// import { globalConfig } from 'src/config/config';
import { HttpRequestService } from '../../shared/services/http.request.service';
import { EntityManager } from 'typeorm';

import { MigrationService } from '../services/migration.service';

@Console()
export class MigrateReverseWithdrawalCommand extends HttpRequestService{
  private db: Connection;
  constructor(
    private em: EntityManager,
    private service: MigrationService,
   
  

  ) {
    super();
  
  }

  @Command({
    command: 'migrate:reverse-withdrawals',
  })
  async execute(opts?: any) {
    try {
      return await this._execute(opts);
    } catch (e) {
      console.error(e);
      return 1;
    }
  }

  async _execute(opts?: any) {
    console.log('Migration started ...');
    //const transactions = await this.getInterestTransactions();
    const query=`select *  from transaction_entity where 
    "transactionStatus"='PENDING' 
    and "createdAt">='2023-02-20'
    and "transactionType"='WITHDRAWAL'
    `
    const resultQuery=await this.em.query(query)

    console.log("resultQuery",resultQuery)
   
    //await this.migrateReverseTransactions(resultQuery);
    console.log('Migration Completed !! ...');
  }

  async migrateReverseTransactions(data: any[]) {
      await Promise.all(data.map((r)=>{
        this.createInterestTransactions(r.transactionId)
      }));
    
  }
  async createInterestTransactions(data:string) {
    let dataToSend={
            transactionRef:data,
            status:"FAILED"
    }

    const url = `${this.cfg.payment.callbackUrl}/`
    await this.post(url, dataToSend);

    this.logger.debug(`Error Response ${JSON.stringify(this.error, null, 2)}`);
    if (this.error) {
      throw new HttpException(this.error, 400);
    }
   
    console.log(" return this.response;",this.response)
 
  }


  
}
