import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { InterestPaymentService } from '../../interest/services/interest-payment.service';
import { EntityManager } from 'typeorm';


@Console()
export class MigrateTestDailyInterestPaymentMonthCommand {
  private db: Connection;
  constructor(
    private em: EntityManager,
    private InterestPaymentService: InterestPaymentService,
    @InjectConnection() private connection: Connection,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:daily-interest-payment-pay-month',
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
   // const transactions =  await this.InterestPaymentService.payBezoFlexUsers()
    // const transAccountSavingBeforeFeb2023= await this.InterestPaymentService.dailyInetrestCalckForBezoFlexUsersCreatedBeforeFebruary()
    const transAccountSavingBeforeFeb2023= await this.InterestPaymentService.payInterestForMonthEnd()
    //const transAccountSavingBeforeFeb2023= await this.InterestPaymentService.payInterestForMonthEnd()
   //const transAccountSavingBeforeFeb2023= await this.InterestPaymentService.dailyInetrestCalckForBezoFlexUsersCreatedBeforeFebruary()


  }



  
}
