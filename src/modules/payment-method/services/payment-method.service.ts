import { EntityManager, Not, Repository } from 'typeorm';
import { PaymentMethodDto } from '../dtos/payment-method.dto';
import { AccountEntity } from '../../account/entities/account.entity';
import { STATUS } from '../../auth/entities/enums/status.enum';
import { AppRequestContext } from '../../../utils/app-request.context';
import { getAppContextALS } from '../../../utils/context';
import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';

import { PaymentMethodEntity } from '../../main/entities/paymentmethod.entity';
import { PAYMENT_TYPE } from '../../main/entities/enums/paymenttype.enum';
import { NETWORK } from '../../main/entities/enums/network.enum';
import { BadRequestException, HttpException } from '@nestjs/common/exceptions';
import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { OtpDto } from '../../auth/dto/otp.dto';
import { OTP_STATUS } from '../../auth/entities/enums/otp-status.enum';
import { OtpEntity } from '../../auth/entities/otp.entity';

@Injectable()
export class PaymentMethodService {
  //private logger = new Logger('PaymentMethodService');

  constructor(
    @InjectEntityManager('default')
    private em: EntityManager,
  
  ) {}

  async phoneExist(phone: string) {
    return await this.em.findOne(AuthUserEntity, { where: { phone } });
  }

  async phoneExistInPaymentMethod(phone: string) {
    return await this.em.findOne(PaymentMethodEntity, {
      where: { phoneNumber: phone },
    });
  }

  async create(input: PaymentMethodDto): Promise<any> {
    //console.log('Create savings goal payload>>', input);

    const ctx = getAppContextALS<AppRequestContext>();
    const paymentMethod = new PaymentMethodEntity(); //create default payment method

    /// verify Otp

     const otpData =new OtpDto()
     otpData.otp=input.otp
     otpData.phone=input.phone_number
    
     await this.verifyOtp(otpData)

    if (input.phone_number) {
      // phone.userId = auth.id;
      // const savedPhone = await this.saveUserPhone(phone);

      const checkPhone = await this.phoneExistInPaymentMethod(
        input.phone_number,
      );
      console.log('checkPhone', checkPhone);
      if (checkPhone) {
        throw new BadRequestException('phone_already_exist');
      }

      const allUserPaymentMethods = await this.all();

      if (allUserPaymentMethods.length >= 2) {
        throw new BadRequestException(
          'You cannot have more than two payment methods',
        );
      }

      paymentMethod.network = this.getNetwork(input?.network?.toUpperCase());
      if (input.phone_number) paymentMethod.phoneNumber = input.phone_number;

      paymentMethod.userId = ctx.authUser.userId;
      paymentMethod.status = STATUS.enabled;

      paymentMethod.bank = input.bank;

      paymentMethod.accountNumber = input.accountNumber;

      paymentMethod.paymentType = input.paymentType;

      console.log('payment', paymentMethod);

      if (input.default && input.default === true) {
        const queryUpdate = `UPDATE public.payment_method_entity
        SET   "default"='false'
        WHERE "userId"='${ctx.authUser.userId}'`;
        await this.em.query(queryUpdate);
        paymentMethod.default = input.default;
      }

      if (input.default === false) {
        const paymentMethods = await this.em.find(PaymentMethodEntity, {
          where: {
            userId: ctx.authUser.userId,
          },
        });

        const resChecker = paymentMethods.find((r) => r.default == true);

        if (!resChecker) {
          throw new BadRequestException(
            'You must have one default payment method',
          );
        }
      }
      await this.em.save(paymentMethod);
    }
  }


  async verifyOtp(input: OtpDto): Promise<{ message: string }> {
    console.log('otp input', input);
    const otp_data: OtpEntity = await this.em.findOne(OtpEntity, {
      where: {
        otp: `${input.otp}`,
        phone: input.phone,
        // status: 'not_verified'
      },
      order: { id: 'DESC' },
    });

    console.log('otp_data', otp_data);
    // console.log('otp_data', otp_data);
    if (otp_data) {
      if (otp_data.status === OTP_STATUS.verified)
        throw new BadRequestException('Verification has already been used');
      if (otp_data.status === OTP_STATUS.expired)
        throw new BadRequestException('otp_expired');
      if (otp_data.otp !== `${input.otp}`)
        throw new BadRequestException('invalid_otp');

      otp_data.status = OTP_STATUS.verified;
      await this.em.save(otp_data);
      return {
        message: 'otp_verified',
      };
    } else {
      throw new BadRequestException('invalid_otp');
    }
  }
  async createPaymentMethod(input):Promise<any>{
    const paymentMethod = new PaymentMethodEntity(); //create default payment method

    if (input.phone_number) {
      // phone.userId = auth.id;
      // const savedPhone = await this.saveUserPhone(phone);

      const checkPhone = await this.phoneExistInPaymentMethod(
        input.phone_number,
      );
      console.log('checkPhone', checkPhone);
      if (checkPhone) {
        throw new BadRequestException('phone_already_exist');
      }

      // const allUserPaymentMethods = await this.all();

      // if (allUserPaymentMethods.length >= 2) {
      //   throw new BadRequestException(
      //     'You cannot have more than two payment methods',
      //   );
      // }

      paymentMethod.network = this.getNetwork(input?.network?.toUpperCase());
      if (input.phone_number) paymentMethod.phoneNumber = input.phone_number;

      paymentMethod.userId = input.userId
      paymentMethod.status = STATUS.enabled;

      paymentMethod.bank = input.bank;

      paymentMethod.accountNumber = input.accountNumber;

      paymentMethod.paymentType = input.paymentType;
      paymentMethod.userId=input.userId
      paymentMethod.default=true

      console.log('payment', paymentMethod);

 
      
      await this.em.save(paymentMethod);
    }
  }

  // async getAllUserPaymentMethods ():Promise<PaymentMethodEntity>{
  //  return  this.em.find(PaymentMethodEntity,{where:{phoneNumber:input.phone_number}})
  // }

  async all(): Promise<any[]> {
    const ctx = getAppContextALS<AppRequestContext>();
    const paymentMethods = await this.em.find(PaymentMethodEntity, {
      where: {
        userId: ctx.authUser.userId,
      },
    });

    return paymentMethods;
  }

  // async get(id: string): Promise<SavingsGoalDto> {
  //   const ctx = getAppContextALS<AppRequestContext>();
  //   let savingsGoal=  (await this.em.findOne(SavingsGoalEntity, {
  //     where: { id: id, userId: ctx.authUser.userId },
  //     relations: ['account', 'goalType'],
  //   })) as unknown as SavingsGoalDto;
  //   let accounType = await this.em.findOne(AccountTypeEntity,{
  //     where:{id:savingsGoal.account.accountTypeId}
  //   });
  //   if (accounType){
  //     savingsGoal.accountTypeAlias=accounType.alias;
  //     savingsGoal.accountTypeName=accounType.name;
  //   }
  //   return savingsGoal;
  // }

  async getAccountIdByAccountNumber(accNum): Promise<AccountEntity> {
    return await this.em.findOne(AccountEntity, {
      where: { accountNumber: accNum },
    });
  }

  async update(id: string, input: PaymentMethodDto): Promise<any> {
    const ctx = getAppContextALS<AppRequestContext>();
    const paymentMethod = await this.getPaymentMethodById(id);
    // const savingsGoal: SavingsGoalEntity = await this.get(id);

    if (!paymentMethod) {
      throw new BadRequestException('Payment Method not found');

      //throw new HttpException('Payment Method not found', 404);
    }

    paymentMethod.phoneNumber = input.phone_number;
    paymentMethod.bank = input.bank;
    paymentMethod.network = input.network;
    paymentMethod.default = input.default;
    paymentMethod.accountNumber = input.accountNumber;
    paymentMethod.paymentType = input.paymentType;

    if (input.default && input.default === true) {
      const queryUpdate = `UPDATE public.payment_method_entity
      SET   "default"='false'
      WHERE "userId"='${ctx.authUser.userId}'`;
      await this.em.query(queryUpdate);
      paymentMethod.default = input.default;
    }

    if (input.default === false) {
      const paymentMethods = await this.em.find(PaymentMethodEntity, {
        where: {
          userId: ctx.authUser.userId,
        },
      });

      const resChecker = paymentMethods.filter((r) => r.default == true);
      console.log('resChecker', resChecker);

      if (
        resChecker.length == 1 &&
        resChecker[0].default === true &&
        input.default === false
      ) {
        throw new BadRequestException(
          'You must have one default payment method',
        );
      }

      // if(!resChecker){
      //   throw new BadRequestException('You must have one default payment method');

      // }
    }

    // savingsGoal.amountToSave=
    return this.em.save(paymentMethod) as unknown as PaymentMethodDto;
  }

  async getPaymentMethodById(id: string): Promise<PaymentMethodEntity> {
    return this.em.findOne(PaymentMethodEntity, {
      where: { id: id },
    });
  }

  async delete(id: string): Promise<any> {
    const payment: PaymentMethodEntity | PaymentMethodDto =
      await this.getPaymentMethodById(id);

    if (!payment) {
      throw new HttpException('Payment Method not found', 404);
    }

    if (payment.default && payment.default === true) {
      throw new HttpException(
        'You cannot delete your default payment method',
        400,
      );
    } else {
      await this.em.delete(PaymentMethodEntity, id);
    }
  }

  getNetwork(network): NETWORK {
    console.log('network', network);
    if (network == 'MTN') {
      return NETWORK.mtn;
    } else if (network == 'AIRTEL_TIGO') {
      return NETWORK.airteltigo;
    } else if (network == 'AIRTELTIGO') {
      return NETWORK.airteltigo;
    } else if (network == 'VODAFONE') {
      return NETWORK.vodafone;
    } else if (network == 'GLO') {
      return NETWORK.glo;
    } else {
      return NETWORK.mtn;
    }
  }
}
