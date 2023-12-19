import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { EntityManager } from 'typeorm';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { MigrationService } from '../services/migration.service';
import { ReferralEntity } from '../../referrals/entities/referral.entity';
import { ReferredUserEntity } from '../../referrals/entities/reffered_user.entity';

@Console()

export class MigrateReferralCashbackCommand {
  private db: Connection;
  constructor(
    private em: EntityManager,
    private service: MigrationService,
    @InjectConnection() private connection: Connection,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:referral-cashback',
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
    const query = `SELECT * FROM referral_entity limit 5`

    const result = await this.em.query(query);


    const chunkSize = 20;
    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize);

      const res = await Promise.all(
        chunk.map(async (dataInput) => {
          await this.refCashback(dataInput);
        }),
      );

      
    }
  

    console.log('Migration Completed !! ...');
  }

  
  async refCashback(data:any):Promise<any> {
    //console.log('data',data)
    const obj={}
    const getReferrerData = await this.em.findOne(ReferralEntity, {
        where: { code: data.code },
      });
      
      console.log('getReferrerData', getReferrerData);

      if (!getReferrerData){
        console.log("Referral code does not exist")
      }

     

      /// GET NUMBER OF REFERRALS BY A USER
      const countUsersReferred = await this.em.find(ReferredUserEntity, {
        where: { referrerId: getReferrerData.id },
      });
 

      if (countUsersReferred.length <= 10) {
        // get Referral Phone Number
        console.log("countUsersReferred < than 10","count",countUsersReferred.length,"userId",data.userId,"referrer Id",getReferrerData.id)
        
      }else{
        console.log("countUsersReferred > than 10","count",countUsersReferred.length,"userId",data.userId,"referrer Id",getReferrerData.id)
      }
  }


  // load investment


  
}
