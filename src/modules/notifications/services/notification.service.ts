import { Injectable } from '@nestjs/common';
import { FcmService } from 'nestjs-fcm';
import * as firebaseAdmin from 'firebase-admin';
import { Between, EntityManager, FindManyOptions } from 'typeorm';
import { UserEntity } from '../../main/entities/user.entity';
import { NotificationDto } from '../dtos/notification.dto';
import { getAppContextALS } from '../../../../src/utils/context';
import { AppRequestContext } from '../../../../src/utils/app-request.context';
import { DeviceEntity } from '../../../../src/modules/main/entities/device.entity';

import { HttpRequestService } from '../../shared/services/http.request.service';
import { HttpStatus } from '@nestjs/common/enums';
import { HttpException } from '@nestjs/common/exceptions';

// Michael Implementation

import { NotificationEntity } from '../entities/notification.entity';
import { startOfMonth, subMonths } from 'date-fns';
import { PushNotificationEntity } from '../entities/push-notification.entity';
import { TRANSACTION_TYPE } from 'src/modules/enums/transaction-type.enum';

export type NotificationResponse = {
  failureCount: number;
  successCount: number;
  failedDeviceIds: any[];
};

export interface EmailInterface {
  userId?: string;
  subject: string;
  message: string;
  to: string | [];
  from: string;
  template: {
    provider: string;
    name: string;
    data: any;
  };
}
export interface SmsInterface {
  userId?: string;
  to: string | string[];
  sms: string;
  provider?: string;
}

export interface EmailSMSInterface {
  userId?: string;
  to: string | [];
  sms: string;
  from: string;
  subject: string;
  message: string;
  toemail: string;
  template: {
    provider: string;
    name: string;
    data: any;
  };
}

export interface NotificationInterface {
  to?: string | [];
  sms?: string;
  from?: string;
  subject?: string;
  message?: string;
  pushProvider?: string;
  smsProvider?: string;
  email?: string;
  sendPush?: string;
  mobile?: string;
  template?: { provider?: string; name?: string; data: any };
  data: Object;
  deviceId?: string[];
  activityType: string;
  userId: string;
  receipientId?:string;
  receipientMessage?: string;
  receipientSubject?: string;
}

@Injectable()
export class NotificationService extends HttpRequestService {
  constructor(private service: FcmService, private em: EntityManager) {
    // private em: EntityManager,
    super();
  }

  async sendUsersNotifications(input: NotificationDto) {
    const ctx = getAppContextALS<AppRequestContext>();
    const userDevice = await this.em.findOne(DeviceEntity, {
      where: { userId: ctx.authUser.userId },
    });
    const sendNotification = await this.sendNotifications(
      [userDevice.deviceId],
      input.title,
      input.message,
    );
    return sendNotification;
  }

  async sendNotifications(
    devices: string[],
    title: string,
    message: string,
  ): Promise<NotificationResponse> {
    const payload: firebaseAdmin.messaging.MessagingPayload = {
      notification: {
        title: title,
        body: message,
      },
    };
    return await this.service.sendNotification(devices, payload, true);
  }

  async userDevices(): Promise<any[]> {
    const users: UserEntity[] = await this.em.find(UserEntity, {
      relations: ['devices'],
    });
    return users.flatMap((user) =>
      user.devices.map((device) => device.deviceId),
    );
  }

  // async sendEmail(payload: EmailInterface): Promise<any> {
  //   return this.httpService.axiosRef.post('http://localhost:3000/api/sendMail', payload);

  // }

  async sendSms(payload: SmsInterface) {
    await this.post(this.cfg.sms.url, payload).catch((err) => {
      throw new HttpException('Unable to send otp', HttpStatus.BAD_REQUEST);
    });
    this.response;
  }

  async sendEmail(payload: EmailInterface) {
    await this.post(
      'https://notifications.bezosusu.com/api/sendMail',
      payload,
    ).catch((err) => {
      throw new HttpException('Unable to send otp', HttpStatus.BAD_REQUEST);
    });
    this.response;
  }

  async sendPush(payload: NotificationInterface) {
    try {
      await this.post('http://localhost:3000/api/sendPush', payload).catch(
        (err) => {
          throw new HttpException(
            'Unable to send notification',
            HttpStatus.BAD_REQUEST,
          );
        },
      );
      const notification = new NotificationEntity();
      notification.title = payload.subject;
      notification.message = payload.message;
      notification.type = payload.activityType;
      notification.userId = payload.userId;
      await this.em.save(NotificationEntity, notification);

      return this.response;
    } catch (e) {
      console.log(e);
    }
  }

  async sendEmailSMS(payload: EmailInterface) {
    await this.post('http://localhost:3000/api/sendMail', payload).catch(
      (err) => {
        throw new HttpException('Unable to send otp', HttpStatus.BAD_REQUEST);
      },
    );
    this.response;
  }

  async getLastMonthNotificationsByUser(id: string) {
    await this.get(`http://localhost:3000/api/sendAll/${id}`).catch((err) => {
      throw new HttpException('Unable to send otp', HttpStatus.BAD_REQUEST);
    });

    return this.response;
  }

  async sendAll(payload: NotificationInterface) {
    try {
      console.log('the results is >>>', payload);
      await this.post('http://localhost:3000/api/sendAll', payload).catch(
        (err) => {
          throw new HttpException(
            'Unable to send notification',
            HttpStatus.BAD_REQUEST,
          );
        },
      );

      // implementing sender notification.
      const notification = new NotificationEntity();
      notification.title = payload.subject;
      notification.message = payload.message;
      notification.type = payload.activityType;
      notification.userId = payload.userId;
      this.saveNotification(notification);

      // implementing receiver notification.
      const receiverNotification = new NotificationEntity();
      receiverNotification.title = payload.receipientSubject;
      receiverNotification.message = payload.receipientMessage;
      receiverNotification.type = TRANSACTION_TYPE.TRANSFER;
      receiverNotification.userId = payload.receipientId;
      this.saveNotification(receiverNotification);
      return this.response;
    } catch (e) {
      console.log(e);
    }
  }

  async saveNotification(data: NotificationEntity) {
    await this.em.save(NotificationEntity, data);
  }

  async getAllNotificationsByUser(
    userId: string,
    page: number = 1,
    perPage: number = 20,
  ): Promise<{ notifications: NotificationEntity[]; totalPages: number }> {
    const [notifications, total] = await this.em.findAndCount(
      NotificationEntity,
      {
        where: { userId },
        order: { createdAt: 'DESC' },
        take: perPage,
        skip: (page - 1) * perPage,
      },
    );

    const totalPages = Math.ceil(total / perPage);
    return { notifications, totalPages };
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.em.update(
      NotificationEntity,
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async subscribeUserToPush(request): Promise<any> {
    console.log('request', request);
    const ctx = getAppContextALS<AppRequestContext>();

    const res = await this.em.findOne(PushNotificationEntity, {
      where: {
        userId: ctx.authUser.userId,
        pushToken: request.pushToken,
      },
    });
    if (res) {
      throw new HttpException(`User has already subscribed`, 400);
    }
    const savePush = await this.em.save(PushNotificationEntity, {
      userId: ctx.authUser.userId,
      pushToken: request.pushToken,
    });

    return savePush;
  }

  async unsubscribeUserToPush(token): Promise<void> {
    console.log('token unsub', token);
    const ctx = getAppContextALS<AppRequestContext>();

    const res = await this.em.findOne(PushNotificationEntity, {
      where: {
        userId: ctx.authUser.userId,
        pushToken: token,
      },
    });
    if (!res) {
      throw new HttpException(
        `Failed to unsubscribe userId or pushToken mismatch`,
        400,
      );
    }

    const output = await this.em.delete(PushNotificationEntity, {
      userId: ctx.authUser.userId,
      pushToken: token,
    });

    //return output
  }

  // async checkAll(userId:string, page:number=1, perpage:number=20):Promise<any>{
  //   const [notifications,allsub] = await this.em.findAndCount(NotificationEntity,{
  //     where:{userId},
  //     order:{createdAt:'DESC'},
  //     take:perpage,
  //     skip: (page-1)* perpage,
  //   })
  //   const totalPages = Math.ceil(allsub/perpage)
  //   return [totalPages, notifications]
  // }
}
