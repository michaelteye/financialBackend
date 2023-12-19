import { uuid } from 'uuidv4';
import { AppRequestContext } from './../../../utils/app-request.context';
import { getAppContextALS } from '../../../utils/context';
import { StreakEntity } from './../entities/streak.entity';
import { Injectable, HttpException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
} from 'date-fns';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { Repository, EntityManager } from 'typeorm';
import { Between } from 'typeorm/find-options/operator/Between';
import { LessThanOrEqual } from 'typeorm/find-options/operator/LessThanOrEqual';
import { MoreThanOrEqual } from 'typeorm/find-options/operator/MoreThanOrEqual';
import { TransactionService } from '../../transactions/services/transaction.service';
import {
  StreakRecordInputDto,
  StreakRecordResponseDto,
} from '../dtos/streak.dto';
import { PaymentMethodEntity } from '../../main/entities/paymentmethod.entity';

import { AccountEntity } from '../../account/entities/account.entity';
import { UserPinService } from '../../userpin/services/userpin.service';
import { captureRejectionSymbol } from 'events';
import { StreakUpdateDTO } from '../dtos/streak.update.dto';
Injectable();
export class StreakService {
  constructor(
    @InjectRepository(TransactionEntity)
    @InjectRepository(PaymentMethodEntity)
    @InjectRepository(AccountEntity)
    private em: EntityManager,
  ) {}

  async getUsersStreak(userId: string): Promise<any> {
    const transaction = await this.em.find(StreakEntity, {
      where: {
        // transactionId: TRANSACTION_TYPE.DEPOSIT,
        userId: userId,
        isstreak: true,
        datedon: Between(this.getStartOfWeek(), this.getEndOfWeek()),
      },

      order: {
        id: 'DESC',
      },
    });

    if (transaction.length) {
      console.log('transaction>>', transaction);
      const dayData = await this.getDayData();

      console.log('dayData', dayData);

      let formatted = transaction.map((item) => {
        dayData[this.getDayOfTheWeek(item.datedon)] = {
          status: item.accountId ? true : false,
          fullDate: item.datedon,
        };
        return dayData;
      });

      // checking if the date was not provided by the user.
      if (!formatted.length) {
        let formatted = dayData;
        return formatted;
      }

      // console.log('the formatted is >>', formatted);

      const unique = formatted.length
        ? this.uniqueArray(formatted)[0]
        : formatted;
      // console.log('unique', unique);
      const intervals = await this.getDayInterval(
        this.getStartOfWeek(),
        this.getEndOfWeek(),
      );
      console.log('interval length  is >>>', intervals.length);

      for (let i = 0; i <= intervals.length; i++) {
        if (intervals[i]) {
          const intDay = this.getDayOfTheWeek(intervals[i]);
          console.log(intDay);
          const intervalData = unique[intDay];
          unique[intDay] = {
            ...intervalData,
            fullDate:
              intervalData.status === false
                ? intervals[i]
                : intervalData.fullDate,
          };
        }
      }

      return unique;
    } else {
      return await this.getDayData();
    }
  }

  uniqueArray(arr) {
    const filteredArr = arr.reduce((acc, current) => {
      const x = acc.find((item) => item.day === current.day);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);
    return filteredArr;
  }

  async getDayData() {
    return {
      Monday: { status: false, fullDate: null },
      Tuesday: { status: false, fullDate: null },
      Wednesday: { status: false, fullDate: null },
      Thursday: { status: false, fullDate: null },
      Friday: { status: false, fullDate: null },
      Saturday: { status: false, fullDate: null },
      Sunday: { status: false, fullDate: null },
    };
  }

  async get(id: string): Promise<StreakUpdateDTO> {
    const ctx = getAppContextALS<AppRequestContext>();
    return (await this.em.findOne(StreakEntity, {
      where: { userId: id },
    })) as unknown as StreakUpdateDTO;
  }

  // implementing the date of the week

  getDayOfTheWeek(date) {
    //const format = require('date-fns/format');
    return format(new Date(date), 'eeee');
  }
  async getDayInterval(start, end) {
    //var eachDayInterval = require('date-fns/eachDayOfInterval');
    //var addDays = require('date-fns/addDays');
    const newEnd = addDays(end, 1);
    return eachDayOfInterval({
      start: new Date(start),
      end: new Date(newEnd),
    });
  }
  // implement start of week

  getStartOfWeek() {
    const results = startOfWeek(new Date(), { weekStartsOn: 1 });
    console.log(results);
    return results;
  }
  getEndOfWeek() {
    const results = endOfWeek(new Date(), {
      weekStartsOn: 0,
    });
    console.log(results);
    return results;
  }

  async saveStreak(input: any, transaction: any) {
    console.log('Input to save Streak >>>', input);

    console.log('transaction @ streak', transaction);

    // const streak = new StreakEntity();
    // streak.userId = input.userId;
    // streak.datedon = input.createdAt ? new Date(input.createdAt) : new Date();
    // streak.transactionId = transaction.transactionId
    // streak.accountId = transaction.accountId;

    //  streak.transaction = transaction;
    //streak.user = ctx.authUser.user;

    //console.log("streak",streak)

    //.console.log("streak",streak)

    // await this.em.insert(StreakEntity, {
    //   userId: input.userId,
    //   datedon: input.createdAt ? new Date(input.createdAt) : new Date(),
    //   transactionId: transaction.transactionId,
    //   accountId: transaction.accountId,
    // });

    const newDate= input.createdAt ? format(new Date(input.createdAt), "yyyy-MM-dd'T'HH:mm:ss")  : format(new Date(), "yyyy-MM-dd'T'HH:mm:ss") 
    const query= `INSERT into streak_entity("userId","datedon","transactionId","accountId")
     values('${input.userId}','${newDate}',
     '${transaction.transactionId}','${transaction.accountId}') `
     await this.em.query(query)
  }

  async updateStreak(id: any) {
    const streak: StreakEntity = await this.get(id);
    streak.isstreak = true;
    this.em.save(streak);
  }
}
// {
//   "amount": 1000,
//   "accountId": "0fb1fc28-0857-4015-aee5-be9045f164f8",
//   "verificationId": "b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a",
//   "network": "vodafone or mtn or airteltigo",
//   "description": "Transfer to mummy",
//   "createdAt": "Transfer to mummy"
// }

// for database
// insert into "streak_entity"("userId","accountId","transactionId","datedon")
// values('be724552-935f-45fd-a1d6-d7801b80fbc6','07cc4928-6d2d-4dcd-b525-10c98978fa64','21','2023-01-12 02:03:50.662752')
// 78a29301-67ee-4e60-b771-ab0348bcce99
//
