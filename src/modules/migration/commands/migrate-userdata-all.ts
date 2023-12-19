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
import { MigrationAccountEntity } from '../entitites/migration.account.entity';
import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
import { FREQUENCY_TYPE } from '../../main/entities/enums/savingsfrequency.enum';
import { GoalTypeEntity } from '../../savings-goal/entities/goal-type.entity';
import { DEPOSIT_PREFERENCE } from '../../main/entities/enums/deposittype.enum';
import { isBefore } from 'date-fns';
import { GOAL_STATUS } from '../../auth/entities/enums/goal-status.enum';
import { AccountEntity } from '../../account/entities/account.entity';
import { Optional } from '@nestjs/common';

@Console()
export class MigrateAllUserDataCommand {
  private db: Connection;

  constructor(
    @InjectEntityManager('default') private em: EntityManager,

    @InjectConnection() private connection: Connection,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:users-all',
    options: [
      {
        flags: '--type <type>',
        required: false,
      },
    ], //
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
    const allUserInfo = await this.db
      .collection('user_profile')
      .aggregate()
      .match({ momo: { $in: this.individualUser() } })
      .lookup({
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'phone',
      })
      .lookup({
        from: 'user_passwords',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'password',
      })
      .lookup({
        from: 'payment_methods',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'payment_method',
      })

      .lookup({
        from: 'payment_methods',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'payment_method',
      })
      .lookup({
        from: 'personal_savings',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'personal_savings',
      })
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

    console.log('user_profiles', allUserInfo[0]);

    for (let i = 0; i < allUserInfo.length; i++) {
      const mentity = new ProfileMigrationEntity();
      mentity.user_id = allUserInfo[i].user_id;
      mentity.data = allUserInfo[i];

      const userMigration = await this.em.save(mentity);
      await this.createUser(allUserInfo[i], userMigration);
    }
  }

  async globalUserMigration(userPhone) {
    const allUserInfo = await this.db
      .collection('user_profile')
      .aggregate()
      .match({ momo: { $in: [userPhone] } })
      .lookup({
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'phone',
      })
      .lookup({
        from: 'user_passwords',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'password',
      })
      .lookup({
        from: 'payment_methods',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'payment_method',
      })

      .lookup({
        from: 'payment_methods',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'payment_method',
      })
      .lookup({
        from: 'personal_savings',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'personal_savings',
      })
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

    //console.log('user_profiles', allUserInfo[0]);

    for (let i = 0; i < allUserInfo.length; i++) {
      const mentity = new ProfileMigrationEntity();
      mentity.user_id = allUserInfo[i].user_id;
      mentity.data = allUserInfo[i];

      const userMigration = await this.em.save(mentity);
      await this.createUser(allUserInfo[i], userMigration);
    }
  }



  async sleep() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve('Delay Fired.....');
      }, 5000);
    });
  }

  individualUser() {
    // lost users who did not migrate so interest additions from ITC
    // did not work on them  except for first user (233554341519)
    return ['233502910127'];
//233559142318
    
  }

  async _execute(opts?: any) {
    console.log('ready to migrate', opts);
    // if (opts && opts.type === 'bezousers') {
    //   return await this.migrateBezoUsers();
    // }
    await this.defaultMigration();
  }

  async getUserByUserId(userId: string) {
    const user = await this.em.findOne(UserEntity, {
      where: { user_id: userId },
    });
    return user;
  }
  ////
  async createUser(profiles: any, pentity: ProfileMigrationEntity) {
    const data = profiles;
    // console.log('The full data is >>', data);
    try {
      pentity.user_id = data.user_id;
      const userfound = await this.getUserByUserId(data.user_id);
      console.log('userfound', userfound);
      if (!(await this.getUserByUserId(data.user_id))) {
        const fullName = data.fullName ? data.fullName.split(' ') : [];
        const user = new UserEntity();
        if (fullName.length > 1) {
          user.firstName = fullName[0];
          user.lastName = fullName[1];
        }
        user.userName = data.userName + generateCode(3);
        user.country = data.country;
        user.occupation = data.occupation;
        user.region = data.region;
        if (data.social != null && data.social != '') {
          let source = data.social.toLowerCase().trim();
          switch (source) {
            case 'instagram':
              user.bezoSource = SOCIAL.INSTAGRAM;
              break;
            case 'facebook':
              user.bezoSource = SOCIAL.FACEBOOK;
              break;
            case 'whatsapp':
              user.bezoSource = SOCIAL.WHATSAPP;
              break;
            case 'lnkedIn':
              user.bezoSource = SOCIAL.LINKEDIN;
              break;
            case 'twitter':
              user.bezoSource = SOCIAL.TWITTER;
              break;
            case 'youtube':
              user.bezoSource = SOCIAL.YOUTUBE;
              break;
            case 'friend':
              user.bezoSource = SOCIAL.FRIEND;
              break;
          }
        }

        // try {
        //   user.dateOfBirth = new Date(data.dateOfBirth);
        // } catch (error) {
        user.dateOfBirth = new Date();
        //}

        if (data.referralCode) user.referralCode = data.referralCode;
        user.user_id = data.user_id;
        user.gender = data.gender;
        if (data.level == 'advance') {
          user.level = LEVEL.advance;
        }
        let userPaymentMethods = [];
        if (data.payment_method.length > 0) {
          for (let k = 0; k < data.payment_method.length; k++) {
            const paymentMethod = new PaymentMethodEntity();
            paymentMethod.paymentType = PAYMENT_TYPE.mobile_money;
            paymentMethod.network = this.getNetwork(
              data.payment_method[0].network,
            );
            paymentMethod.phoneNumber = data.payment_method[0].phone;
            paymentMethod.default = data.default;
            userPaymentMethods.push(paymentMethod);
          }
        }
        const files: FileEntity[] = [];
        if (data.idPicture) {
          const fileId = new FileEntity();
          fileId.url = [
            `https://storage.googleapis.com/bezosusubucket/${data.idPicture}`,
          ];
          fileId.type = FILE_TYPE.image;
          fileId.appType = APP_TYPE.ID_CARD;
          if (data.idType && data.idType == 'Ghana Card') {
            fileId.idType = ID_TYPE.GHANA_CARD;
          } else if (data.idType && data.idType.trim() == 'Voter') {
            fileId.idType = ID_TYPE.VOTERS_ID;
          } else if (
            data.idType &&
            data.idType.trim().toLowerCase().indexOf('passport') > -1
          ) {
            fileId.idType = ID_TYPE.PASSPORT;
          }
          if (data.idNumber) fileId.idNumber = data.idNumber;
          files.push(fileId);
        }

        if (data.userPicture) {
          const fileUserId = new FileEntity();
          fileUserId.url = [
            `https://storage.googleapis.com/bezosusubucket/${data.userPicture}`,
          ];
          fileUserId.appType = APP_TYPE.SELFIE;
          fileUserId.type = FILE_TYPE.image;
          files.push(fileUserId);
        }
        const address = new AddressEntity();
        address.homeAddress = data.homeAddress;
        address.gpsAddress = data.gpsAddress;
        address.country = data.country;
        address.region = data.region;
        user.address = address;
        user.files = files;
        user.userPaymentMethods = userPaymentMethods;
        user.agreeToTerms = true;
        const authUser = new AuthUserEntity();
        authUser.user = user;
        if (data.phone && data.phone.length) {
          authUser.phone = data.phone[0].phoneNumber;
        }
        if (
          data.password.length &&
          !(await this.ifPasswordExist(data.password[0].password))
        ) {
          authUser.password = data.password[0].password;
        }
        if (data.email) {
          authUser.email = data.email;
        }
        authUser.roles = [AuthUserRole.User];
        console.log('Auth User', authUser);
        await this.em.save(authUser);
        ////
        try {
          ///// ADDING SAVING GOALS

          //await this.createAccountTypes(data.account_type)
          ////////
          pentity.migrated = true;
          await this.em.save(pentity);

          //console.log("Added Profiles")

          return await this.createSavingGoals(
            data.personal_savings,
            data.account,
            data.account_type,
          );
        } catch (error) {}
      } else {
        console.log('User already exist');
      }
    } catch (error) {
      console.log('Error migrating user', error);
      pentity.migrated = false;
      pentity.error = error;
      await this.em.save(pentity);
      const errorData = {
        error,
        data,
      };
      await this.storeErrorData(errorData);
    }
  }

  getAccountsfromList(savinggoalId, accountList) {
    return accountList.find((r) => r._id == savinggoalId);
  }

  async createSavingGoals(items, account, account_types) {
    const migration = new MigrationAccountEntity();
    //////
    //console.log('Starting savinggs goal', items);
    const resp = await Promise.all(
      items.map(async (item, index) => {
        try {
          //console.log('The saving goal name >>' + savingsGoal.name);

          //account[index];
          const accountEnt = this.getAccountsfromList(item.account_id, account);
          let acctType = null;
          if (item.savingGoal === 'Primary') {
            acctType = await this.getPrimaryAccounType();
          } else {
            acctType = await this.getFlexiSaveAccounType();
          }
          const savingAccount = new AccountEntity();

          savingAccount.accountTypeId = acctType.id;
          savingAccount.accountNumber =
            '' + this.getAccountNumber(Number(accountEnt.accountNumber));
          savingAccount.canOverDraw = acctType.canOverDraw;
          savingAccount.allowDeposit = acctType.allowDeposit;
          savingAccount.allowWithdrawal = acctType.allowWithdrawal;
          savingAccount.dailyLimit = acctType.dailyLimit;
          savingAccount.monthlyLimit = acctType.monthlyLimit;

          savingAccount.balance = Number(accountEnt.balance);
          savingAccount.userId = await this.getUserId(item.user_id);
          savingAccount.walletId = await this.getWalletId();
          savingAccount.name = account[index].accountName

          console.log("savingAccount >>",savingAccount)

          const accountDataSaved = await this.em.save(savingAccount);


          //if()
          if(item.savingGoalName!=='Primary'){
            const savingsGoal = new SavingsGoalEntity();
            savingsGoal.name = item.savingGoalName 
            savingsGoal.description = item.savingGoalName;
            savingsGoal.account = account[index];
            savingsGoal.accountId = accountDataSaved.id;
            savingsGoal.frequency = item.frequencyType
              ? this.getFrequencyType(item.frequencyType)
              : FREQUENCY_TYPE.not_available;
            // savings goal type
            if (account_types.length) {
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
            savingsGoal.userId = await this.getUserId(item.user_id);

            delete savingsGoal.account
            console.log('Saving savings Goal before save >>', savingsGoal);
            JSON.stringify(savingsGoal);
            const saved = await this.em.save(savingsGoal);
            console.log('Saved Saving Goal after save>>', saved);
          }
         

          migration.user_id = item.user_id;
          migration.data = item;
          migration.migrated = true;
          return await this.em.save(migration);

          console.log('Migration went through');
        } catch (error) {
          //
          console.log('There was an error saving saving-goal', error);
          migration.migrated = false;
          migration.error = error;
          await this.em.save(migration);
        }
      }),
    );
    return resp;
  }

  async getFlexiSaveAccounType() {
    const accountType = await this.em.findOne(AccountTypeEntity, {
      where: { alias: 'flexi-save' },
    });
    return accountType;
  }

  async getWalletId() {
    const wallet = await this.em.findOne(WalletTypeEntity, {
      where: { name: 'Local' },
    });
    if (wallet) return wallet.id;
    return null;
  }

  async getPrimaryAccounType() {
    const accountType = await this.em.findOne(AccountTypeEntity, {
      where: { alias: 'primary' },
    });
    return accountType;
  }
  getAccountNumber(acc: number) {
    if (acc === 0) return '' + Number(generateCode(10));
    return acc + '';
  }
  async createAccountTypes(data) {
    data.map((accountTypes) => {});
  }

  findGoalType(goalName, goalList) {
    return goalList.find((r) => r.name == goalName);
  }

  async getUserId(id: string) {
    const user = await this.em.findOne(UserEntity, {
      where: { user_id: id },
    });
    if (user) {
      //console.log('getUserId returning>>', user.id);
      return user.id;
    }
    //  console.log('getUserId returning null');
    return null;
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

  async storeErrorData(data: any) {
    const errorData = new ErrorEntity();
    errorData.data = data.data;
    errorData.migrationType = 'profiles';
    if (data.error.detail) errorData.detail = data.error.detail;
    if (data.error.table) errorData.table = data.error.table;
    if (data.error.query) errorData.query = data.error.query;
    // errorData.error = data.error;
    await this.em.save(errorData);
  }

  async getDefaultAccountType(): Promise<AccountTypeEntity> {
    return await this.em.findOne(AccountTypeEntity, {
      where: { name: 'Wallet' },
    });
  }

  async getDefaultWallet(): Promise<WalletTypeEntity> {
    return await this.em.findOne(WalletTypeEntity, {
      where: { name: 'Local' },
    });
  }

  async isPhone(phone) {
    return phone.match(/\d/g).length === 12;
  }

  async phoneExist(phone) {
    return await this.em.findOne(AuthUserEntity, {
      where: { phone },
      relations: ['user'],
    });
  }

  getNetwork(incomingNetwork: string) {
    let network = incomingNetwork.toLowerCase();
    if (network === 'artltigo' || network === 'airteltigo') {
      network = NETWORK.airteltigo;
    }
    if ((<any>Object).values(NETWORK).includes(network.toLowerCase())) {
      return network.toLowerCase() as NETWORK;
    }
  }

  async ifPasswordExist(password: string) {
    return this.em.findOne(AuthUserEntity, {
      where: { password },
    });
  }
}
