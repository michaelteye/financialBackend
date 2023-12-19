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
import { ReferralprofileMigrationEntity } from '../entitites/referral_profile.migration.entity';
import { SOCIAL } from '../../enums/social.enum';
import { generateCode } from '../../../utils/shared';
import { ReferralDto } from '../../referrals/dtos/referrals.dto';
import { ReferralEntity } from '../../referrals/entities/referral.entity';
import { ReferredUserEntity } from '../../referrals/entities/reffered_user.entity';
@Console()
export class MigrateReferredUsersCommand {
  private db: Connection;
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    @InjectConnection() private connection: Connection,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }
  @Command({
    command: 'migrate:referred_users',
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
  
  async defaultMigration(){
    const referred_user = await this.db.collection('old_referred_users').aggregate()
    .toArray()
  
    // for(let i = 0; i < referred_user.length; i++ ){
        
    // }
     const result=await Promise.all(
      referred_user.map(async(data)=>{
        const mentity = new ReferralprofileMigrationEntity();
        mentity.user_id =  data.referrer_id
        mentity.data = {...data}
        //console.log('the mentity is ', mentity)
        const userMigration = await this.em.save(mentity);
        return await this.migrateReferredUser(data, userMigration)
      })
     )

     console.log("result >>",result)

    console.log("referred_user are >>>", referred_user.length)

  }
  async migrateReferredUser(referedUserData, pentity: ReferralprofileMigrationEntity){

     try{
      
   //console.log("referedUserData",referedUserData)
        const user = await this.getUserByUserId(referedUserData.user_id)
        const userRef = await this.getUserReferral(referedUserData.referrer_id)
        console.log('user',user)
       console.log('userRef',userRef)
       
         if(user && userRef){
            const save=await this.em.save(ReferredUserEntity, {userId:user.id, referrerId:userRef.id})
           
             console.log('saved data are >>>',save)
           }
    }
    catch(error){
      console.log("`eroor",error)
    }
  }

  async getUserByUserId(userId: string) {
    const user = await this.em.findOne(UserEntity, {
      where: { user_id: userId },
      //relations:['referrals']
    });
    return user;
  }

  async getUserReferral(id: string) {
    const data = await this.em.findOne(ReferralEntity, {
      where: { ref_id:id },
    });
    return data
  }


  async _execute(opts?: any) {
    console.log('ready to migrate', opts);
    return await this.defaultMigration();
  }

  
}