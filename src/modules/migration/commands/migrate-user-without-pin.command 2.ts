import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { InterestPaymentService } from '../../interest/services/interest-payment.service';
import {UserPinService} from '../../userpin/services/userpin.service';
import { generateCode } from '../../../utils/shared';
import { EntityManager } from 'typeorm';


@Console()
export class MigrateUsersWithoutPinCommand {
  private db: Connection;
  constructor(
    private em: EntityManager,
   
    private pinservice: UserPinService,
    @InjectConnection() private connection: Connection,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:user-without-pin',
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
   
     await this.generatePinForUsersWithoutPin()


  }

  async generatePinForUsersWithoutPin() {
    //Select all from daily_interest_entiy where paymentStatus is Pending group by userId
    //Sum all the amount and tranfer from the interest Account to the user
    //for each interest payment transfer write a record to the interest payments_entity
    //Send sms for each interest payment

    const query = `select * from auth_user_entity where "userId" not in (select "userId" from user_pin_entity )`;

    const userData = await this.em.query(query);

    const chunkSize = 20;
    for (let i = 0; i < userData.length; i += chunkSize) {
      const chunk = userData.slice(i, i + chunkSize);

      await Promise.all(
        chunk.map(async (data) => {
          await this.generatePins(data);
        }),
      );
    }
  }

  async generatePins(data: any) {
    //  const  getAssociatedAccount = await this.em.findOne(AccountEntity,{where:{id:data.accountId }})

    const randomPins= generateCode(4);

    await this.pinservice.createUserPinWithoutAuthentication(
        {
            userPin:randomPins,
            userId:data.userId,
            phone:data.phone

        }
    )
  }



  
}
