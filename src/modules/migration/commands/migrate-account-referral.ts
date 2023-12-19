import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { AccountTypeEntity } from '../../account/entities/account-type.entity';
import { RegisterResponseDto } from '../../auth/dto/register-user.dto';
import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { JwtManagerService } from '../../auth/services/jwt-manager.service';
import { AddressEntity } from '../../main/entities/address.entity';
import { PaymentMethodEntity } from '../../main/entities/paymentmethod.entity';
import { UserEntity } from '../../main/entities/user.entity';
import { WalletTypeEntity } from '../../wallet/entities/wallet.entity';
import { EntityManager } from 'typeorm';
import { NETWORK } from '../../main/entities/enums/network.enum';
import {
  APP_TYPE,
  FileEntity,
  FILE_TYPE,
  ID_TYPE,
} from '../../fileupload/entities/file.entity';
import { STATUS } from '../../auth/entities/enums/status.enum';
import { ErrorEntity } from '../entitites/error.entity';
import { AuthUserRole } from '../../auth/types/auth-user.roles';
import { PAYMENT_TYPE } from '../../main/entities/enums/paymenttype.enum';
import { InjectEntityManager } from '@nestjs/typeorm';
import { LEVEL } from '../../auth/entities/enums/level.enum';
import { ProfileMigrationEntity } from '../entitites/profile.migration.entity';
import { SOCIAL } from '../../enums/social.enum';
import { generateCode } from '../../../utils/shared';
import { ReferralDto } from '../../referrals/dtos/referrals.dto';
import { ReferralEntity } from '../../referrals/entities/referral.entity';
@Console()
export class MigrateReferralsCommand {
  private db: Connection;
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    @InjectConnection() private connection: Connection,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }
  @Command({
    command: 'migrate:referral',
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
  async defaultMigration() {
    const usersAndReferrals = await this.db
      .collection('old_referrers')
      // .aggregate([
      //   { $limit : 5 }
      // ])
      .aggregate()
      .toArray();
     // console.log("usersAndReferrals>>",usersAndReferrals)

     
   // for (let i = 0; i < usersAndReferrals.length; i++) {
    const result=await Promise.all(
      usersAndReferrals.map(async(data)=>{
      const mentity = new ProfileMigrationEntity();
      mentity.user_id = data.user_id
      mentity.data = {...data}
    //  console.log('the mentity is ', mentity)
      const userMigration = await this.em.save(mentity);
      await this.migrateReferrals(data, userMigration);

      }))

      console.log("result >> referrals",result)
   // }


  }
  async migrateReferrals(referalData, pentity: ProfileMigrationEntity){
    try {
        const user=await this.getUserByUserId(referalData.user_id)
        console.log('the user is>>' ,user)
        if (user) {
    
      return  await  this.em.save(ReferralEntity,{code:referalData.ref,userId:user.id,ref_id:referalData.user_id})
        }

    } catch (error) {
        console.log("Error migrating referral>>>",error)
    }
  }
  async getUserByUserId(userId: string) {
    const user = await this.em.findOne(UserEntity, {
      where: { user_id: userId },
    });
    return user;
  }
  async _execute(opts?: any) {
    console.log('ready to migrate', opts);
    return await this.defaultMigration();
  }
}