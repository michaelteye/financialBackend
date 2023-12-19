import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
import { JwtManagerService } from '../../auth/services/jwt-manager.service';
import { PasswordEncoderService } from '../../auth/services/password-encorder.service';
import { UserEntity } from '../../main/entities/user.entity';
import { EntityManager } from 'typeorm';
import { MandateEntity } from '../../transactions/entities/mandate.entity';
import { MandateStatus } from '../../enums/mandate.status.enum';
import { AccountEntity } from '../../account/entities/account.entity';
import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
import { DEPOSIT_PREFERENCE } from '../../main/entities/enums/deposittype.enum';
import { FREQUENCY_TYPE } from '../../main/entities/enums/savingsfrequency.enum';
import { FrequencyTypes } from '../../enums/frequency-types.enum';

@Console()
export class MigrateMandatesCommand {
  private db: Connection;
  constructor(
    private em: EntityManager,
    private passwordHash: PasswordEncoderService,
    private readonly jwtManager: JwtManagerService,
    @InjectConnection() private connection: Connection,
  ) {
    this.db = this.connection.useDb('bezosusuDBLive');
  }

  @Command({
    command: 'migrate:mandates',
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
    await this.migrateMandates();
  }

  // load investment



  async getMandates() {
    const mandates = await this.db
      .collection('mandate')
      .find({})
      // .find({

      //   mandateId: {
      //     $in:
      //       ['1656886055246',
      //         '1657158631284',
      //         '1658138994002',]
      //   }

      // })
      .toArray();
    return mandates;
  }


  async migrateMandates() {
    const mandates = await this.getMandates();


    const res = await Promise.all(
      mandates.map(async (r) => {
        return await this.createMandate(r)
      })
    )

    console.log("res", res)

    console.log('No of mandates found>>', mandates.length);

    // for (let i = 0; i < mandates.length; i++) {
    //    await this.createMandate(mandates[i])
    // }

    // return 'done'
  }
  //
  async createMandate(doc: any) {
    const mandate = new MandateEntity();
    console.log('Query user_id', doc.user_id);
    let userId = await this.getUserId(doc.user_id);

    if (userId) {
      console.log('Got userId>>', userId)
      mandate.userId = userId;
      mandate.mandateId = doc.mandateId;
      mandate.phoneNumber = doc.clientPhone;
      mandate.startDate = new Date()
      mandate.endDate = new Date()
      mandate.reference = doc.mandateId;
      mandate.frequencyType = FrequencyTypes.DAILY
      mandate.frequency = "NotAvailable"
    //  mandate.debitDay = 'Monday'
      if (doc.status == 'active') {
        console.log('The mandate is active>>');
        mandate.status = MandateStatus.ACTIVE;
        console.log('The doc refNo', doc.savingsRefNo)
        if (doc.savingsRefNo) {
          let goal = await this.getMatchingSavingsGoal(userId, doc.savingsRefNo);
          if (goal) {
            if (goal.startDate) {
              mandate.startDate = goal.startDate
            }
            if (goal.endDate) {
              mandate.endDate = goal.endDate;
            }
            mandate.amount = goal.amountToSave;
            console.log('Goal found with userId and savingsRef')
            mandate.accountId = goal.accountId;

          } else {
            console.log('Goal Not found with savingsRef')
            let goals = await this.getUsersSavingsGoals(userId);
            if (goals.length == 1) {
              console.log('Got all savings goals one item found')
              mandate.accountId = goals[0].accountId;
            } else {
              console.log('Got all savings goals multiple items found')
              let goal1s = goals.filter(g => g.preference == DEPOSIT_PREFERENCE.automatic);
              if (goal1s.length == 1) {
                console.log('Filtered multiple to one autod deduct item')
                mandate.accountId = goal1s[0].accountId;
              } else {
                console.log('Multiple auto deducts using primary account', doc)
                let primaryAccount = await this.getUerPrimaryAccount(userId);
                mandate.accountId = primaryAccount.id;
              }
            }
          }

        } else {
          console.log('No savings ref for active mandate', doc);
          let goals = await this.getUsersSavingsGoals(userId);
          if (goals.length == 1) {
            console.log('One savings goal found for mandate with no savingsRef', doc);
            mandate.accountId = goals[0].accountId;
            mandate.amount = goals[0].amountToSave;
          } else {
            console.log('Multiple savings goals found for mandate with no savingsRef', doc);
            let goal1s = goals.filter(g => g.preference == DEPOSIT_PREFERENCE.automatic);
            if (goal1s.length == 1) {
              console.log('Filtered to one Multiple savings goals found for mandate with no savingsRef', doc);
              mandate.accountId = goal1s[0].accountId;
              mandate.amount = goal1s[0].amountToSave;
            } else {
              console.log('More than one found for filter using primary account for mandate with no savingsRef', doc);
              let primaryAccount = await this.getUerPrimaryAccount(userId);
              mandate.accountId = primaryAccount.id;
            }
          }
        }

        mandate.createdAt = await this.isValidDate(doc.createdAt);
        mandate.updatedAt = await this.isValidDate(doc.updatedAt);

      } else {
        let primaryAccount = await this.getUerPrimaryAccount(userId);
        mandate.accountId = primaryAccount.id;
        mandate.status = MandateStatus.DEACTIVATED;
      }

      try {

        //  const checkAccountIdExistence= await this.em.findOne(MandateEntity,{
        //     where:{accountId:doc.accountId}
        //   })


        return await this.em.save(mandate);

      } catch (error) {
        console.log("Error >>>", error)

      }



    } else {
      console.log("Not Found>>>", doc.clientPhone)
    }

  }

  async getMatchingSavingsGoal(userId: string, savingsRef: string) {
    let accounts = await this.em.findOne(SavingsGoalEntity, { where: { userId: userId, refNo: savingsRef } });
    return accounts;
  }

  async getUsersSavingsGoals(userId: string) {
    let accounts = await this.em.find(SavingsGoalEntity, { where: { userId: userId } });
    return accounts;
  }

  async getUerPrimaryAccount(userId: string) {
    let account = await this.em.findOne(AccountEntity, { where: { userId: userId, name: 'Primary' } });
    return account;
  }

  async isValidDate(date: string) {
    const timestamp = Date.parse(date);
    if (isNaN(timestamp) == false) {
      return new Date(timestamp);
    }
    return new Date();
  }

  async getUserId(id: string) {
    const user = await this.em.findOne(UserEntity, {
      where: { user_id: id },
    });
    if (user) {
      return user.id;
    }
    return null;
  }


}
