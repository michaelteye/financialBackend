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
import { SavingsGoalMigrationEntity } from '../entitites/savinggoal.migration.entity';
import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
import { GoalTypeEntity } from '../../savings-goal/entities/goal-type.entity';
import { FREQUENCY_TYPE } from '../../main/entities/enums/savingsfrequency.enum';
import { GOAL_STATUS } from '../../auth/entities/enums/goal-status.enum';
import { isBefore } from 'date-fns';
import { DEPOSIT_PREFERENCE } from '../../main/entities/enums/deposittype.enum';
@Console()
export class MigrateAllSavingsGoalsCommand {
  private db: Connection;
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    @InjectConnection() private connection: Connection,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }
  @Command({
    command: 'migrate:all-savingsgoals',
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
    const usersSavingsGoals = await this.db
      .collection('personal_savings')
      .aggregate([
        { $limit : 5 }
      ])

      .lookup({
        from: 'account',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'account',
      })
      .lookup({
        from: 'account_type',
        localField: 'account.account_type_id',
        foreignField: '_id',
        as: 'account_type',
      })
      .toArray();
     console.log("usersSavingsGoals>>",usersSavingsGoals)

     
    const result=await Promise.all(
        usersSavingsGoals.map(async(data)=>{
      const mentity = new SavingsGoalMigrationEntity();
      mentity.user_id = data.user_id
      mentity.data = {...data}
    //  console.log('the mentity is ', mentity)
      const userMigration = await this.em.save(mentity);
      await this.migrateGoals(data, userMigration);

      }))

      console.log("result >> goals",result)
  


  }
  async migrateGoals(item, pentity: ProfileMigrationEntity){
    try {
        const user=await this.getUserByUserId(item.user_id)
        console.log('the user is>>' ,user)
        if (user) {

            if(item.savingGoalName!=='Primary'){
                const savingsGoal = new SavingsGoalEntity();
                savingsGoal.name = item.savingGoalName;
                savingsGoal.description = item.savingGoalName;
               
             
                savingsGoal.frequency = item.frequencyType
                  ? this.getFrequencyType(item.frequencyType)
                  : FREQUENCY_TYPE.not_available;
                // savings goal type
                if (item.account_type.length) {
                  // console.log('Goal Type data>>>', account_types);
                  const checkSavingsGoalType = await this.getGoalTypeId(
                    item.savingGoal,
                  ); //this.findGoalType(item.goalName,account_types);
      
                  savingsGoal.goalTypeId = checkSavingsGoalType
                    ? checkSavingsGoalType
                    : await this.getGoalTypeId('Other');
                } else {
                  savingsGoal.goalTypeId = await this.getGoalTypeId('Other');
                }
                savingsGoal.period = isNaN(Number(item.goalPeriod))
                  ? 0
                  : item.goalPeriod;
                savingsGoal.preference = DEPOSIT_PREFERENCE.manual;
                if (item.depositPreference) {
                  if (item.depositPreference == 'manual') {
                    savingsGoal.preference = DEPOSIT_PREFERENCE.manual;
                  } else {
                    savingsGoal.preference = DEPOSIT_PREFERENCE.automatic;
                  }
                }
                savingsGoal.amountToRaise = Number(item.amountToRaise);
                if (item.emoji) savingsGoal.emoji = item.emoji;
                savingsGoal.amountToSave = isNaN(item.amountToSave)
                  ? 0
                  : item.amountToSave;
                const goalStatus = item.status.toLowerCase();
                savingsGoal.startDate = await this.isValidDate(item.startDate);
      
                if (goalStatus === 'success') {
                  if (isBefore(await this.isValidDate(item.endDate), new Date())) {
                    savingsGoal.goalStatus = GOAL_STATUS.COMPLETED;
                  } else {
                    savingsGoal.goalStatus = GOAL_STATUS.INPROGRESS;
                  }
                } else if (goalStatus === 'closed') {
                  savingsGoal.goalStatus = GOAL_STATUS.TERMINATED;
                } else if (goalStatus === 'failed') {
                  savingsGoal.goalStatus = GOAL_STATUS.FAILED;
                } else {
                  savingsGoal.goalStatus = GOAL_STATUS.PENDING;
                }
                savingsGoal.endDate = await this.isValidDate(item.endDate);
                savingsGoal.isFavorite = item.isFavorite;
                savingsGoal.userId = user.id

                savingsGoal.createdAt= new Date(item.createdAt)
                console.log('Saving savings Goal before save >>', savingsGoal);
                JSON.stringify(savingsGoal);
                const saved = await this.em.save(savingsGoal);
                console.log('Saved Saving Goal after save>>', saved);
    

       
            }
        }

    } catch (error) {
        console.log("Error migrating referral>>>",error)
    }
  }


  async isValidDate(date: string) {
    const timestamp = Date.parse(date);
    if (isNaN(timestamp) == false) {
      return new Date(timestamp);
    }
    return null;
  }

  async getGoalTypeId(name: string) {
    console.log('Getting with goal name', name);
    const goalType = await this.em.findOne(GoalTypeEntity, {
      where: { name },
    });
    console.log('getGoalTypeId.......', goalType);
    console.log('Got Goal Type ID >>', goalType?.id);
    if (goalType) return goalType.id;
    return null;
  }
  getFrequencyType(frequency: string): FREQUENCY_TYPE {
    const toFormat = frequency.toLowerCase();
    const types = Object.values(FREQUENCY_TYPE).map((i) => i.toLowerCase());
    if (types.includes(toFormat)) {
      return this.capitalizeFirstLetter(toFormat) as FREQUENCY_TYPE;
    }
    return FREQUENCY_TYPE.not_available;
  }


  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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