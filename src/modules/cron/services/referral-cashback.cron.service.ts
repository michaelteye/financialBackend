import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Equal } from 'typeorm';
// import { SavingsGoalEntity } from "src/modules/savings-goal/entities/savings-goal.entity";
import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { Module } from '@nestjs/common';
// import { InjectSchedule, Schedule, Timeout} from "nest-schedule";
import { GOAL_STATUS } from '../../auth/entities/enums/goal-status.enum';
import {
  isBefore,
  isEqual,
  subMonths,
  intervalToDuration,
  parseISO,
  format,
  differenceInDays,
} from 'date-fns';
import { AccountEntity } from '../../account/entities/account.entity';
import { NotificationService } from '../../notifications/services/notification.service';
// import {Injectable} from '@nestjs/common'
import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { LessThanOrEqual, LessThan } from 'typeorm';
import { number } from 'joi';
import { NOTIFICATIONS } from '../../enums/notification.providers';
import { AccountService } from '../../account/services/account.service';
import { DepositDto } from '../../ussdapi/dtos/deposit.dto';
import { NETWORK } from '../../main/entities/enums/network.enum';
import { DepositInputDto } from '../dtos/debit.dto';
import { PlATFORM } from '../../main/entities/enums/platform.enum';
import { UserPinService } from '../../userpin/services/userpin.service';
import { gen } from 'n-digit-token';
import { deprecate } from 'util';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { TRANSACTION_STATUS } from '../../enums/transaction.status';
import { CustomerAutoDebitEntity } from '../entities/customer.auto.debit.entity';
import { CRON_STATUS } from '../constants/cron.status';
import { uuid } from 'uuidv4';
import { InterestPaymentService } from '../../interest/services/interest-payment.service';
import { ReferralCashbackEntity } from '../../referrals/entities/referralcashback.entity';
import { IntraTransferDto } from '../../account/dtos/transfer-account.dto';
import { TransferService } from '../../transfers/services/transfer.service';
import { ReferralCampaignEntity } from '../../referrals/entities/referral-campaign.entity';
import { AccountDepositWithrawalDto } from '../../transfers/dto/AccountDepositDto';
import { TRANSFER_STATUS_CODE } from '../../transfers/enums/transferstatus.enum';

Injectable();
export class ReferrralCampaignCronService {
  private readonly logger = new Logger('CronService');
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    // @InjectRepository(SavingsGoalEntity)
    // private savingGoalRepository: Repository<SavingsGoalEntity>,
    // private accountGoalRepository: Repository<AccountEntity>,
    // @InjectSchedule() private readonly schedule: Schedule
    private interestPaymentService: InterestPaymentService,
    private transferService: TransferService,
    private notification: NotificationService,
  ) {}

  /**
   *
   * TODO Write comments on each of the functions
   */

  // @Cron(CronExpression.EVERY_DAY_AT_4PM)
  // async startCampaign4To6() {
  //   //1% per anum
  //   this.logger.log('------- START CAMPAING AT 4PM ---------');
  //   this.startCampaign();
  // }

  // async startCampaign() {
  //   const startCam = await this.em.findOne(ReferralCampaignEntity, {
  //     where: [{ status: true }, { status: false }],
  //   });
  //   startCam.status = true;
  //   const ans = await this.em.save(startCam);
  //   console.log('ansa', ans);
  // }

  /* @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async endCampaign4To6() {
    //1% per anum
    this.logger.log('------- END CAMPAING AT 4PM ---------');
    this.endCampaign();
  } */

  // async endCampaign() {
  //   const startCam = await this.em.findOne(ReferralCampaignEntity, {
  //     where: [{ status: true }, { status: false }],
  //   });
  //   startCam.status = false;
  //   const ans = await this.em.save(startCam);
  //   console.log('ansb', ans);
  // }

  // @Cron(CronExpression.EVERY_DAY_AT_NOON)
  @Cron(CronExpression.EVERY_30_MINUTES)
  async payBonusForRefereeVerified() {
    this.logger.log(
      '------- PAY 5 CEDIS TO REFEREES WHO PARTICIPATED IN CAMPAIGN (AFTER VERIFICATION) ---------',
    );
    this.getAllRefereesUsers();
  }

  async getAllRefereesUsers() {
    const result = await this.em.find(ReferralCashbackEntity, {
      where: { status: TRANSACTION_STATUS.PENDING,referreepaidStatus: TRANSACTION_STATUS.PENDING},
    });
    console.log('getAllApprovedUsers', result);

    const chunkSize = 10;
    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize);

      const res = await Promise.all(
        chunk.map(async (dataInput) => {
          await this.checkReferreeAccountStatusAndPay(
            dataInput,
          );
        }),
      );

      console.log('resMain', res);
    }
  }

  async checkReferreeAccountStatusAndPay(data): Promise<any> {
    /// GET DATA FROM REFERRAL CASHBACK

    const query = `SELECT id, "createdAt", "updatedAt", user_id, "firstName", "lastName", "otherName", "userName", "referralCode", "deviceId", country, "dateOfBirth", gender, social, occupation, level, "agreeToTerms", region
    FROM public.user_entity where "level"!='beginner' and "updatedAt">='2023-05-16' and id='${data.referreeId}'`;

    const result = await this.em.query(query);
   

    if (result.length > 0) {
      console.log('result >>> check referral side iron 2', result);
      const primaryAccountofReferrer = await this.em.findOne(AccountEntity, {
        where: {
          name: 'Primary',
          userId: data.referreeId,
        },
      });

      console.log("primaryAccountofReferrer",primaryAccountofReferrer)


      const deposit = new AccountDepositWithrawalDto();
      deposit.amount = Number(5);
      deposit.accountId = primaryAccountofReferrer.id;
      deposit.narration = `Id Verification`;
      let depositResponse = await this.transferService.userAccountDeposit(
        deposit,
      );

      console.log("depositResponse>>>pay referees",depositResponse)
      if (depositResponse.statusCode == TRANSFER_STATUS_CODE.SUCCESS) {

        console.log("DEPOSIT WORKED")

        const resCashBack = await this.em.findOne(ReferralCashbackEntity, {
          where: { referreeId: data.referreeId },
        });
        resCashBack.referreepaidStatus = TRANSACTION_STATUS.SUCCESS;
        await this.em.save(resCashBack);
        /// SEND SMS
        // const authUserPhone = await this.em.findOne(AuthUserEntity, {
        //   where: {
        //     userId: primaryAccountofReferrer.userId,
        //   },
        // });
        // await this.notification.sendSms({
        //   to: authUserPhone.phone,
        //   sms: '',
        // });

      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2PM)
  async payInterestForBezoFlexUsers() {
    //1% per anum
    this.logger.log(
      '------- CHECK APPROVED USERS FROM BEGINNER / ADVANCE/INTERMEDIATE ---------',
    );
    //  console.log('sdfdsfsdf');
    // code here
    this.getAllApprovedUsers();
  }

  async getAllApprovedUsers() {
    const result = await this.em.find(ReferralCashbackEntity, {
      where: { status: TRANSACTION_STATUS.PENDING },
    });
    console.log('getAllApprovedUsers', result);

    const chunkSize = 20;
    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize);

      const res = await Promise.all(
        chunk.map(async (dataInput) => {
          await this.checkReferedUserAndTransferToReferrerPrimaryAccount(
            dataInput,
          );
        }),
      );
      console.log('resMain', res);
    }
  }

  async checkReferedUserAndTransferToReferrerPrimaryAccount(
    data,
  ): Promise<any> {
    /// GET DATA FROM REFERRAL CASHBACK

    const query = `SELECT id, "createdAt", "updatedAt", user_id, "firstName", "lastName", "otherName", "userName", "referralCode", "deviceId", country, "dateOfBirth", gender, social, occupation, level, "agreeToTerms", region
    FROM public.user_entity where "level"='beginner' and "updatedAt">='2023-05-16' and id='${data.referreeId}'`;

    const result = await this.em.query(query);
    console.log('result >>> check referral side', result);

    if (result.length > 0) {
      const INFLUENCER_REF_ID_IN_REFERRAL_ENTITY = [
        '16c937b9-5d9e-4775-ab60-b14b2891660e',
        'd94693ed-7b01-49e3-87df-9929effa423d',
        '8d21dec1-e72a-4ce9-be3a-aebbae7b4134',
        'ed272d65-fd98-4564-b0b4-f23f041a4ea1',
        '34d3c96b-7d99-4ab4-a4e6-19dd8bdea0c0',
        '7e6d4e55-e038-40a4-9d61-bfced072ecf4',
        '25e396d5-f3cf-49ee-b2f4-2a918d3fc944',
        '7cc3497d-4f2a-4c1d-9880-85b48a8622fa',
        '2be11b33-672c-49de-a953-f6a0b6d6e17a',
        'f896db89-def6-42a0-b7ed-d5c5c49208ba',
        '229217cc-b81c-47a3-8a90-5b9a33d9fcb1',
        '90a8c049-afbb-4743-a04c-fcff9fc873bb',
        '56dfbb70-9198-459f-a764-12cb1bf60c32',
        'e5ce0403-cbcd-46e4-bfbb-a9fadfc80416',
        '53f9ac87-3226-4b56-ae3e-7f391badff03',
        '1a956958-5d0e-43b2-94da-139f02bd1127',
        '24f51db6-7e19-454a-92b6-4137547289fd',
        '88acd63b-a049-4c4f-927f-a3e96403479c',
      ];

      if (INFLUENCER_REF_ID_IN_REFERRAL_ENTITY.includes(data.referrerId)) {
        console.log('FOUND IN INFLUENCER');
        const referralAccountofReferree = await this.em.findOne(AccountEntity, {
          where: {
            name: 'Referral Bonus',
            userId: data.referreeId,
          },
        });

        console.log('referralAccountofReferree', referralAccountofReferree);

        if (referralAccountofReferree) {
          referralAccountofReferree.allowWithdrawal = true;

          await this.em.save(referralAccountofReferree);

          const primaryAccountofReferree = await this.em.findOne(
            AccountEntity,
            {
              where: {
                name: 'Primary',
                userId: data.referreeId,
              },
            },
          );

          const checker = Number(referralAccountofReferree.balance) - 10;

          if (checker >= 0) {
            const transToPrimary = new IntraTransferDto();
            transToPrimary.amount = 10;
            transToPrimary.fromAccountId = referralAccountofReferree.id;
            transToPrimary.toAccountId = primaryAccountofReferree.id;

            await this.transferService.intraAccountTransferWithoutAuthorization(
              transToPrimary,
            );

            const referralAccountofReferreeB = await this.em.findOne(
              AccountEntity,
              {
                where: {
                  name: 'Referral Bonus',
                  userId: data.referreeId,
                },
              },
            );

            console.log(
              'referralAccountofReferreeB',
              referralAccountofReferreeB,
            );

            referralAccountofReferreeB.allowWithdrawal = false;

            await this.em.save(referralAccountofReferreeB);

            //// MARK CASHBACK TABLE TO BE SUCCESS

            const resCashBack = await this.em.findOne(ReferralCashbackEntity, {
              where: { referreeId: data.referreeId },
            });
            console.log('resCashBack', resCashBack);
            resCashBack.status = TRANSACTION_STATUS.SUCCESS;

            console.log('SAVING REFER CASHBACK', resCashBack);
            await this.em.save(resCashBack);

            /// SEND SMS

            const authUserPhone = await this.em.findOne(AuthUserEntity, {
              where: {
                userId: primaryAccountofReferree.userId,
              },
            });
          }
        }
      } else {
        const referralAccountofReferrer = await this.em.findOne(AccountEntity, {
          where: {
            name: 'Referral Bonus',
            userId: data.referrerId,
          },
        });

        if (referralAccountofReferrer) {
          referralAccountofReferrer.allowWithdrawal = true;

          await this.em.save(referralAccountofReferrer);

          const primaryAccountofReferrer = await this.em.findOne(
            AccountEntity,
            {
              where: {
                name: 'Primary',
                userId: data.referrerId,
              },
            },
          );

          const checker = Number(referralAccountofReferrer.balance) - 5;

          if (checker >= 0) {
            const transToPrimary = new IntraTransferDto();
            transToPrimary.amount = 5;
            transToPrimary.fromAccountId = referralAccountofReferrer.id;
            transToPrimary.toAccountId = primaryAccountofReferrer.id;

            await this.transferService.intraAccountTransferWithoutAuthorization(
              transToPrimary,
            );

            const referralAccountofReferrerB = await this.em.findOne(
              AccountEntity,
              {
                where: {
                  name: 'Referral Bonus',
                  userId: data.referrerId,
                },
              },
            );

            referralAccountofReferrerB.allowWithdrawal = false;

            await this.em.save(referralAccountofReferrerB);

            //// MARK CASHBACK TABLE TO BE SUCCESS

            const resCashBack = await this.em.findOne(ReferralCashbackEntity, {
              where: { referreeId: data.referreeId },
            });
            resCashBack.status = TRANSACTION_STATUS.SUCCESS;
            await this.em.save(resCashBack);

            /// SEND SMS

            const authUserPhone = await this.em.findOne(AuthUserEntity, {
              where: {
                userId: primaryAccountofReferrer.userId,
              },
            });
            //   await this.notification.sendSms({
            //     to:authUserPhone.phone,
            //     sms:''
            //   })
          }
        }
      }
    }
  }
}
