import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { EntityManager } from 'typeorm';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { MigrationService } from '../services/migration.service';
import { PhoneNumberService } from '../../shared/services/phoneNumber.service';

@Console()
export class MigrateTestPhoneNumbersCommand {
  private db: Connection;
  constructor(
    private em: EntityManager,
    private phoneNumberService: PhoneNumberService,
    @InjectConnection() private connection: Connection,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:test-phonenumbers',
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

    const MTNNUMBERS= ['233245787389', '233542345675', '233559876765', '233598276433','233255787655']
    const VODAFONNUMBERS=['233208987876','233306453456','233502333232']
    const AIRTEL_TIGO= ['233576755567','233267543423','233566754322','233276632345']

    MTNNUMBERS.map((r)=>{
        const result=this.phoneNumberService.provider(r)
        console.log("MTN Numbers",result)
    })

    VODAFONNUMBERS.map((r)=>{
        const result=this.phoneNumberService.provider(r)
        console.log("vodafone Numbers", r,result)
    })

    AIRTEL_TIGO.map((r)=>{
        const result=this.phoneNumberService.provider(r)
        console.log("airteltigo Numbers",result)
    })

   
  }

  
}
