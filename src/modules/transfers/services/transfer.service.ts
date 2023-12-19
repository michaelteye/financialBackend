import {
  HttpException,
  Injectable,
  UseGuards,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { tr } from 'date-fns/locale';
import { response } from 'express';
import {
  AdminTransferToAccountDto,
  TransferToAccountDto,
  AdminDebitCreditAccountDto,
  IntraTransferDto,
} from '../../account/dtos/transfer-account.dto';
import { AccountEntity } from '../../account/entities/account.entity';
import { AccountService } from '../../account/services/account.service';
import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { STATUS } from '../../auth/entities/enums/status.enum';

import { UserService } from '../../auth/services/user.service';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { WITHDRAWL_DAILY_LIMIT_STATUS } from '../../enums/withdrawal-limit-type.enum';
import { DeviceEntity } from '../../main/entities/device.entity';
import { PaymentMethodEntity } from '../../main/entities/paymentmethod.entity';
import { UserEntity } from '../../main/entities/user.entity';
import { NotificationService } from '../../notifications/services/notification.service';
// import { NETWORK } from '../../transactions/dtos/deposit.dto';
import { NETWORK } from '../../main/entities/enums/network.enum';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { UserPinService } from '../../userpin/services/userpin.service';
import { AppRequestContext } from '../../../utils/app-request.context';
import { getAppContextALS } from '../../../utils/context';
import { EntityManager } from 'typeorm';
import { uuid } from 'uuidv4';
import { AccountDepositWithrawalDto } from '../dto/AccountDepositDto';
import { TransferCoreDto } from '../dto/TransferCoreDto';
import { TransferCoreResponseDto } from '../dto/TransferCoreResponseDto';
import { TRANSFER_STATUS_CODE } from '../enums/transferstatus.enum';
import { ValidateAdminTransactionAuthGuard } from '../guards/validate-adminapi.guard';
import { SYSTEM_ACCOUNT, SYSTEM_ACCOUNT_TYPE } from './systemaccts.constants';
import { TransferCoreService } from './transfer.core.service';
import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
import { GOAL_STATUS } from '../../auth/entities/enums/goal-status.enum';
import { DepositCashbackEntity } from '../../transactions/services/deposit_cashback.entity';
// import { TransactionEntity } from '../../transactions/entities/transaction.entity';

@Injectable()
export class TransferService {
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    private transferCoreService: TransferCoreService,
    private userService: UserService,
    @Inject(forwardRef(() => UserPinService))
    private userPinService: UserPinService,
    private accountService: AccountService,
    private notificationService: NotificationService,
  ) {}

  @UseGuards(ValidateAdminTransactionAuthGuard)
  async adminTransferToUserAccount(
    input: AdminTransferToAccountDto,
  ): Promise<any> {
    await this.notificationService.sendSms({
      to: '233246583910',
      sms: `BEZADMIN: Admin Transfer Called`,
    });
    try {
      const ctx = getAppContextALS<AppRequestContext>();
      const authUser = await this.userService.getAuthUserByPhone(input.phone); // users phone
      const creditAccount = await this.accountService.getUserPrimaryAccount({
        userId: authUser.userId,
      });
      if (!creditAccount) {
        throw new HttpException(
          `User with phone ${input.phone} has no Primary Account`,
          404,
        );
      }
      const reference = uuid();
      const debitAccount = await this.em.findOne(AccountEntity, {
        where: { alias: 'staff_allowances' },
      });

      const transferRequest = new TransferCoreDto();
      transferRequest.fromAccountId = debitAccount.id;
      transferRequest.toAccountId = creditAccount.id;
      transferRequest.reference = reference;
      transferRequest.fromAccountNarration = input.narration;
      transferRequest.toAccountNarration = input.narration;
      transferRequest.amount = input.amount;
      const transferResponse = await this.transferCoreService.transfer(
        transferRequest,
      );
      if (transferResponse.statusCode == TRANSFER_STATUS_CODE.SUCCESS) {
        const paymentMethod = await this.getUserPaymentPhone();
        const phoneNumber = paymentMethod.phoneNumber;

        // implementing the notification for all transfers

        const recipient = await this.em.findOne(AuthUserEntity, {
          where: {
            phone: input.phone,
          },
          relations: ['user'],
        });

        const userDeviceIds = await this.getUserDeviceId(ctx.authUser.userId);
        let transaction = new TransactionEntity();
        await this.notificationService.sendAll({
          data: transferRequest,
          to: recipient.phone,
          sms: `You just received GHS${input.amount} FROM BEZ0_SAL_ALLOWANCE in your BezoWallet. Transaction reference is ${transferResponse.userRef}.`,
          subject: `transfer from Wallet`,
          message: `An amount of GHS ${input.amount} to your bezo account`,
          deviceId: userDeviceIds,
          email: ctx.authUser.email,
          template: {
            name: 'transfer',
            data: {
              logourl: '',
              title: 'Bezo Transfer',
              emailMessage: `You just received GHS${input.amount} FROM BEZ0_SAL_ALLOWANCE in your BezoWallet. Transaction reference is ${transferResponse.userRef}.`,
            },
          },
          userId: ctx.authUser.userId,
          activityType: transaction.transactionType,
          //receipientId: recip.userId
        });
        // await this.notificationService.sendSms({
        //   to: recipient.phone,
        //   sms: `You just received GHS${input.amount} FROM BEZ0_SAL_ALLOWANCE in your BezoWallet. Transaction reference is ${transferResponse.userRef}. Thank you for choosing Bezo`,
        // });
        let response: any = Object.assign({}, transferResponse as any);
        response.firstName = recipient.user?.firstName;
        response.lastName = recipient.user?.lastName;
        response.user_id = recipient.user?.id;
        return response;
      }
      console.log('The transfer core response >>', transferResponse);
      return transferResponse;
    } catch (error) {
      console.log(error);
      return error.message;
    }
  }

  async transferToUserAccount(
    input: TransferToAccountDto,
  ): Promise<TransferCoreResponseDto> {
    console.log('transfer to a bezo user >>>', input);
    if (!input.verificationId) {
      throw new HttpException('Verification Id is required', 400);
    }
    await this.userPinService.verifyId(input.verificationId);
    const ctx = getAppContextALS<AppRequestContext>();
    if (ctx.authUser.accountStatus == STATUS.disabled) {
      throw new HttpException('Your account has been disabled', 400);
    }
    const debitAccount = await this.accountService.getUserPrimaryAccount({
      userId: ctx.authUser.userId,
    });
    const currentUser = await this.em.findOne(UserEntity, {
      where: { id: ctx.authUser.userId },
    });
    const recipientUser = await this.em.findOne(AccountEntity, {
      where: { id: input.transferAccountId },
      relations: ['user'],
    });
    if (input.narration == null || input.narration == '') {
      let receipientUser = await this.userService.getAuthUserByUserId(
        recipientUser.userId,
      );
      input.narration = `Transfer to @${receipientUser.user?.userName} ${receipientUser.phone}`;
    }
    const recipientPhone = await this.em.findOne(AuthUserEntity, {
      where: {
        userId: recipientUser.user.id,
      },
    });
    let dailyLimitStatus = await this.dailyWithdrawalLimitAndDailyLimit(
      ctx.authUser.userId,
      TRANSACTION_TYPE.TRANSFER,
      input.amount,
      currentUser.level,
    );
    if (dailyLimitStatus.status == WITHDRAWL_DAILY_LIMIT_STATUS.FAILED) {
      throw new HttpException('Daily transfer limit exceeded', 401);
    }
    const reference = uuid();
    const transferRequest = new TransferCoreDto();
    transferRequest.fromAccountId = debitAccount.id;
    transferRequest.toAccountId = input.transferAccountId;
    transferRequest.reference = reference;
    transferRequest.fromAccountNarration = input.narration;
    transferRequest.toAccountNarration = input.narration;
    transferRequest.amount = input.amount;
    transferRequest.channel = input.channel;
    const transferResponse = await this.transferCoreService.transfer(
      transferRequest,
    );
    if (transferResponse.statusCode == TRANSFER_STATUS_CODE.SUCCESS) {
      const paymentMethod = await this.getUserPaymentPhone();
      const phoneNumber = paymentMethod.phoneNumber;
      const userDeviceIds = await this.getUserDeviceId(ctx.authUser.userId);
      let transaction = new TransactionEntity();
      // await this.notificationService.sendAll({
      //   data: transferRequest,
      //   to:phoneNumber,
      //   sms:`You just received GHS${input.amount} from  ${currentUser.firstName} ${currentUser.lastName}   into your BezoWallet.Your transaction reference is ${transferResponse.userRef}. Thank you for choosing Bezo`,
      //   subject: 'transfer to Wallet',
      //   message:`You just received GHS${input.amount} from  ${currentUser.firstName} ${currentUser.lastName}   into your BezoWallet.Your transaction reference is ${transferResponse.userRef}. Thank you for choosing Bezo`,
      //   deviceId : userDeviceIds,
      //   email: ctx.authUser?.email,
      //   template:{
      //     name:"transfer",
      //     data:{
      //       logourl:"",
      //       title:"Bezo Transfer",
      //       emailMessage:`You just received GHS${input.amount} FROM BEZ0_SAL_ALLOWANCE in your BezoWallet. Transaction reference is ${transferResponse.userRef}. Thank you for choosing Bezo`
      //     }
      //   },
      //   userId: ctx.authUser.userId,
      //   activityType: transaction.transactionType
      // })
      const recip = await this.em.findOne(AccountEntity, {
        where: {
          id: transferRequest.toAccountId
        }
     });
  

     let recipientMessage = `You just received GHS${input.amount} from ${currentUser.firstName} ${currentUser.lastName} into your BezoWallet. Your transaction reference is ${transferResponse.userRef}.`;

      await this.notificationService.sendAll({
        data: transferRequest,
        to: phoneNumber,
        sms: `You just sent GHS${input.amount} to ${recipientUser.user.firstName} ${recipientUser.user.lastName} from your BezoWallet. Your transaction reference is ${transferResponse.userRef}.`,
        subject: `Transfer to ${recipientUser.user.userName}`,
        message: `You just sent GHS${input.amount} to ${recipientUser.user.firstName} ${recipientUser.user.lastName} from your BezoWallet. Your transaction reference is ${transferResponse.userRef}.`,
        deviceId: userDeviceIds,
        email: ctx.authUser?.email,
        template: {
          name: 'Transfer',
          data: {
            logourl: '',
            title: 'Bezo Transfer',
            emailMessage: `You just sent GHS${input.amount} to ${recipientUser.user.firstName}  ${recipientUser.user.lastName} from your BezoWallet.  Your transaction reference is ${transferResponse.userRef}.`,
          },
        },
        userId: ctx.authUser.userId,
        activityType: transaction.transactionType,
        receipientId: recip.userId,
        receipientMessage: recipientMessage,
        receipientSubject: `Transfer from ${currentUser.firstName}`
      });

      //implementing the sms for receiver
      await this.notificationService.sendSms({
        to: recipientPhone.phone,
        sms: `You just received GHS${input.amount} from ${currentUser.firstName} ${currentUser.lastName} into your BezoWallet. Your transaction reference is ${transferResponse.userRef}.`,
      });

      /* await this.notificationService.sendAll({
        data: transferRequest,
        to:recipientPhone.phone,//instead of using recipientPhone.phone
        sms:`You just received GHS${input.amount} from ${currentUser.firstName}  ${currentUser.lastName} into your BezoWallet. Your transaction reference is ${transferResponse.userRef}.`,
        subject: 'transfer to Wallet',
        message:`You just received GHS${input.amount} from ${currentUser.firstName}  ${currentUser.lastName} into your BezoWallet.Your transaction reference is ${transferResponse.userRef}.`,
        deviceId : userDeviceIds,
        email: ctx.authUser?.email,
        template:{
          name:"transfer",
          data:{
            logourl:"",
            title:"Bezo Transfer",
            emailMessage:`You just received  GHS${input.amount} from ${currentUser.firstName}  ${currentUser.lastName} into your BezoWallet.Your transaction reference is ${transferResponse.userRef}.`
          }
        },
        userId: transferRequest.fromAccountId,
        activityType: transaction.transactionType,
        receipientId: recip.userId
      }) */
      await this.notificationService.sendSms({
        to: ctx.authUser.phone,
        sms: `You just sent GHS${input.amount} to ${recipientUser.user.firstName} ${recipientUser.user.lastName} from your BezoWallet. Your transaction reference is ${transferResponse.userRef}.`
      });
    }
    if (transferResponse.statusCode !== TRANSFER_STATUS_CODE.SUCCESS) {
      throw new HttpException(transferResponse.message, 401);
    }
    return transferResponse;
  }

  async intraAccountTransfer(
    input: IntraTransferDto,
  ): Promise<TransferCoreResponseDto> {
    console.log('Intra Account Transfer>>>', input);

    const ctx = getAppContextALS<AppRequestContext>();
    if (ctx.authUser.accountStatus == STATUS.disabled) {
      throw new HttpException('Your account has been disabled', 400);
    }
    const currentUser = await this.em.findOne(UserEntity, {
      where: { id: ctx.authUser.userId },
    });
    const fromAccunt = await this.em.findOne(AccountEntity, {
      where: { id: input.fromAccountId },
      relations: ['user'],
    });
    const toAccount = await this.em.findOne(AccountEntity, {
      where: { id: input.toAccountId },
      relations: ['user'],
    });
    if (input.narration == null || input.narration == '') {
      input.narration = `Intra Transfer from ${fromAccunt.name} to ${toAccount.name}`;
    }
    if (fromAccunt.userId !== currentUser.id) {
      throw new HttpException('From Account must belong to current user', 401);
    }
    if (toAccount.userId !== currentUser.id) {
      throw new HttpException('To Account must belong to current user', 401);
    }
    const reference = uuid();
    const transferRequest = new TransferCoreDto();
    transferRequest.fromAccountId = fromAccunt.id;
    transferRequest.toAccountId = toAccount.id;
    transferRequest.reference = reference;
    transferRequest.fromAccountNarration = input.narration;
    transferRequest.toAccountNarration = input.narration;
    transferRequest.amount = input.amount;
    console.log('The intra-transefer request', JSON.stringify(transferRequest));
    const transferResponse = await this.transferCoreService.transfer(
      transferRequest,
    );
    console.log(
      'The intra-transefer response',
      JSON.stringify(transferResponse),
    );

    //FIND OUT IF USER HAS EVER RECEIVED A DEPOSIT CASHBACK

    const resDep=await this.em.findOne(DepositCashbackEntity,{
      where:{userId:ctx.authUser.userId}
    })

    // if(!resDep){
    //   await this.savingToSavingGoalCashback(transferResponse.trxnRef);
    // }

    if (transferResponse.statusCode == TRANSFER_STATUS_CODE.SUCCESS) {
    } else {
      // return  transferResponse;//
      throw new HttpException(transferResponse.message, 400);
    }
    return transferResponse;
  }

  async intraAccountTransferWithoutAuthorization(
    input: IntraTransferDto,
  ): Promise<TransferCoreResponseDto> {
    console.log('Intra Account Transfer>>>', input);

    const fromAccunt = await this.em.findOne(AccountEntity, {
      where: { id: input.fromAccountId },
      relations: ['user'],
    });
    const toAccount = await this.em.findOne(AccountEntity, {
      where: { id: input.toAccountId },
      relations: ['user'],
    });
    if (input.narration == null || input.narration == '') {
      input.narration = `Intra Transfer from ${fromAccunt.name} to ${toAccount.name}`;
    }

    const reference = uuid();
    const transferRequest = new TransferCoreDto();
    transferRequest.fromAccountId = fromAccunt.id;
    transferRequest.toAccountId = toAccount.id;
    transferRequest.reference = reference;
    transferRequest.fromAccountNarration = input.narration;
    transferRequest.toAccountNarration = input.narration;
    transferRequest.amount = input.amount;
    transferRequest.channel = input.channel;

    console.log('The intra-transefer request', JSON.stringify(transferRequest));
    const transferResponse = await this.transferCoreService.transfer(
      transferRequest,
    );
    console.log(
      'The intra-transefer response',
      JSON.stringify(transferResponse),
    );
    if (transferResponse.statusCode !== TRANSFER_STATUS_CODE.SUCCESS) {
      throw new HttpException(transferResponse.message, 401);
    }
    return transferResponse;
  }

  async dailyWithdrawalLimitAndDailyLimit(
    userId: string,
    transactionType: string,
    amount: number,
    level: string,
  ) {
    //Function takes userId,transactionType(withdrawal or transfer), and amountOfWithdawal or transferAmount
    //limit must be done at the userLevel as well as the account level
    //currently there is a withdrawal limit on the accounts
    //let' create and entity called user_level_entity where we will store withdrawal limit
    //lets create another entity called user_limits_entity where we will store customers who have custom withdrawal limits
    //using these 2 entities we will implement the limits on the user level
    //once we do this, we can omit the account level withdrawl limit for now
    //select the user_limits_entity using the userId ,
    //if no rows are return query the user_level_entity using the user's level then use the limit on withdrawl field to calclute the daily limit
    //if no rows are returned reject the transaction
    //if rows are returned then use the appropriate field to calculate limit and accept or
    //reject the transaction if the limit has reached or not
    let sqlQuery = `WITH user_limits AS (
      SELECT "withdrawalLimit","transferLimit" FROM public.user_limits_custom_entity WHERE "userId" = '${userId}'
  ), user_level AS (
      SELECT "withdrawalLimit","transferLimit" FROM public.user_level_entity WHERE level = '${level}'
  )
  SELECT CASE 
      WHEN COALESCE((SELECT SUM("amount") FROM public.transaction_entity WHERE "userId" = '${userId}' AND "transactionType" = '${transactionType}' AND "transactionStatus" IN ('PENDING','SUCCESS','FAILED') AND "createdAt" >= date_trunc('day', now())::timestamp), 0) + ${amount} <= 
      COALESCE(
          (CASE WHEN '${transactionType}'='WITHDRAWAL' THEN (SELECT "withdrawalLimit" FROM user_limits) ELSE (SELECT "transferLimit" FROM user_limits) END), 
          (CASE WHEN '${transactionType}'='WITHDRAWAL' THEN (SELECT "withdrawalLimit" FROM user_level) ELSE (SELECT "transferLimit" FROM user_level) END)
      ) THEN '00'
      ELSE '01'
  END as result;`;

    const rowsReturned = await this.em.query(sqlQuery);
    console.log('QUERY TO CHECK WITHDRAWAL LIMITS', rowsReturned);
    if (rowsReturned.length) {
      if (rowsReturned[0].result == '00') {
        return {
          status: WITHDRAWL_DAILY_LIMIT_STATUS.SUCCESS,
          message: 'User can withdraw',
        };
      } else {
        return {
          status: WITHDRAWL_DAILY_LIMIT_STATUS.FAILED,
          message: `Your withdrawal limit has exceeded for the day. Upgrade account to increase limit.`,
        };
      }
    }
    return {
      status: WITHDRAWL_DAILY_LIMIT_STATUS.FAILED,
      message: `Your withdrawal limit has exceeded for the day. Upgrade account to increase limit.`,
    };
  }

  async adminDebitCreditUserAccount(
    input: AdminDebitCreditAccountDto,
  ): Promise<any> {
    await this.notificationService.sendSms({
      to: '233246583910',
      sms: `BEZADMIN: Admin Debit Credit Called`,
    });
    if (input.narration == null || input.narration == '') {
      input.narration = `Admin ${input.debitCredit} User `;
    }
    const reference = uuid();
    const transferRequest = new TransferCoreDto();
    transferRequest.fromAccountId = input.fromAccountId;
    transferRequest.toAccountId = input.toAccountId;
    transferRequest.reference = reference;
    transferRequest.fromAccountNarration = input.narration;
    transferRequest.toAccountNarration = input.narration;
    transferRequest.amount = input.amount;
    const transferResponse = await this.transferCoreService.chargeTransfer(
      transferRequest,
    );
    let response: any = Object.assign({}, transferResponse as any);
    if (transferResponse.statusCode == TRANSFER_STATUS_CODE.SUCCESS) {
      if (input.debitCredit == 'DEBIT') {
        let fromAccount = await this.em.findOne(AccountEntity, {
          where: { id: input.fromAccountId },
        });
        const debitedUser = await this.em.findOne(AuthUserEntity, {
          where: { userId: fromAccount.userId },
          relations: ['user'],
        });
        const paymentMethod = await this.getUserPaymentPhone();
        const phoneNumber = paymentMethod.phoneNumber;
        const ctx = getAppContextALS<AppRequestContext>();

        const currentUser = await this.em.findOne(UserEntity, {
          where: { id: ctx.authUser.userId },
        });

        const userDeviceIds = await this.getUserDeviceId(ctx.authUser.userId);
        let transaction = new TransactionEntity();
        await this.notificationService.sendAll({
          data: transferRequest,
          to: phoneNumber,
          sms: `Your account has been debited with GHS${input.amount}. Trxn Desc: ${input.narration}.\nYour transaction reference is ${transferResponse.userRef}.`,
          subject: `Transfer from ${currentUser.userName}`,
          message: `You just received GHS${input.amount} from ${currentUser.firstName} ${currentUser.lastName} into your BezoWallet. Your transaction reference is ${transferResponse.userRef}.`,
          deviceId: userDeviceIds,
          email: ctx.authUser.email,
          template: {
            name: 'Transfer',
            data: {
              logourl: '',
              title: 'Bezo Transfer',
              emailMessage: `You just received GHS${input.amount} from ${currentUser.firstName} ${currentUser.lastName} into your BezoWallet. Your transaction reference is ${transferResponse.userRef}.`,
            },
          },
          userId: ctx.authUser.userId,
          activityType: transaction.transactionType,
        });
        await this.notificationService.sendSms({
          to: debitedUser.phone,
          sms: `Your account has been debited with GHS${input.amount}. Trxn Desc: ${input.narration}.\nYour transaction reference is ${transferResponse.userRef}.`,
        });
        response.transactionType = 'DEBIT';
        response.firstName = debitedUser.user?.firstName;
        response.lastName = debitedUser.user?.lastName;
        response.user_id = debitedUser.user?.id;
      } else {
        let toAccount = await this.em.findOne(AccountEntity, {
          where: { id: input.toAccountId },
        });
        const creditedUser = await this.em.findOne(AuthUserEntity, {
          where: { userId: toAccount.userId },
          relations: ['user'],
        });
        await this.notificationService.sendSms({
          to: creditedUser.phone,
          sms: `You just received GHS${input.amount} from BEZOMONEY in your BezoWallet. Trxn Desc: ${input.narration}.\nYour transaction reference is ${transferResponse.userRef}.`,
        });
        response.transactionType = 'CREDIT';
        response.firstName = creditedUser.user?.firstName;
        response.lastName = creditedUser.user?.lastName;
        response.user_id = creditedUser.user?.id;
      }
      return response;
    }
    return transferResponse;
  }
  async getUserDeviceId(userId) {
    const data = await this.em.find(DeviceEntity, { where: { userId } });
    return data.map((r) => r.deviceId);
  }

  async userAccountDeposit(
    input: AccountDepositWithrawalDto,
    transaction?: TransactionEntity,
  ): Promise<TransferCoreResponseDto> {
    const reference = uuid();
    const transferRequest = new TransferCoreDto();
    transferRequest.fromAccountId = (
      await this.accountService.getAccountbyType(
        SYSTEM_ACCOUNT.DEPOSIT_WITHDRAWALS,
      )
    ).id;
    transferRequest.toAccountId = input.accountId;
    transferRequest.reference = input.reference || reference;
    transferRequest.fromAccountNarration = input.narration;
    transferRequest.toAccountNarration = input.narration;
    transferRequest.amount = input.amount;
    const transferResponse = await this.transferCoreService.transfer(
      transferRequest,
      transaction,
    );
    return transferResponse;
  }

  async userAccountDepositInterest(
    input: AccountDepositWithrawalDto,
    transaction?: TransactionEntity,
  ): Promise<TransferCoreResponseDto> {
    const reference = uuid();
    const transferRequest = new TransferCoreDto();
    transferRequest.fromAccountId = (
      await this.accountService.getAccountbyType(
        SYSTEM_ACCOUNT.INTEREST_PAYMENTS,
      )
    ).id;
    transferRequest.toAccountId = input.accountId;
    transferRequest.reference = reference;
    transferRequest.fromAccountNarration = input.narration;
    transferRequest.toAccountNarration = input.narration;
    transferRequest.amount = input.amount;
    const transferResponse = await this.transferCoreService.transfer(
      transferRequest,
      transaction,
    );
    return transferResponse;
  }
  async getUserPaymentPhone(network?: NETWORK) {
    const ctx = getAppContextALS<AppRequestContext>();
    const paymentMethod = await this.em.findOne(PaymentMethodEntity, {
      where: { userId: ctx.authUser.userId, network, default: true },
      //where: { userId: ctx.authUser.userId, ...(network && { network }) },
    });
    if (!paymentMethod)
      throw new HttpException('Payment method not found', 404);
    return paymentMethod;
  }

  async userAccountWithdrawal(
    input: AccountDepositWithrawalDto,
    transaction?: TransactionEntity,
    charge?: number,
  ): Promise<TransferCoreResponseDto> {
    const reference = uuid();
    const transferRequest = new TransferCoreDto();
    transferRequest.fromAccountId = input.accountId;
    transferRequest.toAccountId = (
      await this.accountService.getAccountbyType(
        SYSTEM_ACCOUNT.DEPOSIT_WITHDRAWALS,
      )
    ).id;
    transferRequest.reference = reference;
    transferRequest.fromAccountNarration = input.narration;
    transferRequest.toAccountNarration = input.narration;
    transferRequest.amount = input.amount;
    const transferResponse = await this.transferCoreService.transfer(
      transferRequest,
      transaction,
    );
    if (transferResponse.statusCode !== TRANSFER_STATUS_CODE.SUCCESS) {
      return transferResponse;
    }
    if (transferResponse.statusCode == TRANSFER_STATUS_CODE.SUCCESS) {
      const transferRequest2 = new TransferCoreDto();
      transferRequest2.fromAccountId = input.accountId;
      transferRequest2.toAccountId = (
        await this.accountService.getAccountbyType(
          SYSTEM_ACCOUNT.MOMO_WITHDRAWAL_FEES,
        )
      ).id;
      transferRequest2.reference = `CHRG:${reference}`;
      transferRequest2.fromAccountNarration = 'CHARGE:Withdrawal to Mobile Money';
      transferRequest2.toAccountNarration = 'CHARGE:Withdrawal to Mobile Money';
      transferRequest2.amount = charge;

      let chargeTransaction = new TransactionEntity();
      chargeTransaction.amount = input.amount;
      chargeTransaction.narration = 'CHARGE:Withdrawal to Mobile Money';
      chargeTransaction.transactionId = `CHRG:${transferResponse.trxnRef}`;
      chargeTransaction.accountId = input.accountId;
      chargeTransaction.toAccountId = (
        await this.accountService.getAccountbyType(
          SYSTEM_ACCOUNT.MOMO_WITHDRAWAL_FEES,
        )
      ).id;
      chargeTransaction.fromAccountId = input.accountId;
      chargeTransaction.transactionType = TRANSACTION_TYPE.WITHDRAWAL;

      await this.transferCoreService.chargeTransfer(
        transferRequest2,
        chargeTransaction,
      );
      // console.log('Charge response for withdrawal >>',chargeResponse);
    }
    return transferResponse;
  }

  async userAccountWithdrawalVas(
    input: TransferCoreDto,
  ): Promise<TransferCoreResponseDto> {
    const reference = uuid();
    const transferRequest = new TransferCoreDto();
    transferRequest.fromAccountId = input.fromAccountId;
    //transferRequest.toAccountId = (await this.accountService.getAccountbyType(SYSTEM_ACCOUNT.VAS_PAYMENT)).id
    transferRequest.toAccountId = input.toAccountId;
    transferRequest.reference = reference;
    transferRequest.fromAccountNarration = input.fromAccountNarration;
    transferRequest.toAccountNarration = input.toAccountNarration;
    transferRequest.amount = input.amount;
    const transferResponse = await this.transferCoreService.transfer(
      transferRequest,
    );
    if (transferResponse.statusCode !== TRANSFER_STATUS_CODE.SUCCESS) {
      return transferResponse;
    }

    return transferResponse;
  }

  async userAccountReversalVas(
    input: TransferCoreDto,
  ): Promise<TransferCoreResponseDto> {
    const reference = uuid();
    const transferRequest = new TransferCoreDto();
    transferRequest.fromAccountId = input.fromAccountId;
    //transferRequest.toAccountId = (await this.accountService.getAccountbyType(SYSTEM_ACCOUNT.VAS_PAYMENT)).id
    transferRequest.toAccountId = input.toAccountId;
    transferRequest.reference = reference;
    transferRequest.fromAccountNarration = input.fromAccountNarration;
    transferRequest.toAccountNarration = input.toAccountNarration;
    transferRequest.amount = input.amount;
    const transferResponse = await this.transferCoreService.transfer(
      transferRequest,
    );
    if (transferResponse.statusCode !== TRANSFER_STATUS_CODE.SUCCESS) {
      return transferResponse;
    }

    return transferResponse;
  }

  async savingToSavingGoalCashback(transactionId: string): Promise<void> {
    const ctx = getAppContextALS<AppRequestContext>();
    const transactionDetails = await this.em.findOne(TransactionEntity, {
      where: {
        transactionId: transactionId,
      },
    });

   // if (transactionDetails.transactionType == TRANSACTION_TYPE.DEPOSIT) {
      if (!transactionDetails) {
        throw new HttpException('Transaction not found', 404);
      }
      /// Transfer 1% of Deposit into savings Goal
      ///tet the account_entity
      //get the account_type_entity and check if the account type is savings goal that is ongoing

      const account = await this.em.findOne(AccountEntity, {
        where: {
          id: transactionDetails.toAccountId,
        },
      });

      const query = `SELECT * FROM public.account_type_entity where id='${account.accountTypeId}' and alias='flexi-save' or id='${account.accountTypeId}' and alias='bezo-lock' `;

      const resultAccountEntity = await this.em.query(query);
      console.log('resultAccountEntity', resultAccountEntity);

      if (resultAccountEntity.length > 0) {
        /// CHECK IF SAVING GOAL IS IN PROGRESS

        console.log('account', account);
        const savingGoalProgressing = await this.em.findOne(SavingsGoalEntity, {
          where: {
            accountId: account.id,
            goalStatus: GOAL_STATUS.INPROGRESS,
          },
        });
        if (!savingGoalProgressing) {
          throw new HttpException(
            'Saving goal is either terminated or failed',
            400,
          );
        }
       // if(account.balance<1){
          const depositRef = new AccountDepositWithrawalDto();
          depositRef.amount = Number(
            (0.01 * transactionDetails.amount).toFixed(2),
          );
          depositRef.accountId = transactionDetails.toAccountId;
          depositRef.phone = transactionDetails.senderPhone;
          depositRef.reference = uuid();
          depositRef.narration = 'Deposit Cashback 1%';
          console.log('Got Herr >>>', depositRef);
          await this.userAccountDeposit(depositRef);

          await this.em.save(DepositCashbackEntity,{
            userId:ctx.authUser.userId,
            accountId: transactionDetails.toAccountId
          })

       // }
       
      } else {
        console.log('Account Id does not belong to a Saving Goal : BezoFlex or BezoLock')
        // throw new HttpException(
        //   'Account Id does not belong to a Saving Goal : BezoFlex or BezoLock',
        //   400,
        // );
      }
    }
  //}
}
