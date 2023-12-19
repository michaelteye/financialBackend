import { InjectConnection } from "@nestjs/mongoose";
import { InjectEntityManager } from "@nestjs/typeorm";
import { Connection } from "mongoose";
import { Console, Command } from "nestjs-console";
import { EntityManager } from "typeorm";
import { UserEntity } from "src/modules/main/entities/user.entity";
import { ReferralEntity } from "src/modules/referrals/entities/referral.entity";

@Console()
export class MigrateReferredCodeCommand {
  private db: Connection;

  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    @InjectConnection() private connection: Connection,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:referrercode',
    options: [
      {
        flags: '--type <type>',
        required: false,
      },
    ],
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
    console.log('ready to migrate', opts);
    const referrals = await this.em.find(ReferralEntity, {});
    for (let referral of referrals) {
      if (referral.code.includes(referral.userId)) {
        continue; // Skip referral codes that already contain the user's name
      }
      const user = await this.em.findOne(UserEntity, { where: { id: referral.userId } });
      if (user){
        const firstName = user.firstName.slice(0, 3).toLowerCase();
        const lastName = user.lastName.slice(0, 3).toLowerCase();
        let newReferralCode = `${firstName}${lastName}`;
        let count = 1;
        while (true){
          const existingReferral = await this.em.findOne(ReferralEntity, { where: { code: newReferralCode } });
          if (!existingReferral) {
            break; // Found a unique referral code
          }
          newReferralCode = `${firstName}${lastName}${count}`;
          count++;
        }
        referral.code = newReferralCode;
        await this.em.save(referral);
      }
    }
  }
}

