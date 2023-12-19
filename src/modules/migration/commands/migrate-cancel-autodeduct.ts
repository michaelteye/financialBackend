import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { EntityManager } from 'typeorm';

import { GoalTypeEntity } from '../../savings-goal/entities/goal-type.entity';
import { STATUS } from '../../auth/entities/enums/status.enum';
import { HttpRequestService } from '../../shared/services/http.request.service';


@Console()
export class MigrateMandateAutoDeductCommand extends HttpRequestService {
  private db: Connection;

  constructor(
    private em: EntityManager,
    @InjectConnection() private connection: Connection,

  ) {

    super()
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:mandate-cancel',
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
    ///collecting all deactived user mandates
    await this.migrateMandates();
  }

  async getMandates() {
    const accountTypes = await this.db
      .collection('mandate')
      .find({
        status: 'active',
      })
      .toArray();
    return accountTypes;
  }

  async migrateMandates() {
    console.log('Migrating mandates  ....');
    const allUsermandates = await this.getMandates();

    //console.log("allUsermandates",allUsermandates, "Length",allUsermandates.length)

    const result = await Promise.all(
      allUsermandates.map(async (r) => {
        const payload = {
          merchantId: 1863,
          apiKey: 'B6KJw6AFuZHlZkm9UAoU9rTBrr0FUKjf',
          productId: 2,
          mandateId: r.mandateId,
          clientPhone: r.clientPhone,
        };
        // console.log("payload",payload)

        try {
          const res = await this.post(
            "https://ddv15-do.transflowitc.com/cancel/mandate",
            payload
          )
          return this.response
        } catch (error) {
          console.log('Error sending payload to ITC >>>>>', error);
        }
      }),
    );
    console.log("result", result)

    // for (let index = 0; index < allUsermandates.length; index++) {
    //   const element = allUsermandates[index];

    // }

    //console.log('Migrating mandates dones**  ....');

  }
}
