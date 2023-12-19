import { ReferralEntity } from '../entities/referral.entity';
import { EntityManager, Not, Repository } from 'typeorm';
import { ReferralDto, ReferralInputDto } from '../dtos/referrals.dto';
import { AccountEntity } from '../../account/entities/account.entity';
import { STATUS } from '../../../../src/modules/auth/entities/enums/status.enum';
import { AppRequestContext } from '../../../../src/utils/app-request.context';
import { getAppContextALS } from '../../../../src/utils/context';
import { GOAL_STATUS } from '../../../../src/modules/auth/entities/enums/goal-status.enum';
import {
  Inject,
  HttpException,
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { generateCode } from '../../../utils/shared';
import { WalletTypeEntity } from '../../wallet/entities/wallet.entity';
import { DEPOSIT_PREFERENCE } from '../../main/entities/enums/deposittype.enum';
import { UserEntity } from '../../main/entities/user.entity';
import { ReferredUserEntity } from '../entities/reffered_user.entity';
import { Like } from 'typeorm';

export class ReferralService {
  constructor(
    @InjectRepository(ReferralEntity)
    private referralRepository: Repository<ReferralEntity>,
    // private userRepository: Repository<UserEntity>,
    private em: EntityManager,
  ) {}

  async createReferral(referralData: ReferralDto): Promise<ReferralEntity> {
    const ctx = getAppContextALS<AppRequestContext>();
    console.log('ctx', ctx);
    // const user = await this.em.find(ReferralEntity,{
    //     where:{userId},
    // });
    // if (!user) {
    //   throw new Error(`User with id ${referralData.userId} not found`);
    // }
    // export class ReferralService {

    // testing the referral code for generating referral code using the both the firstname and lastname
    const user = await this.em.findOne(UserEntity, {
      where: { id: ctx.authUser.userId },
    });

    let newReferralCode = await this.generateRefUserName(
      user.firstName,
      user.lastName,
    );

    // let i = 1;
    // while(await this.em.findOne(ReferralEntity,{where: {code:newReferralCode}})){
    //   newReferralCode  = referrerNewCode + i.toString().padStart(2, '0');
    //   i++;
    // }

    const referral = new ReferralEntity();
    // referral.code = referralData.code;
    referral.code = newReferralCode;
    referral.user = ctx.authUser.user;
    referral.userId = ctx.authUser.userId;
    referral.createdAt = referralData.createdAt
      ? new Date(referralData.createdAt)
      : new Date();
    //  const address = await this.em.findOne(AddressEntity,{where:{userId}})

    console.log('Referral values are >>>', referral);
    return this.em.save(referral) as unknown as any;
  }

  async getUserReferrals(id: any): Promise<any> {
    const ctx = getAppContextALS<AppRequestContext>();

    return await this.em.find(ReferredUserEntity, {
      where: {
        // userId: ctx.authUser.userId,
        referrerId: id,
      },
      relations: ['user'],
    });
  }

  async verifyReferralCode(input: any): Promise<any> {
    const getReferrerData = await this.em.findOne(ReferralEntity, {
      where: { code: input.code },
    });

    console.log('getReferrerData', getReferrerData);
    if (!getReferrerData) {
      throw new BadRequestException('Invalid Referral Code');
    }
    return {
      status: 'VALID',
      message: 'VALID',
    };
  }

  async getUserReferrerAndReferee(): Promise<any> {
    const query = `SELECT referral_entity.id,user_entity."firstName",user_entity."lastName",user_entity."userName",file_entity."url",auth_user_entity."phone",referral_entity."id" as "referrerId", COUNT(*) AS count
        FROM public.referred_user_entity
        INNER JOIN public.referral_entity ON referral_entity."id" = referred_user_entity."referrerId"
		INNER JOIN public.auth_user_entity ON auth_user_entity."userId" = referral_entity."userId"
        LEFT JOIN public.user_entity ON user_entity.id = referral_entity."userId"
        LEFT JOIN public.file_entity ON file_entity."userId" = user_entity.id AND file_entity."appType"='PROFILE'
        GROUP BY referral_entity.id, user_entity.id,file_entity.id,auth_user_entity."phone"  order by count desc`;
    const result = await this.em.query(query);

    const res = [];
    const chunkSize = 20;
    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize);

      return await Promise.all(
        chunk.map(async (dataInput) => {
          const ref = await this.getUserReferrals(dataInput.referrerId);

          if (ref.length > 0) {
            const abRef = await this.em.findOne(ReferralEntity, {
              where: { id: dataInput.referrerId },
            });
            const user = await this.em.findOne(UserEntity, {
              where: { id: abRef.userId },
            });

            const deStructUser = { ...user, phone: dataInput.phone };
            return { user: deStructUser, referred: ref };
          } else {
            const abRef = await this.em.findOne(ReferralEntity, {
              where: { id: dataInput.referrerId },
            });
            const user = await this.em.findOne(UserEntity, {
              where: { id: abRef.userId },
            });
            const deStructUser = { ...user, phone: dataInput.phone };
            return { user: deStructUser, referred: [] };
          }
        }),
      );
    }

    return res;
  }

  async getleaderBoard(): Promise<any> {
    const query = `SELECT referral_entity.id,user_entity."firstName",user_entity."lastName",user_entity."userName",file_entity."url", COUNT(*) AS count
        FROM public.referred_user_entity
        INNER JOIN public.referral_entity ON referral_entity."id" = referred_user_entity."referrerId"
        LEFT JOIN public.user_entity ON user_entity.id = referral_entity."userId"
        LEFT JOIN public.file_entity ON file_entity."userId" = user_entity.id AND file_entity."appType"='PROFILE'
        GROUP BY referral_entity.id, user_entity.id,file_entity.id   order by count desc limit 10`;

    const result = await this.em.query(query);
    return result;
  }

  async getBezoStaffleaderBoard(): Promise<any> {
    const query = `select ue.id, ue."firstName", ue."lastName" from user_entity ue

      join auth_user_entity aue
      
      on ue.id = aue."userId"
      
      where aue.roles::text ilike '%User,BezoStaff%'`;

    const result = await this.em.query(query);

    const res = [];
    const chunkSize = 20;
    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize);

      const resAfter = await Promise.all(
        chunk.map(async (dataInput) => {
          return await this.joinBezoStaffWithReferredUsers(dataInput);
        }),
      );
      res.push(resAfter);
    }

    return res;
  }

  async joinBezoStaffWithReferredUsers(data): Promise<any> {
    const getReferrerData = await this.em.findOne(ReferralEntity, {
      where: { userId: data.id },
    });

    console.log('getReferrerData', getReferrerData);

    if (!getReferrerData) {
      console.log('Referral code does not exist');
    }

    /// GET NUMBER OF REFERRALS BY A USER
    const countUsersReferred = await this.em.find(ReferredUserEntity, {
      where: { referrerId: getReferrerData.id },
    });

    const rest = await Promise.all(
      countUsersReferred.map(async (r) => {
        const bindedUsers = await this.em.findOne(UserEntity, {
          where: {
            id: r.userId,
          },
          relations: ['accounts'],
        });

        const trimAccounts = bindedUsers.accounts.map((r) => {
          return { balance: r.balance, userId: r.userId, name: r.name };
        });
        return {
          firstName: bindedUsers.firstName,
          lastName: bindedUsers.lastName,
          accounts: trimAccounts,
        };
      }),
    );

    return {
      firstName: data.firstName,
      lastName: data.lastName,
      referredUsers: rest,
      referredCount: countUsersReferred.length,
    };
  }

  async getCampusMaverickReferral(): Promise<any> {
    const query = `select ue.id, ue."firstName", ue."level", ue."lastName",aue."userId" from user_entity ue
    join auth_user_entity aue
    
    on ue.id = aue."userId"
   WHERE aue."phone" in ('233593184193',
    '233245189223',
    '233506227129',
    '233592902242',
    '233241662019',
    '233598821428',
    '233244466867',
    '233244466867',
    '233241662019',
    '233595161490',
    '233557222347',
    '233531525055',
    '233240648605',
    '233279844896',
    '233553285695'
    )`;

    const result = await this.em.query(query);

    const res = [];
    const chunkSize = 20;
    for (let i = 0; i < result.length; i += chunkSize) {
      const chunk = result.slice(i, i + chunkSize);

      const resAfter = await Promise.all(
        chunk.map(async (dataInput) => {
          return await this.campusMaverickReferredUsers(dataInput);
        }),
      );
      res.push(resAfter);
    }

    return res;
  }

  /////REFERRAL  CAMPUS MAVERICKS

  async campusMaverickReferredUsers(data): Promise<any> {
    const getReferrerData = await this.em.findOne(ReferralEntity, {
      where: { userId: data.userId },
    });

    console.log('getReferrerData', getReferrerData);

    if (!getReferrerData) {
      console.log('Referral code does not exist');
    }

    /// GET NUMBER OF REFERRALS BY A USER
    const countUsersReferred = await this.em.find(ReferredUserEntity, {
      where: { referrerId: getReferrerData.id },
    });

    const rest = await Promise.all(
      countUsersReferred.map(async (r) => {
        const bindedUsers = await this.em.findOne(UserEntity, {
          where: {
            id: r.userId,
          },
          relations: ['accounts'],
        });

        const trimAccounts = bindedUsers.accounts.map((r) => {
          return { balance: r.balance, userId: r.userId, name: r.name };
        });
        return {
          firstName: bindedUsers.firstName,
          lastName: bindedUsers.lastName,
          level:bindedUsers.level,
          accounts: trimAccounts,
        };
      }),
    );

    return {
      firstName: data.firstName,
      lastName: data.lastName,
      level:data.level,
      referredUsers: rest,
      referredCount: countUsersReferred.length,
    };
  }

  async getSignUpAndroidIos(): Promise<any> {
    const query = `SELECT 
      COUNT(*) FILTER (WHERE "signUpchannel" = 'ios') AS "iosCount", 
      COUNT(*) FILTER (WHERE "signUpchannel" = 'android') AS "androidCount"
  FROM public.auth_user_entity;`;

    const result = await this.em.query(query);
    return result;
  }

  async generateRefUserName(firstName, lastName) {
    let userName = firstName.slice(0, 3) + lastName.slice(0, 3);

    console.log('username is >>', userName);
    const queryStatement = `SELECT * FROM referral_entity 
        WHERE code LIKE '${userName}%`;

    console.log('the queryStatement is >>>', queryStatement);

    const result = await this.em.query(queryStatement);
    console.log('result', result);

    if (result.length > 0) {
      userName = userName + result.length + 1;
    }
    return userName;
  }
}
