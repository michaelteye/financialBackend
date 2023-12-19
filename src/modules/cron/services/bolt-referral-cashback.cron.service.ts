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
import { LessThanOrEqual, LessThan ,Not} from 'typeorm';

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
import { ReferralBoltEntity } from '../../referrals/entities/referral-bolt.entity';

Injectable();
export class BoltReferrralCampaignCronService {
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



  // @Cron(CronExpression.EVERY_DAY_AT_NOON)
//   @Cron(CronExpression.EVERY_30_MINUTES)
  @Cron(CronExpression.EVERY_3_HOURS)
  async payBonusForRefereeVerified() {
    this.logger.log(
      '------- SEND BOLT DISCOUNT CODES 10 ---------',
    );
    this.getAllBoltRefereesUsers();
  }

 

  async getAllBoltRefereesUsers() {
    // const result = await this.em.find(ReferralBoltEntity, {
    //   where: { status: TRANSACTION_STATUS.PENDING, userId: Not(NULL)},
    // });

    const query=`SELECT id, "createdAt", "updatedAt", code, status, "userId"
	FROM public.referral_bolt_entity where "status"='PENDING' and "userId"  is NOT NULL`
    
    const result= await this.em.query(query)
    console.log('getAllBolt Discounts Payments', result);

    const chunkSize = 10;
    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize);

      const res = await Promise.all(
        chunk.map(async (dataInput:ReferralBoltEntity) => {
          await this.checkReferreeAccountStatusAndSendBoltDiscountCode(dataInput);
        }),
      );

      console.log('resMain', res);
    }
  }

  async checkReferreeAccountStatusAndSendBoltDiscountCode(data:ReferralBoltEntity): Promise<any> {
    /// GET DATA FROM REFERRAL CASHBACK

    const query = `SELECT id, "createdAt", "updatedAt", user_id, "firstName", "lastName", "otherName", "userName", "referralCode", "deviceId", country, "dateOfBirth", gender, social, occupation, level, "agreeToTerms", region
    FROM public.user_entity where "level"!='beginner' and id='${data.userId}'`;

    const result = await this.em.query(query);
   

    if (result.length > 0) {
      console.log('result >>> check referral side iron 2', result);
      

      data.status = TRANSACTION_STATUS.SUCCESS;
      await this.em.save(ReferralBoltEntity,{...data});
        /// SEND SMS
        const authUserPhone = await this.em.findOne(AuthUserEntity, {
          where: {
            userId: data.userId,
          },
        });
        await this.notification.sendSms({
          to: authUserPhone.phone,
          sms: `Hurray!. You just completed your verification on Bezo. Welcome to our community!Use your unique Bolt promo code ${data.code} to enjoy GHS10 off your next ride.Thanks!`,
        });

      }
    }
  

 
}
