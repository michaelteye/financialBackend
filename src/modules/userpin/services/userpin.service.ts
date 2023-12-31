import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  forwardRef,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { PasswordEncoderService } from '../../auth/services/password-encorder.service';

import { AppRequestContext } from '../../../utils/app-request.context';
import { getAppContextALS } from '../../../utils/context';
import { EntityManager } from 'typeorm';
import {
  UserPinDto,
  PinResponseDto,
  PinVerificationResponseDto,
} from '../dtos/user-pin.dto';
import { UserPinEntity } from '../entities/userpin.entity';
import { OtpEntity } from '../../auth/entities/otp.entity';
import { OTP_STATUS } from '../../auth/entities/enums/otp-status.enum';

import { VerificationType } from '../../enums/verification-type.enum';
import { differenceInMinutes } from 'date-fns';
import { STATUS } from '../../auth/entities/enums/status.enum';
import { randomBytes, randomUUID, scrypt, createCipheriv } from 'crypto';
import { promisify } from 'util';
import {
  PinVerificationEntity,
  VERIFICATION_STATUS,
} from '../entities/pin-verification.entity';

import * as crypto from 'crypto';
import { UpdateUserPinDto } from '../dtos/user-pin.dto';
import { OtpDto } from '../../auth/dto/otp.dto';
import { AuthService } from '../../auth/services/auth.service';
import { NotificationService } from '../../notifications/services/notification.service';

// const crypto = require('crypto')

@Injectable()
export class UserPinService {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
    @InjectEntityManager('default') private em: EntityManager,
    private passwordHash: PasswordEncoderService,
    private notificationService: NotificationService,

  ) { }

  async createUserPin(request: UserPinDto): Promise<PinResponseDto> {
    try {
      const ctx = getAppContextALS<AppRequestContext>();
      const encryptedPin = await this.encryptPin(
        request.userPin,
        ctx.authUser.userId,
      );
      // save pin
      const pin = new UserPinEntity();
      pin.pin = encryptedPin;
      pin.status = STATUS.active;
      pin.userId = ctx.authUser.userId;
      if (await this.em.save(pin)) {
        const otpSmsResponse = await this.notificationService.sendSms({
          to: ctx.authUser.phone, 
          sms: 'Congrats! Your Bezo pin has been successfully created.',
          provider:'kologsoft'

        })
        return {
          message: 'Congrats! Your Bezo pin has been successfully created.',
        };
      }
      throw new HttpException("We couldn't create your Bezo pin. Give it another try", HttpStatus.BAD_REQUEST);
    } catch (error) {
      console.log('pin error', error);
      throw new HttpException(
        "We couldn't create your Bezo pin. Give it another try",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createUserPinWithoutAuthentication(request: any): Promise<PinResponseDto> {
    try {
     
      const encryptedPin = await this.encryptPin(
        request.userPin,
        request.userId,
      );
      // save pin
      const pin = new UserPinEntity();
      pin.pin = encryptedPin;
      pin.status = STATUS.active;
      pin.userId =  request.userId;
      pin.updated=false
      if (await this.em.save(pin)) {
        const otpSmsResponse = await this.notificationService.sendSms({
          to: request.phone,
          sms:`A default Bezo pin  ${request.userPin} has been created for you. Kindly reset your PIN via app.bezosusu.com or USSD.`

        })
        return {
          message: 'Congrats! Your Bezo pin has been successfully created.',
        };
      }
      throw new HttpException('pin_not_created', HttpStatus.BAD_REQUEST);
    } catch (error) {
      console.log('pin error', error);
      throw new HttpException(
        'pin_not_created',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async saveVerificationId(
    verificationId: string,
    userId: string,
  ): Promise<void> {
    const verification = new PinVerificationEntity();
    verification.verificationId = verificationId;
    verification.userId = userId;
    await this.em.save(verification);
  }

  async getUserPinData(userId: string): Promise<UserPinEntity> {
    const pin = await this.em.findOne(UserPinEntity, {
      where: { userId },
    });
    if (!pin) throw new HttpException('pin_not_found', HttpStatus.BAD_REQUEST);
    return pin;
  }

  async verifyUserPin(userPin: string): Promise<PinVerificationResponseDto> {
    const ctx = getAppContextALS<AppRequestContext>();
    let encryptedPin;
    console.log('ctx.authUser', ctx.authUser.user);
    const userDataPin = await this.getUserPinData(ctx.authUser.userId);
    if (userDataPin.updated) {
      encryptedPin = await this.encryptPin(userPin, ctx.authUser.userId);
    } else {
      encryptedPin = ctx.authUser.user.user_id // for users who where migrated
        ? await this.getEncryptKey(String(userPin))
        : await this.encryptPin(userPin, ctx.authUser.userId);
    }
    const pin = await this.em.findOne(UserPinEntity, {
      where: { userId: ctx.authUser.userId, pin: encryptedPin },
    });

    console.log('pin', pin);

    if (pin) {
      const verificationId = await this.generateVerificationId(
        userPin.toString(),
      );
      await this.saveVerificationId(verificationId, ctx.authUser.userId);
      return {
        message: 'Your Bezo pin is good to go!',
        verificationId,
      };
    }
    throw new HttpException('invalid_pin', HttpStatus.BAD_REQUEST);
  }


  async verifyUserPinUssd(userPin: string): Promise<any> {
    const ctx = getAppContextALS<AppRequestContext>();
   
    let encryptedPin;
  //  console.log('ctx.authUser', ctx.authUser.user);
    const userDataPin = await this.getUserPinData(ctx.authUser.userId);
    console.log("userDataPin",userDataPin)
    if (userDataPin.updated) {
      encryptedPin = await this.encryptPin(userPin, ctx.authUser.userId);
    } else {
      encryptedPin = ctx.authUser.user.user_id // for users who where migrated
        ? await this.getEncryptKey(String(userPin))
        : await this.encryptPin(userPin, ctx.authUser.userId);
    }
    const pin = await this.em.findOne(UserPinEntity, {
      where: { userId: ctx.authUser.userId, pin: encryptedPin },
    });

    console.log('pin', pin);

    if (pin) {
      const verificationId = await this.generateVerificationId(
        userPin.toString(),
      );
      await this.saveVerificationId(verificationId, ctx.authUser.userId);
      return {
        status: '00',
        message:'Pin Verified',
        verificationId
      };
    }else{
      return {
        status : '01',
        message :'Oops! You have entered the wrong Bezo pin. Please try again.'
      }
    }
    // throw new HttpException('invalid_pin', HttpStatus.BAD_REQUEST);
  }

  async updateUserPin(request: UpdateUserPinDto): Promise<PinResponseDto> {

    console.log("update User Pin payload >>>",request)
    const ctx = getAppContextALS<AppRequestContext>();
    const otpVerification = {
     // otp: ''+request.otp,
      phone: ctx.authUser.phone,
      verificationType: VerificationType.CHANGE_PIN,
    };
   // await this.authService.verifyOtp(otpVerification);
    const encryptedPin = await this.encryptPin(
      request.userPin,
      ctx.authUser.userId,
    );
    const pin = await this.em.findOne(UserPinEntity, {
      where: { userId: ctx.authUser.userId },
    });

    console.log("pin",pin)
    if (pin) {
      pin.pin = encryptedPin;
      pin.updated = true;
      if (await this.em.save(pin)) {
        this.notificationService.sendSms({
          to: ctx.authUser.phone,
          sms: `Your pin has been updated successfully`,
          provider:'kologsoft'
        })
        return {
          message: 'Congrats! You have successfully updated your Bezo pin.',
        };
      }
    }
    throw new HttpException('pin_not_updated', HttpStatus.BAD_REQUEST);
  }

  async updateUserPinUssd(request: UserPinDto): Promise<PinResponseDto> {
    const ctx = getAppContextALS<AppRequestContext>();

 
    const encryptedPin = await this.encryptPin(
      request.userPin,
      ctx.authUser.userId,
    );
    const pin = await this.em.findOne(UserPinEntity, {
      where: { userId: ctx.authUser.userId },
    });
    if (pin) {
      pin.pin = encryptedPin;
      pin.updated = true;
      if (await this.em.save(pin)) {
        this.notificationService.sendSms({
          to: ctx.authUser.phone,
          sms: `Your pin has been updated successfully`,
          provider:'kologsoft'
        })
        return {
          message: 'pin_updated',
        };
      }
    }
    throw new HttpException('pin_not_updated', HttpStatus.BAD_REQUEST);
  }

  async encryptPin(pin: string, userId: string): Promise<string> {
    const genPin = `${pin}${userId}`;
    const encryptedPin = this.passwordHash.encryptKey(genPin);
    return encryptedPin;
  }

  getEncryptKey(userPIN) {
    //const hash_fn = 'sha1'; // can be set to sha256
    const key = crypto.createHash('sha1').update(userPIN).digest('hex');
    console.log('key', key);
    return key;
  }

  async generateVerificationId(text: string): Promise<any> {
    const iv = randomBytes(16);
    const password = randomUUID();
    const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
    const cipher = createCipheriv('aes-256-ctr', key, iv);

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    const encryptedText = encrypted.toString('hex');
    return encryptedText;
  }

  async verifyId(id: string) {
    const verify = await this.em.findOne(PinVerificationEntity, {
      where: { verificationId: id, status: VERIFICATION_STATUS.PENDING },
    });
    if (verify) {
      verify.status = VERIFICATION_STATUS.VERIFIED;
      verify.updatedAt = new Date();
      return await this.em.save(verify);
    }
    throw new HttpException('Verification Failed', HttpStatus.BAD_REQUEST);
  }

  async verifyPhone(phone: string): Promise<boolean> {
    const otp = await this.em.findOne(OtpEntity, {
      where: {
        phone,
        status: OTP_STATUS.verified,
        verificationType: VerificationType.CHANGE_PIN,
      },
      order: { createdAt: 'DESC' },
    });

    if (otp) {
      const minutes = differenceInMinutes(new Date(), otp.createdAt);
      if (minutes > 30) {
        throw new HttpException(
          'phone_validation_expired',
          HttpStatus.BAD_REQUEST,
        );
      }
      return true;
    }
    throw new HttpException('phone_not_verified', HttpStatus.BAD_REQUEST);
  }
}
