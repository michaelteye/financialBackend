import { StreakEntity } from './../../streak/entities/streak.entity';
import { StreakService } from './../../streak/service/streak.service';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Injectable,
  HttpException,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { TransactionEntity } from '../entities/transaction.entity';
import { Repository, EntityManager } from 'typeorm';
import { DepositInputDto } from '../dtos/deposit.dto';
import { getAppContextALS } from '../../../utils/context';
import { AppRequestContext } from '../../../utils/app-request.context';
import { uuid } from 'uuidv4';
import { gen } from 'n-digit-token';
import { TRANSACTION_STATUS } from '../../enums/transaction.status';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { PaymentMethodEntity } from '../../main/entities/paymentmethod.entity';
import { NETWORK } from '../../main/entities/enums/network.enum';
import { HttpRequestService } from '../../shared/services/http.request.service';
import { AccountEntity } from '../../account/entities/account.entity';
import { UserPinService } from '../../userpin/services/userpin.service';
import { AccountService } from '../../account/services/account.service';
import { TransferService } from '../../transfers/services/transfer.service';
import { AccountDepositWithrawalDto } from '../../transfers/dto/AccountDepositDto';
import { TRANSFER_STATUS_CODE } from '../../transfers/enums/transferstatus.enum';
import { NotificationService } from '../../notifications/services/notification.service';
import TRANSFER_STATUS_MESSAGE from '../../transfers/enums/transferstatus.message';
import { MyLoggerService } from '../../../logger.service';
import { StreakRecordInputDto } from '../../streak/dtos/streak.dto';
import { MandateEntity } from '../entities/mandate.entity';
import {
  WithdrawalLimitDto,
  WithdrawalLimitInputDto,
} from '../../account/dtos/withdrawal-limit.dto';
import {
  WITHDRAWL_DAILY_LIMIT_STATUS,
  WITHDRAWL_DAILY_LIMIT_TYPE,
} from '../../enums/withdrawal-limit-type.enum';
import { STATUS } from '../../auth/entities/enums/status.enum';
import { MandateStatus } from '../../enums/mandate.status.enum';
import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { FeesEntity } from '../../transfers/entities/fees.entity';
import { FEE_TYPE } from '../../enums/fee-type.enum';
import { AuthUserRole } from '../../auth/types/auth-user.roles';
import { FEE_FORMAT } from '../../enums/fee-format.enum';
import { PlATFORM } from '../../main/entities/enums/platform.enum';
import { SYSTEM_ACCOUNT } from '../../transfers/services/systemaccts.constants';
import { DeviceEntity } from '../../main/entities/device.entity';
import { VasTransactionEntity } from '../../vas/entities/vas.entity';
import { TransferCoreDto } from '../../transfers/dto/TransferCoreDto';
import Joi from 'joi';
import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
import { GOAL_STATUS } from '../../auth/entities/enums/goal-status.enum';
import { TransactionStatus } from '../../userpin/entities/userpin.entity';
import { AutodeductcheckerEntity } from '../entities/auto-deduct-checker.entity';
import { LEVEL } from 'src/modules/auth/entities/enums/level.enum';

@Injectable()
export class TransactionService extends HttpRequestService {
  logger = new MyLoggerService(TransactionService.name);
  constructor(
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,

    @InjectRepository(PaymentMethodEntity)
    private paymentRepository: Repository<PaymentMethodEntity>,

    @InjectRepository(AccountEntity)
    private accountRepository: Repository<AccountEntity>,
    @Inject(forwardRef(() => UserPinService))
    private userPinService: UserPinService,
    private accountService: AccountService,

    @Inject(forwardRef(() => TransferService))
    private transferService: TransferService,
    private notificationService: NotificationService,

    // @Inject(forwardRef(() => StreakService))
    private streakService: StreakService,

    private em: EntityManager,
  ) {
    super();
  }

  async getTransactionStatus(ref: string) {
    const status = await this.em.findOne(TransactionEntity, {
      where: { transactionId: ref },
    });
    if (status) return status;
    throw new HttpException('Transaction not found', 404);
  }

  async userHasEnoughBalance(userId: string, amount: number) {
    const account = await this.getUserDefaultAccount(userId);
    if (account) {
      if (Number(account.balance) >= Number(amount)) return true;
      return false;
    }
    return false;
  }

  async deposit(input: DepositInputDto) {
    const type = TRANSACTION_TYPE.CREDIT;
    await this.userPinService.verifyId(input.verificationId);
    const ctx = getAppContextALS<AppRequestContext>();

    const reference = uuid();

    let transaction = new TransactionEntity();
    transaction.amount = input.amount;
    transaction.userId = ctx.authUser.userId;
    transaction.transactionType = TRANSACTION_TYPE.DEPOSIT;
    transaction.transactionId = reference;

    if (input.channel == null) {
      input.channel = PlATFORM.web;
    }
    transaction.platform = input.channel;
    //transaction.accountId = input.accountId;
    console.log('Account Id>>> o', transaction);

    const paymentMethod = await this.getUserPaymentPhone();
    const phoneNumber = paymentMethod.phoneNumber;
    const network = paymentMethod.network;
    const paymentVendor = input.paymentVendor;

    if (!input.verificationId) {
      throw new HttpException('Verification Id is required', 400);
    }
    if (ctx.authUser.accountStatus == STATUS.disabled) {
      throw new HttpException('Your account has been disabled', 400);
    }
    if (input.accountId == null) {
      const userAccount = await this.getUserDefaultAccount(ctx.authUser.userId);
      transaction.accountId = userAccount.id;
    } else {
      transaction.accountId = input.accountId;
    }
    console.log('Transaction Entity >>>> Id>>> o', transaction);
    transaction.transactionType = TRANSACTION_TYPE.DEPOSIT;
    const paymentMode =
      network === 'airteltigo' ? 'AIRTEL_TIGO' : network?.toUpperCase();
    const depositWithdrawalResponse =
      await this.callPaymentGateWayForDepositWithdrawal(
        phoneNumber,
        input.amount,
        reference,
        type,
        paymentMode,
        paymentVendor,
        input.email,
      );
    this.logger.log(
      depositWithdrawalResponse,
      'Deposit response from Payment gateway',
    );

    console.log('Deposit Withdrawal response>>>', depositWithdrawalResponse);

    // including the sendpush
    console.log('transaction vv', transaction);
    if (depositWithdrawalResponse.status === 'PENDING') {
      transaction.senderPhone = phoneNumber;
      transaction.transactionData = depositWithdrawalResponse;
      if (!input.description) {
        transaction.narration = 'Deposit to account';
      }
      const depositedTransaction = await this.em.save(transaction);

      if (paymentMethod.network === NETWORK.vodafone) {
        await this.notificationService.sendSms({
          to: ctx.authUser.phone,
          sms: `Dear Bezo User, kindly retry  your deposit transaction if you do not receive any prompt in the next 2 minutes.`,
        });
      } else if (paymentMethod.network === NETWORK.mtn) {
        await this.notificationService.sendSms({
          to: ctx.authUser.phone,
          sms: `Dear Bezo Saver, kindly check your approvals by dialing *170# and approve your deposit transaction if you do not receive any prompt in the next 2 minutes.`,
        });
      } else {
        await this.notificationService.sendSms({
          to: ctx.authUser.phone,
          sms: `Dear Bezo User, kindly try again if you don't receive a prompt in the next 2 minutes.`,
        });
      }

      ////ADD STREAK SERVICE BEFORE RETURNING DEPOSIT RESPONSE
      try {
        console.log('Saving Streak');
        const streakInput = new StreakRecordInputDto();
        streakInput.createdAt = input.createdAt;
        streakInput.transactionId = depositedTransaction.transactionId;
        streakInput.accountId = depositedTransaction.accountId;
        streakInput.userId = ctx.authUser.userId;
        console.log('Saving Streak', streakInput);
        await this.streakService.saveStreak(streakInput, transaction);
        return depositWithdrawalResponse;
      } catch (error) {
        console.log('STREAK ERROR >>>>', error);
      }
    } else {
      transaction.senderPhone = phoneNumber;
      transaction.transactionData = depositWithdrawalResponse;
      transaction.transactionStatus = TRANSACTION_STATUS.FAILED;
      if (!input.description) {
        transaction.narration = 'Deposit to account';
      }
      console.log('Transaction entity b4 save>>>>>', transaction);
      let saveResult = await this.em.save(transaction);
      console.log('Transaction entity save result save>>>>>', saveResult);
      // including the sendall
      const userDeviceIds = await this.getUserDeviceId(ctx.authUser.userId);
      console.log('Get device Id response  >>>>', userDeviceIds);
      await this.notificationService.sendSms({
        to: ['233246583910', '233559876496'],
        sms: `BEZADMIN: Payment GateWay issue Deposit. ${transaction.transactionId}.`,
      });
    }
    return depositWithdrawalResponse;
  }

  async depositPaystack(input: DepositInputDto) {
    await this.userPinService.verifyId(input.verificationId);
    const ctx = getAppContextALS<AppRequestContext>();

    const reference = uuid();

    let transaction = new TransactionEntity();
    transaction.amount = input.amount;
    transaction.userId = ctx.authUser.userId;
    transaction.transactionType = TRANSACTION_TYPE.DEPOSIT;
    transaction.transactionId = reference;

    if (input.channel == null) {
      input.channel = PlATFORM.web;
    }
    transaction.platform = input.channel;
    //transaction.accountId = input.accountId;
    console.log('Account Id>>> o', transaction);

    const paymentMethod = await this.getUserPaymentPhone();
    const phoneNumber = paymentMethod.phoneNumber;
    const network = paymentMethod.network;
    const paymentVendor = input.paymentVendor;

    if (!input.verificationId) {
      throw new HttpException('Verification Id is required', 400);
    }
    if (ctx.authUser.accountStatus == STATUS.disabled) {
      throw new HttpException('Your account has been disabled', 400);
    }
    if (input.accountId == null) {
      const userAccount = await this.getUserDefaultAccount(ctx.authUser.userId);
      transaction.accountId = userAccount.id;
    } else {
      transaction.accountId = input.accountId;
    }
    console.log('Transaction Entity >>>> Id>>> o', transaction);
    transaction.transactionType = TRANSACTION_TYPE.DEPOSIT;
    // const paymentMode =
    //   network === 'airteltigo' ? 'AIRTEL_TIGO' : network?.toUpperCase();
    const type = TRANSACTION_TYPE.CREDIT;

    const depositWithdrawalResponse =
      await this.callPaymentGateWayForDepositWithdrawal(
        phoneNumber,
        input.amount,
        reference,
        type,
        'VISA',
        'PAYSTACK',
      );

    transaction.senderPhone = phoneNumber;
    if (!input.description) {
      transaction.narration = 'Deposit to account';
    }

    if (depositWithdrawalResponse.status === 'PENDING') {
      transaction.transactionStatus = TRANSACTION_STATUS.PENDING;

      const depositedTransaction = await this.em.save(transaction);
      ////ADD STREAK SERVICE BEFORE RETURNING DEPOSIT RESPONSE
      try {
        console.log('Saving Streak');
        const streakInput = new StreakRecordInputDto();
        streakInput.createdAt = input.createdAt;
        streakInput.transactionId = depositedTransaction.transactionId;
        streakInput.accountId = depositedTransaction.accountId;
        streakInput.userId = ctx.authUser.userId;

        await this.streakService.saveStreak(streakInput, depositedTransaction);
        return depositedTransaction;
      } catch (error) {
        console.log('STREAK ERROR >>>>', error);
      }
    } else {
      transaction.transactionStatus = TRANSACTION_STATUS.FAILED;
      await this.em.save(transaction);

      throw new HttpException(
        'Deposit failed to be initiated. Kindly try again another time',
        400,
      );
    }
  }

  async depositPaystackVerify(payload) {
    const checkerDeposit = await this.callPaymentGateWayVerifyDeposit(payload);
    return checkerDeposit;
  }

  async cancelDepositWithPaystack(transactionId: string) {
    const transaction = await this.em.findOne(TransactionEntity, {
      where: { transactionId },
    });
    console.log('transaction', transaction);
    if (transaction) {
      transaction.transactionStatus = TRANSACTION_STATUS.FAILED;
      await this.em.update(TransactionEntity, { transactionId }, transaction);
    } else {
      throw new HttpException('TRANSACTION ID NOT FOUND', 404);
    }
  }

  /**
   * Withdrawal from account method
   * @param input DepositInputDto
   *
   * @returns {status:"PENDING/SUCCESS"}
   */
  async withdrawal(input: DepositInputDto): Promise<any> {
    let limitErrorMessage = { code: '', message: '' };
    console.log('Withdrawal payload >>', input);
    if (!input.verificationId) {
      throw new HttpException('Verification Id is required', 400);
    }
    await this.userPinService.verifyId(input.verificationId);
    const ctx = getAppContextALS<AppRequestContext>();
    if (ctx.authUser.accountStatus == STATUS.disabled) {
      throw new HttpException('Your account has been disabled', 400);
    }
    const reference = uuid();
    if (input.channel == null) {
      input.channel = PlATFORM.web;
    }
    let transaction = new TransactionEntity();
    transaction.amount = input.amount;
    transaction.userId = ctx.authUser.userId;
    transaction.transactionId = reference;
    transaction.userRef = '' + gen(5);
    transaction.transactionStatus = TRANSACTION_STATUS.PENDING;
    transaction.accountId = input.accountId;
    transaction.transactionType = TRANSACTION_TYPE.WITHDRAWAL;
    transaction.platform = input.channel;

    if (input.amount < 1) {
      throw new HttpException(
        'Sorry you cannot withdrawal below GHS1. Kindly try again later',
        400,
      );
    }

    const paymentMethod = await this.getUserPaymentPhone();
    console.log('paymentMethod', paymentMethod);
    if (paymentMethod.phoneNumber) {
      const phoneNumber = paymentMethod.phoneNumber;
      transaction.senderPhone = phoneNumber;
      const network = paymentMethod.network;

      // if (network == NETWORK.vodafone) {
      //   throw new HttpException(
      //     'Sorry we cannot process your request at the moment. Kindly try again later',
      //     400,
      //   );
      // }

      let depositWithdrawalResponse = {
        message: '',
        status: '',
        reference: '',
      };
      console.log('Using doing withdrawal >>', input);
      transaction.transactionType = TRANSACTION_TYPE.WITHDRAWAL;
      const withdrawl = new AccountDepositWithrawalDto();
      withdrawl.amount = input.amount;
      withdrawl.phone = phoneNumber;
      if (transaction.accountId == null) {
        const userAccount = await this.getUserDefaultAccount(
          transaction.userId,
        );
        transaction.accountId = userAccount.id;
        withdrawl.accountId = userAccount.id;
      } else {
        withdrawl.accountId = transaction.accountId;
      }
      withdrawl.reference = reference;
      if (!input.description) {
        transaction.narration = 'Withdrawal from account';
        withdrawl.narration = 'Withdrawal from account';
      } else {
        transaction.narration = input.description;
        withdrawl.narration = input.description;
      }

      const roles = ctx.authUser.roles;
      let isStaff = roles.indexOf(AuthUserRole.Staff) > -1;
      let totalDebitAmount = withdrawl.amount;
      let charge = 0;
      if (!isStaff) {
        // charge = await this.calculateWithdrawalCharge(withdrawl.amount);
        totalDebitAmount = Number(withdrawl.amount) + Number(charge);
      }

      const allowWithdrawal =
        await this.transferService.dailyWithdrawalLimitAndDailyLimit(
          ctx.authUser.userId,
          TRANSACTION_TYPE.WITHDRAWAL,
          totalDebitAmount,
          ctx.authUser.user.level,
        );
      console.log('withdrawlLimit', allowWithdrawal);
      if (allowWithdrawal.status == WITHDRAWL_DAILY_LIMIT_STATUS.SUCCESS) {
        if (
          await this.accountService.accountHasEnoughBalance(
            withdrawl.accountId,
            totalDebitAmount,
          )
        ) {
          const paymentMode =
            network === 'airteltigo' ? 'AIRTEL_TIGO' : network.toUpperCase();
          const debitResponse =
            await this.transferService.userAccountWithdrawal(
              withdrawl,
              transaction,
              charge,
            );
          console.log('debitResponse >>>>', debitResponse);
          transaction.transactionStatus = TRANSACTION_STATUS.PENDING;
          this.logger.log(
            debitResponse,
            'debitResponse from withdrawal method',
          );
          if (debitResponse.statusCode == TRANSFER_STATUS_CODE.SUCCESS) {
            //saving push notification here
            const userDeviceIds = await this.getUserDeviceId(
              ctx.authUser.userId,
            );
            depositWithdrawalResponse =
              await this.callPaymentGateWayForDepositWithdrawal(
                phoneNumber,
                input.amount,
                reference,
                TRANSACTION_TYPE.DEBIT,
                paymentMode,
              );
            this.logger.log(
              depositWithdrawalResponse,
              'Withdrawal depositWithdrawalResponse from payment gateway',
            );
            console.log('depositWithdrawalResponse', depositWithdrawalResponse);
            //if (Object.keys(checkerWithdrawal).length > 1) {
            if (depositWithdrawalResponse.status === 'PENDING') {
              transaction.transactionStatus = TRANSACTION_STATUS.PENDING;
              await this.em.save(transaction);
            } else {
              ///REVERSE TRANSACTION IF IT DOES NOT HIT PAYMENT GATEWAY
              ///CALLING REVERSAL FUNCTION
              depositWithdrawalResponse.status = 'PENDING';
              await this.transactionCallback({
                transactionRef: depositWithdrawalResponse.reference,
                status: 'FAILED',
              });
              this.logger.log(
                'Payment gateway not returning PENDING for withdrawal Sending SMS to admin for failed withdrawal. ',
              );
              await this.notificationService.sendSms({
                to: '233246583910',
                sms: `BEZADMIN: 'Payment gateway not returning PENDING for withdrawal. ${withdrawl.reference}.`,
              });

              throw new HttpException(
                'Your withdrawal failed. Kindly try another time',
                400,
              );
            }
          } else {
            transaction.transactionStatus = TRANSACTION_STATUS.FAILED;
            depositWithdrawalResponse.message = debitResponse.message;
            depositWithdrawalResponse.status = debitResponse.statusCode;
            this.logger.log(
              debitResponse,
              'Sending SMS to admin for failed withdrawal ',
            );
            // sending a push notification for failed withdrawal
            const userDeviceIds = await this.getUserDeviceId(
              ctx.authUser.userId,
            );
            await this.notificationService.sendSms({
              to: '233246583910',
              sms: `BEZADMIN: Debit issue Withdrawal.${withdrawl.reference}.`,
            });
          }
        } else {
          this.logger.log(
            transaction,
            'User has insufficient balance for withdrawal ',
          );
          depositWithdrawalResponse = {
            message:
              TRANSFER_STATUS_MESSAGE[
                TRANSFER_STATUS_CODE.INSUFFICIENT_BALANCE
              ],
            status: TRANSFER_STATUS_CODE.INSUFFICIENT_BALANCE,
            reference: '',
          };

          transaction.transactionData = depositWithdrawalResponse;
          transaction.transactionStatus = TRANSACTION_STATUS.FAILED;
        }
      } else {
        if (ctx.authUser.user.level === LEVEL.beginner) {
          limitErrorMessage.code = '101';
          limitErrorMessage.message = `Oops! You have exceeded your withdrawal limit of GHS50 for the day. Upgrade now to increase your limit to GHS5000 daily.`;
          throw new HttpException(limitErrorMessage, 400);
        } else if (ctx.authUser.user.level === LEVEL.advance) {
          limitErrorMessage.code = '102';
          limitErrorMessage.message = `Oops! You have exceeded your withdrawal limit of GHS5000 for today. Please try again tomorrow.`;
          throw new HttpException(limitErrorMessage, 400);
        } else {
          throw new HttpException(allowWithdrawal.message, 400);
        }
      }
      transaction.transactionData = depositWithdrawalResponse;
      if (
        depositWithdrawalResponse &&
        depositWithdrawalResponse.status === 'PENDING'
      ) {
        transaction.senderPhone = phoneNumber;
        return depositWithdrawalResponse;
      }
      await this.em.save(transaction);
      throw new HttpException(depositWithdrawalResponse, 400);
    }
    throw new HttpException('Payment method not found', 404);
  }

  async depositWithoutVerification(
    input: DepositInputDto,
    userId: string,
    phone_number: string,
  ) {
    const type = TRANSACTION_TYPE.CREDIT;
    const ctx = getAppContextALS<AppRequestContext>();

    const reference = uuid();

    let transaction = new TransactionEntity();
    transaction.amount = input.amount;
    transaction.userId = userId;
    transaction.transactionType = TRANSACTION_TYPE.DEPOSIT;
    transaction.transactionId = reference;
    if (input.channel == null) {
      input.channel = PlATFORM.web;
    }
    transaction.platform = input.channel;
    //transaction.accountId = input.accountId;
    console.log('Account Id>>> o', transaction);

    const paymentMethod = await this.getUserPaymentPhoneDeposiNonVerified(
      userId,
    );

    const phoneNumber = paymentMethod.phoneNumber;
    const network = paymentMethod.network;

    if (!input.verificationId) {
      throw new HttpException('Verification Id is required', 400);
    }

    if (input.accountId == null) {
      const userAccount = await this.getUserDefaultAccount(userId);
      transaction.accountId = userAccount.id;
    } else {
      transaction.accountId = input.accountId;
    }

    transaction.transactionType = TRANSACTION_TYPE.DEPOSIT;
    const paymentMode =
      network === 'airteltigo' ? 'AIRTEL_TIGO' : network?.toUpperCase();
    console.log('Calling payment gateway>>>>>');
    const depositWithdrawalResponse =
      await this.callPaymentGateWayForDepositWithdrawal(
        phoneNumber,
        input.amount,
        reference,
        type,
        paymentMode,
      );
    this.logger.log(
      depositWithdrawalResponse,
      'Deposit response from Payment gateway',
    );
    if (depositWithdrawalResponse.status === 'PENDING') {
      transaction.senderPhone = phone_number;
      transaction.transactionData = depositWithdrawalResponse;
      if (!input.description) {
        transaction.narration = 'Deposit to account';
      }
      console.log('The transaction entity >>>', JSON.stringify(transaction));
      const depositedTransaction = await this.em.save(transaction);
      ////ADD STREAK SERVICE BEFORE RETURNING DEPOSIT RESPONSE
      try {
        const streakInput = new StreakRecordInputDto();
        streakInput.createdAt = input.createdAt;
        streakInput.transactionId = depositedTransaction.transactionId;
        streakInput.accountId = depositedTransaction.accountId;
        streakInput.userId = userId;
        await this.streakService.saveStreak(streakInput, transaction);
        return depositWithdrawalResponse;
      } catch (error) {
        console.log('STREAK ERROR >>>>', error);
      }
    } else {
      await this.em.save(transaction);
      await this.notificationService.sendSms({
        to: '233246583910',
        sms: `BEZADMIN: Payment GateWay issue Deposit. ${transaction.transactionId}.`,
      });
    }
  }

  async creditUserPrimaryAccount(amount: number, userId: string) {
    const account = await this.getUserDefaultAccount(userId);
    if (account) {
      const credit = new AccountDepositWithrawalDto();
      credit.amount = amount;
      credit.accountId = account.id;
      credit.reference = uuid();
      credit.narration = 'Deposit to primary account';
      this.transferService.userAccountDeposit(credit);
    }
    throw new HttpException('Primary Account not found', 404);
  }

  async getUserPaymentPhone(network?: NETWORK) {
    const ctx = getAppContextALS<AppRequestContext>();
    const paymentMethod = await this.paymentRepository.findOne({
      where: { userId: ctx.authUser.userId, network, default: true },
      //where: { userId: ctx.authUser.userId, ...(network && { network }) },
    });
    if (!paymentMethod)
      throw new HttpException('Payment method not found', 404);
    return paymentMethod;
  }

  async getUserPaymentPhoneDeposiNonVerified(id) {
    const paymentMethod = await this.paymentRepository.findOne({
      where: { userId: id, default: true },
      //where: { userId: ctx.authUser.userId, ...(network && { network }) },
    });
    if (!paymentMethod)
      throw new HttpException('Payment method not found', 404);
    return paymentMethod;
  }

  async callPaymentGateWayForDepositWithdrawal(
    phone: string,
    amount: number,
    reference: string,
    type: TRANSACTION_TYPE,
    paymentMode: string,
    paymentVendor?: string,
    email?: string,
  ) {
    const url = `${this.cfg.payment.url}/${
      type === TRANSACTION_TYPE.CREDIT ? 'debit' : 'credit'
    }`;
    console.log('environment', process.env.NODE_ENV);
    const data = {
      phoneNumber: phone,
      amount: amount,
      callbackUrl: this.cfg.payment.callbackUrl,
      reference,
      narration: reference,
      paymentMode,
      paymentVendor: paymentVendor,
      email: email,
    };

    console.log('data sending>>>>', data);
    this.logger.log(`Initiating ${type} request to ${url}`);
    this.logger.log(`Request data: ${JSON.stringify(data, null, 2)}`);
    this.logger.log(`Request url ${url}`);

    await this.post(url, data);
    this.logger.log(`Error Response ${JSON.stringify(this.error, null, 2)}`);
    if (this.error) {
      this.logger.log('Error Calling payment gateway>>' + this.error);
      throw new HttpException(this.error, 400);
    }
    if (!this.response.status) {
      this.response.status = 'PENDING';
    }
    this.logger.log(`Response ${JSON.stringify(this.response, null, 2)}`);
    this.response.reference = reference;
    return this.response;
  }

  async callPaymentGateWayVerifyDeposit(payload) {
    const url = `${this.cfg.payment.url}/callback/normal/PAYSTACK`;

    const data = {
      status: payload.status,
      message: payload.message,
      data: {
        reference: payload.data.reference,
        status: payload.data.status,
        gateway_response: payload.data.gateway_response,
      },
      reference: payload.data.reference,
    };

    console.log('data paystack >>>', data);
    await this.post(url, data);
    this.logger.log(`Error Response ${JSON.stringify(this.error, null, 2)}`);
    if (this.error) {
      this.logger.log('Error Calling payment gateway>>' + this.error);
      throw new HttpException(this.error, 400);
    }
    this.logger.log(`Response ${JSON.stringify(this.response, null, 2)}`);
    //this.response.reference = reference;
    return this.response;
  }

  async transactionCallback(request: any) {
    const transaction = await this.getTransactionByRefAndStatus(
      request.transactionRef,
      TRANSACTION_STATUS.PENDING,
    );
    if (transaction) {
      if (transaction.transactionStatus === TRANSACTION_STATUS.PENDING) {
        console.log('Updating transaction');

        //await this.updateTransaction(request, transaction);

        Promise.race([await this.updateTransaction(request, transaction)])
          .then((value) => {
            console.log('succeeded with value:', value);
          })
          .catch((reason) => {
            // Only promise1 is fulfilled, but promise2 is faster
            console.error('failed with reason:', reason);
          });
      } else {
        transaction.transactionData = request;
        await this.em.save(transaction);
        // await this.notificationService.sendSms({
        //   to: ['233246583910', '233559876496'],
        //   sms: `BEZADMIN: Failed callback received from Payment GateWay. ${transaction.transactionId}.`,
        // });
      }
    }
    return 'success';
  }

  async transactionCallbackPayStack(request: any) {
    const transaction = await this.getTransactionByRefAndStatus(
      request.data.reference,
      TRANSACTION_STATUS.PENDING,
    );
    console.log('Transaction From Bezo ', transaction);
    if (transaction) {
      if (transaction.transactionStatus === TRANSACTION_STATUS.PENDING) {
        console.log('Updating transaction');

        //await this.updateTransaction(request, transaction);

        Promise.race([
          await this.updateTransactionPaystack(request, transaction),
        ])
          .then((value) => {
            console.log('succeeded with value:', value);
          })
          .catch((reason) => {
            // Only promise1 is fulfilled, but promise2 is faster
            console.error('failed with reason:', reason);
          });
      } else {
        transaction.transactionData = request;
        await this.em.save(transaction);
        // await this.notificationService.sendSms({
        //   to: ['233246583910', '233559876496'],
        //   sms: `BEZADMIN: Failed callback received from Payment GateWay. ${transaction.transactionId}.`,
        // });
      }
    }
    return 'success';
  }

  async getTransactionByRefAndStatus(ref: string, status: TRANSACTION_STATUS) {
    return await this.transactionRepository.findOne({
      where: { transactionId: ref, transactionStatus: status },
    });
  }

  async transactionAutoDeductCallback(request: any) {
    console.log('Auto deduct callback payload>>', request);
    const mandate = await this.getMandateByReference(request.mandateReference);
    console.log('mandate found', JSON.stringify(mandate));

    if (mandate) {
  
      const query = `select * from autodeductchecker_entity where "reference"='${request.reference}' and "mandateId"='${request.mandateId}' `;
      //   console.log("AutoDeductCheckerEntity",foundRes)
      const respFound = await this.em.query(query);

      console.log("respFound",respFound,"respFound Length",respFound.length)

      if (respFound.length==0) {
        if (
          mandate.status == MandateStatus.ACTIVE &&
          request.status == 'SUCCESS'
        ) {
          console.log('when mandate is true');
          const deposit = new AccountDepositWithrawalDto();
          deposit.amount = Number(request.amount);
          deposit.accountId = mandate.accountId;
          deposit.narration = `Autodeduct Deposit`;

          console.log("deposit data>>>",deposit)
          try {
            // let autoDeductChecker = await this.em.save(
            //   AutodeductcheckerEntity,
            //   {
            //     reference: request.reference,
            //     mandateId: request.mandateReference,
            //     mandateReference: request.mandateReference
            //   },
            // );

            const query= `INSERT INTO public.autodeductchecker_entity(
              "mandateId", "reference","mandateReference")
               VALUES ('${request.mandateId}', '${request.reference}', '${request.mandateReference}'); `

            const result2= await this.em.query(query)

            let depositResponse = await this.transferService.userAccountDeposit(
              deposit,
            );
            if (depositResponse.statusCode == TRANSFER_STATUS_CODE.SUCCESS) {
              await this.notificationService.sendSms({
                to: mandate.phoneNumber,
                sms: `Dear BezoSaver, \nYour automatic deduction from your mobile money wallet was successful. An amount of GHS${deposit.amount} was credited to your goal account. Transaction ID:${depositResponse.userRef}.`,
              });
            }

            
            console.log('Deposit response >>', depositResponse);
            this.logger.log(
              'Auto Deduction Deposit Response >>',
              depositResponse,
            );
            return { status: '00', message: 'Received' };
          } catch (error) {
            console.log('Error whilst Crediting User >>> AutoDeduction', error);
            this.logger.error('Auto Deduction Deposit Response >>', error);
          }
        }
      }else{
        console.log("respFound don't save",respFound,"respFound Length",respFound.length)

      }
    }
   
  }

  async mandateCreateCallback(request: any) {
    console.log('Mandate callback payload>>', request);
    const mandate = await this.getMandateByReference(request.reference);
    if (mandate) {
      if (request.status === 'SUCCESS') {
        const deposit = new AccountDepositWithrawalDto();
        deposit.amount = Number(request.amount);
        deposit.accountId = mandate.accountId;
        deposit.narration = `Autodeduct Mandate Approval`;
        mandate.status = MandateStatus.ACTIVE;
        mandate.mandateId = request.mandateId;
        try {
          let depositResponse = await this.transferService.userAccountDeposit(
            deposit,
          );
          if (depositResponse.statusCode == TRANSFER_STATUS_CODE.SUCCESS) {
            await this.notificationService.sendSms({
              to: mandate.phoneNumber,
              sms: `Dear BezoSaver, Your auto-deduct mandate approval was successful. An amount of GHS${deposit.amount} has been credited to your goal account. Transaction ID: ${depositResponse.userRef}.`,
            });
          }
          console.log('Deposit response >>', depositResponse);
          this.logger.log(
            'Mandate Creation Deposit Response >>',
            depositResponse,
          );
        } catch (error) {
          console.log(
            'Error whilst Crediting User >>> Mandate Creation',
            error,
          );
          this.logger.error('Mandate Creation Deposit Response >>', error);
        }
      } else {
        mandate.status = MandateStatus.FAILED;
      }
      await this.em.save(mandate);
    }
    return { status: '00', message: 'Received' };
  }

  // function for getting all users deviceId.
  async getUserDeviceId(userId) {
    const data = await this.em.find(DeviceEntity, { where: { userId } });
    return data.map((r) => r.deviceId);
  }

  private async getMandateByReference(reference: string) {
    return await this.em.findOne(MandateEntity, {
      where: { reference: reference },
    });
  }

  async getTransactionByRef(ref: string) {
    return await this.transactionRepository.findOne({
      where: { transactionId: ref },
    });
  }

  async updateTransaction(data, transaction: TransactionEntity) {
    console.log('Updating transaction data>>', data);
    const ctx = getAppContextALS<AppRequestContext>();

    // console.log('Updating AB TB>>', transaction);

    const account = await this.em.findOne(AccountEntity, {
      where: {
        id: transaction.accountId,
      },
    });
    if (transaction && data.status === 'SUCCESS') {
      transaction.transactionStatus = TRANSACTION_STATUS.SUCCESS;
      transaction.transactionData = data;
      await this.transactionRepository.save(transaction);
      if (transaction.transactionType === TRANSACTION_TYPE.DEPOSIT) {
        const deposit = new AccountDepositWithrawalDto();
        deposit.amount = transaction.amount;
        deposit.accountId = transaction.accountId;
        deposit.phone = transaction.senderPhone;
        deposit.reference = transaction.transactionId;
        deposit.narration = 'Deposit to primary account';
        console.log('Got Herr >>>', deposit);
        await this.transferService.userAccountDeposit(deposit, transaction);
        const streakInfo = await this.em.findOne(StreakEntity, {
          where: {
            accountId: account.id,
          },
        });

        const authUser = await this.em.findOne(AuthUserEntity, {
          where: {
            phone: deposit.phone,
          },
        });

        console.log('authUser', authUser);
        streakInfo.isstreak = true;
        console.log('streakInfo', streakInfo);
        await this.em.save(streakInfo);
        const userDeviceIds = await this.getUserDeviceId(authUser.userId);
        await this.notificationService.sendAll({
          data: transaction,
          to: transaction.senderPhone,
          sms: `Dear BezoSaver, Your deposit amount of GHS${deposit.amount} was successful. Transaction ID: ${transaction.userRef}. Fee charged: GHS0.00. Your current balance is ${account.balance}.`,
          subject: 'Bezo Deposit',
          message: `Dear BezoSaver, Your deposit amount of GHS${deposit.amount} was successful. Transaction ID: ${transaction.userRef}. Fee charged: GHS0.00. Your available balance is ${account.balance}.`,
          deviceId: userDeviceIds,
          email: authUser.email,
          template: {
            name: 'deposit',
            data: {
              logourl: '',
              title: 'Bezo Deposit',
              emailMessage:`Dear Customer, Your deposit amount of GHS${deposit.amount} was successful. Transaction ID: ${transaction.userRef}.  Fee charged: GHS0.00. Your current balance is ${account.balance}.`,
            },
          },
          userId: authUser.userId,
          activityType: transaction.transactionType,
        });

        // const accountNew = await this.em.findOne(AccountEntity, {
        //   where: {
        //     id: transaction.accountId,
        //   },
        // });

        const query = ` select * from account_entity where id='${transaction.accountId}'`;
        const res = await this.em.query(query);

        // SendSms

        if (res.length > 0) {
          await this.notificationService.sendSms({
            to: transaction.senderPhone,
            sms: `Dear BezoSaver, Your deposit amount of GHS${deposit.amount} was successful. Transaction ID: ${transaction.userRef}.  Fee charged: GHS0.00. Your current balance is ${res[0].balance}.`,
          });
        }
      } else if (transaction.transactionType === TRANSACTION_TYPE.WITHDRAWAL) {
        // const accountNew = await this.em.findOne(AccountEntity, {
        //   where: {
        //     id: transaction.accountId,
        //   },
        // });

        const query = ` select * from account_entity where id='${transaction.accountId}'`;
        const res = await this.em.query(query);

        if (res.length > 0) {
          await this.notificationService.sendSms({
            to: data.phoneNumber,
            sms: `Dear BezoSaver, Your withdrawal amount of GHS${transaction.amount} was successful. Transaction ID: ${transaction.userRef}.Your current balance is ${res[0].balance}.`,
          });
        }
      }
    } else {
      transaction.transactionStatus = TRANSACTION_STATUS.FAILED;
      // this.reverseTransaction(transaction);
    }
    const res = await this.transactionRepository.save(transaction);
    if (
      res.transactionType == TRANSACTION_TYPE.WITHDRAWAL &&
      res.transactionStatus === TRANSACTION_STATUS.SUCCESS
    ) {
      // const otpSmsResponse = await this.notificationService.sendSms({
      //   to: transaction.senderPhone,
      //   sms: `Dear Customer, Your withdrawal for GHS${res.amount} was successful. Transaction ID: ${transaction.userRef}. Fee charged: GHS0.00. Your current balance is ${account.balance}  Thank you for choosing Bezo.`,
      // });
    } else if (
      res.transactionType == TRANSACTION_TYPE.WITHDRAWAL &&
      res.transactionStatus === TRANSACTION_STATUS.FAILED
    ) {
      // const otpSmsResponse = await this.notificationService.sendSms({
      //   to: transaction.senderPhone,
      //   sms: `Dear Customer,Your withdrawal for GHS${transaction.amount} failed.Thank you for choosing Bezo.`,
      // });
      // implementing the pending withdrawal.
      const userDeviceIds = await this.getUserDeviceId(ctx.authUser.userId);
      await this.notificationService.sendAll({
        data: transaction,
        to: transaction.senderPhone,
        sms: `Dear BezoSaver, Your withdrawal request for GHS${transaction.amount} is currently being processed.`,
        subject: 'Bezo Withdrawal',
        message: `Dear BezoSaver, Your withdrawal request for GHS${transaction.amount} is currently being processed.`,
        deviceId: userDeviceIds,
        email: ctx.authUser.email,
        template: {
          name: 'Bezo withdrawal',
          data: {
            logourl: '',
            title: 'Bezo Withdrawal',
            emailMessage: `Dear BezoSaver, Your withdrawal request for GHS${transaction.amount} is currently being processed.`,
          },
        },
        userId: ctx.authUser.userId,
        activityType: transaction.transactionType,
      });
    }
  }

  async updateTransactionPaystack(data, transaction: TransactionEntity) {
    console.log('Updating transaction data>>', data);
    const ctx = getAppContextALS<AppRequestContext>();

    // console.log('Updating AB TB>>', transaction);

    const account = await this.em.findOne(AccountEntity, {
      where: {
        id: transaction.accountId,
      },
    });

    console.log(
      'transaction check, data Check',
      transaction,
      'data check',
      data,
    );
    if (transaction && data.data.status === 'success') {
      transaction.transactionStatus = TRANSACTION_STATUS.SUCCESS;
      transaction.transactionData = data;
      await this.transactionRepository.save(transaction);
      if (transaction.transactionType === TRANSACTION_TYPE.DEPOSIT) {
        const deposit = new AccountDepositWithrawalDto();
        deposit.amount = transaction.amount;
        deposit.accountId = transaction.accountId;
        deposit.phone = transaction.senderPhone;
        deposit.reference = transaction.transactionId;
        deposit.narration = 'Deposit to primary account';
        console.log('Got Herr >>>', deposit);
        await this.transferService.userAccountDeposit(deposit, transaction);
        const streakInfo = await this.em.findOne(StreakEntity, {
          where: {
            accountId: account.id,
          },
        });

        const authUser = await this.em.findOne(AuthUserEntity, {
          where: {
            phone: deposit.phone,
          },
        });

        console.log('authUser', authUser);
        streakInfo.isstreak = true;
        console.log('streakInfo', streakInfo);
        await this.em.save(streakInfo);
        const userDeviceIds = await this.getUserDeviceId(authUser.userId);
        await this.notificationService.sendAll({
          data: transaction,
          to: transaction.senderPhone,
          sms: `Dear BezoSaver, Your deposit amount of GHS${deposit.amount} was successful. Transaction ID: ${transaction.userRef}. Fee charged: GHS0.00. Your current balance is ${account.balance}.`,
          subject: 'Deposit into BezoWallet',
          message: `,Dear BezoSaver, Your deposit amount of GHS${deposit.amount} was successful. Transaction ID: ${transaction.userRef}. Fee charged: GHS0.00. Your current balance is ${account.balance}.`,
          deviceId: userDeviceIds,
          email: authUser.email,
          template: {
            name: 'deposit',
            data: {
              logourl: '',
              title: 'Bezo Deposit',
              emailMessage: `Dear Customer, Your deposit amount of GHS${deposit.amount} was successful. Transaction ID: ${transaction.userRef}. Fee charged: GHS0.00. Your current balance is ${account.balance}.`,
            },
          },
          userId: authUser.userId,
          activityType: transaction.transactionType,
        });

        // SendSms
        await this.notificationService.sendSms({
          to: transaction.senderPhone,
          sms: `Dear Customer, Your deposit amount of GHS${deposit.amount} was successful. Transaction ID: ${transaction.userRef}. Fee charged: GHS0.00. Your current balance is ${account.balance}.`,
        });
      } else if (transaction.transactionType === TRANSACTION_TYPE.WITHDRAWAL) {
        const account = await this.em.findOne(AccountEntity, {
          where: {
            id: transaction.accountId,
          },
        });

        await this.notificationService.sendSms({
          to: data.phoneNumber,
          sms: `Dear Customer, Your withdrawal amount of GHS${transaction.amount} was successful. Transaction ID: ${transaction.userRef}. Your current balance is ${account.balance}`,
        });
      }
    } else {
      transaction.transactionStatus = TRANSACTION_STATUS.FAILED;
      this.reverseTransaction(transaction);
    }
    const res = await this.transactionRepository.save(transaction);
    if (
      res.transactionType == TRANSACTION_TYPE.WITHDRAWAL &&
      res.transactionStatus === TRANSACTION_STATUS.SUCCESS
    ) {
      const otpSmsResponse = await this.notificationService.sendSms({
        to: transaction.senderPhone,
        sms: `Dear Customer, Your withdrawal for GHS${res.amount} was successful. Transaction ID: ${transaction.userRef}. Fee charged: GHS0.00. Your current balance is ${account.balance}.`,
      });
    } else if (
      res.transactionType == TRANSACTION_TYPE.WITHDRAWAL &&
      res.transactionStatus === TRANSACTION_STATUS.FAILED
    ) {
      // const otpSmsResponse = await this.notificationService.sendSms({
      //   to: transaction.senderPhone,
      //   sms: `Dear Customer,Your withdrawal for GHS${transaction.amount} failed.Thank you for choosing Bezo.`,
      // });
      const userDeviceIds = await this.getUserDeviceId(ctx.authUser.userId);
      await this.notificationService.sendAll({
        data: transaction,
        to: transaction.senderPhone,
        sms: `Dear BezoSaver, Your withdrawal request for GHS${transaction.amount} is currently being processed.`,
        subject: 'Bezo Withdrawal',
        message: `Dear BezoSaver, Your withdrawal request for GHS${transaction.amount} is currently being processed.`,
        deviceId: userDeviceIds,
        email: ctx.authUser.email,
        template: {
          name: 'Bezo withdrawal',
          data: {
            logourl: '',
            title: 'Bezo Withdrawal',
            emailMessage: `Dear BezoSaver, Your withdrawal request for GHS${transaction.amount} is currently being processed.`,
          },
        },
        userId: ctx.authUser.userId,
        activityType: transaction.transactionType,
      });
    }
  }

  async reverseTransaction(transaction: TransactionEntity) {
    console.log('reversal initiated');
    if (transaction.transactionType === TRANSACTION_TYPE.WITHDRAWAL) {
      const reversal = new AccountDepositWithrawalDto();
      reversal.amount = transaction.amount;
      reversal.accountId = transaction.accountId;
      reversal.reference = transaction.transactionId;
      reversal.narration = `Reversal: Withrawal from primary account REF:${transaction.userRef}`;
      this.transferService.userAccountDeposit(reversal);
      let chargeTransactionId = `CHRG:` + transaction.transactionId;
      console.log('got here >>');
      const transactionData = await this.em.findOne(TransactionEntity, {
        where: { transactionId: chargeTransactionId },
      });
      const reverseCharge = new AccountDepositWithrawalDto();
      reverseCharge.amount = transactionData.amount;
      reverseCharge.accountId = transaction.accountId;
      reverseCharge.reference = transactionData.transactionId;
      reverseCharge.narration = `Reversal:CHARGE:Withdrawal to Mobile Money REF:${transactionData.userRef}`;
      console.log('transactionData', transactionData);
      let chargeTransaction = new TransactionEntity();
      chargeTransaction.amount = transactionData.amount;
      chargeTransaction.narration =
        'Reversal:CHARGE:Withdrawal to Mobile Money';
      chargeTransaction.transactionId = `CHRG:${transactionData.transactionId}`;
      chargeTransaction.accountId = transactionData.accountId;
      chargeTransaction.toAccountId = transactionData.fromAccountId;
      chargeTransaction.fromAccountId = transactionData.fromAccountId;
      chargeTransaction.transactionType = TRANSACTION_TYPE.WITHDRAWAL;
      chargeTransaction.amount = transactionData.amount;
      await this.transferService.userAccountDeposit(
        reverseCharge,
        chargeTransaction,
      );
      const amountToReverse =
        Number(transactionData.amount) + Number(transaction.amount);
      await this.notificationService.sendSms({
        to: transaction.senderPhone,
        sms: `Dear BezoSaver, Your transaction of GHS${amountToReverse} has been reversed REF:${transaction.userRef}.`,
      });
    }
    return transaction;
  }

  async reverseVasTransaction(vastransaction: VasTransactionEntity) {
    console.log('reversal initiated');
    const ctx = getAppContextALS<AppRequestContext>();
    if (vastransaction) {
      const transfer = new TransferCoreDto();
      transfer.amount = vastransaction.amount;
      transfer.fromAccountId = (
        await this.accountService.getAccountbyType(SYSTEM_ACCOUNT.VAS_PAYMENT)
      ).id;
      transfer.reference = vastransaction.transactionId;
      transfer.toAccountId = vastransaction.userId;
      transfer.fromAccountNarration = `Reversal:${vastransaction.transactionType} Purchase`;
      transfer.toAccountNarration = `Reversal:Purchase by ${ctx.authUser.phone}`;

      await this.transferService.userAccountReversalVas(transfer);
      await this.notificationService.sendSms({
        to: ctx.authUser.phone,
        sms: `Dear BezoSaver, \nYour transaction of GHS${vastransaction.amount} has been reversed REF:${vastransaction.transactionId}.`,
      });
    }
    return vastransaction;
  }
  async getUserDefaultAccount(userId: string) {
    const account = await this.accountRepository.findOne({
      where: { userId, name: 'Primary' },
    });
    return account;
  }

  async getAccountById(accountId: string) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
    });
    return account;
  }

  async getMomoWithdrawalCharges() {
    const charge = await this.em.findOne(FeesEntity, {
      where: {
        feeType: FEE_TYPE.MOMO_WITHDRAWAL,
      },
    });
    if (charge) {
      return charge;
    }
    let fees = new FeesEntity();
    fees.feeFormat = FEE_FORMAT.PERCENTAGE;
    fees.value = 2;
    fees.feeType = FEE_TYPE.MOMO_WITHDRAWAL;
    fees.threshHoldFormat = FEE_FORMAT.FIXED_VALUE;
    fees.thresholdStartPoint = 1000; ///TODO
    fees.threshHoldValue = 10;
    return fees;
  }

  async calculateWithdrawalCharge(amount: number): Promise<number> {
    //return a charge value
    let charge = await this.getMomoWithdrawalCharges();

    /* if (amount >= charge.thresholdStartPoint) {
      if (charge.threshHoldFormat == FEE_FORMAT.FIXED_VALUE) {
        return charge.threshHoldValue;
      } else {
        //calcluat using percentage
        const percentageOfAmount = (charge.value / charge.threshHoldValue) * amount;
        return percentageOfAmount;
      }
      //use threshold values to calculate fees
    } else {
      if (charge.threshHoldFormat == FEE_FORMAT.PERCENTAGE) {
        const percentageOfAmount = (charge.value / charge.threshHoldValue) * amount;
        return percentageOfAmount;
      } else {
        //TODO: calculate using fixed value
        return charge.threshHoldValue;
      }


      // use normal values to calculate fees
    } */

    if (amount >= charge.thresholdStartPoint) {
      return charge.threshHoldValue;
    } else if (amount < charge.thresholdStartPoint) {
      const percentageOfAmount = (charge.value / 100) * amount;
      return percentageOfAmount;
    }
    //input.amount = input.amount + percentageOfAmount;
    //withdrawl.amount = input.amount + percentageOfAmount;
    //totalDebitAmount;
    //console.log(`Withdrawal amount plus ${charge.value}% equals ${input.amount}`);
  }

  async getTransactionUserRole(userId: string) {
    const role = await this.em.findOne(AuthUserEntity, {
      where: {
        userId: userId,
      },
      select: ['roles'],
    });
    return role;
  }
}

// import { Injectable } from '@nestjs/common';
// import { InjectEntityManager } from '@nestjs/typeorm';
// import { EntityManager } from 'typeorm';
// import { NotificationEntity } from './notification.entity';

// @Injectable()
// export class NotificationService {
//   constructor(@InjectEntityManager() private readonly entityManager: EntityManager) {}

//   async getNotifications(userId: string): Promise<NotificationEntity[]> {
//     return this.entityManager.find(NotificationEntity, {
//       where: { userId: userId },
//       take: 20,
//       order: { createdAt: 'DESC' }
//     });
//   }
// }
