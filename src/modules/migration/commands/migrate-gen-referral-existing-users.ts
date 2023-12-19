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
import { generateCode, generateReferralCode } from '../../../utils/shared';
import { ReferralDto } from '../../referrals/dtos/referrals.dto';
import { ReferralEntity } from '../../referrals/entities/referral.entity';
@Console()
export class MigrateGenerateReferralForExistingUsers {
  private db: Connection;
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    @InjectConnection() private connection: Connection,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }
  @Command({
    command: 'migrate:gen-referrals',
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
    const allUsers=await this.em.find(UserEntity)

    console.log("allUsers",allUsers)

    console.log("allUsers length",allUsers.length)

    const res=await Promise.all(
     allUsers.map(async(data)=>{
           
            const checkUser=await this.em.findOne(ReferralEntity,{
                where :{userId: data.id}
            })
            console.log("checkUser",checkUser)

            if(!checkUser){
                const referral = new ReferralDto()
                referral.code = generateReferralCode(9)
                referral.userId=data.id
                return await this.em.save(ReferralEntity,referral)    
            }
        })
    )
    console.log("res",res)
   

  }
 

  async _execute(opts?: any) {
    console.log('ready to migrate', opts);
    return await this.defaultMigration();
  }
}