import { InjectRepository } from '@nestjs/typeorm';
import {
  Injectable,
  HttpException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Repository, EntityManager } from 'typeorm';
import { NETWORK, VasDto } from '../dtos/vas.dto';
import { getAppContextALS } from '../../../utils/context';
import { AppRequestContext } from '../../../utils/app-request.context';
import { uuid } from 'uuidv4';
import { HttpRequestService } from '../../shared/services/http.request.service';
import { AccountEntity } from '../../account/entities/account.entity';
import { MyLoggerService } from '../../../logger.service';

import { STATUS } from '../../auth/entities/enums/status.enum';
import { UserPinService } from '../../userpin/services/userpin.service';
import { PlATFORM } from '../../main/entities/enums/platform.enum';
import { PaymentMethodEntity } from '../../main/entities/paymentmethod.entity';
import { AccountService } from '../../account/services/account.service';
import { TransferService } from '../../transfers/services/transfer.service';
import { AccountDepositWithrawalDto } from '../../transfers/dto/AccountDepositDto';
import { BillerEntity } from '../entities/biller.entity';
import { VasTransactionEntity } from '../entities/vas.entity';

import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { TRANSACTION_STATUS } from '../../enums/transaction.status';
import { gen } from 'n-digit-token';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { TRANSFER_STATUS_CODE } from '../../transfers/enums/transferstatus.enum';
import TRANSFER_STATUS_MESSAGE from '../../transfers/enums/transferstatus.message';

import { TransactionService } from '../../transactions/services/transaction.service';
import { TransferCoreDto } from '../../transfers/dto/TransferCoreDto';
import { BillerFormFieldsEntity } from '../entities/billers_form_fields.entity';
import { VasProviderEntity } from '../entities/vasprovider.entity';
import { object } from 'joi';
import { BILLER_STATUS } from '../enums/billerStatus';
import { WITHDRAWL_DAILY_LIMIT_STATUS } from '../../enums/withdrawal-limit-type.enum';

@Injectable()
export class VasService extends HttpRequestService {
  logger = new MyLoggerService(VasService.name);
  constructor(
    @InjectRepository(TransactionEntity)
    private transactionRepository: Repository<TransactionEntity>,
    private transactionService: TransactionService,

    @InjectRepository(PaymentMethodEntity)
    private paymentRepository: Repository<PaymentMethodEntity>,

    @InjectRepository(AccountEntity)
    private accountRepository: Repository<AccountEntity>,
    private accountService: AccountService,
    private transferService: TransferService,

    private userPinService: UserPinService,
    private em: EntityManager,
  ) {
    super();
  }

  async getUserDefaultAccount(userId: string) {
    const account = await this.accountRepository.findOne({
      where: { userId, name: 'Primary' },
    });
    return account;
  }

  async getBillers() {
    const billers = await this.em.find(BillerEntity, {
      where: { status: BILLER_STATUS.ACTIVE },
    });
    const retArray = [];
    for (let k = 0; k < billers.length; k++) {
      let item = billers[k];

      let obj = {
        id: item.id,
        name: item.name,
        category: item.category,
        imageIcon: item.imageIcon,
      };
      retArray.push(obj);
    }

    return retArray;
  }

  async getFormFields(billerId: string) {
    const formFields = await this.em.find(BillerFormFieldsEntity, {
      where: { billerId: billerId },
    });
    const retArray = [];

    for (let k = 0; k < formFields.length; k++) {
      let field = {
        fieldName: formFields[k].fieldName,
        fieldLabel: formFields[k].fieldLabel,
        fieldType: formFields[k].fieldType,
        selectOptions: formFields[k].selectOptions,
      };
      retArray.push(field);
    }

    return retArray;
  }

  async buy(input: VasDto) {
    if (input.channel == PlATFORM.ussd) {
    } else {
      await this.userPinService.verifyId(input.verificationId);
    }
    const ctx = getAppContextALS<AppRequestContext>();
    if (ctx.authUser.accountStatus == STATUS.disabled) {
      throw new HttpException('Your account has been disabled', 400);
    }

    if (Object.values(input.data).length == 0) {
      throw new HttpException('data property must not be null', 400);
    }

    let billerInfo = await this.em.findOne(BillerEntity, {
      where: { id: input.billerId },
    });

    console.log('billerInfo', billerInfo);
    let provider = await this.em.findOne(VasProviderEntity, {
      where: { id: billerInfo.providerId },
    });

    console.log('provider', provider);
    let userPhone = ctx.authUser.phone;

    let vas = new VasTransactionEntity();
    vas.amount = input.amount;

    if (input.channel == null) {
      input.channel = PlATFORM.web;
    }
    vas.platform = input.channel;
    if (!input.verificationId) {
      throw new HttpException('Verification Id is required', 400);
    }

    let vasTransactionResponse = { message: '', status: '' };

    const reference = uuid();

    const userAccount = await this.getUserDefaultAccount(ctx.authUser.userId);

    const transfer = new TransferCoreDto();
    transfer.amount = input.amount;
    transfer.fromAccountId = userAccount.id;
    transfer.reference = reference;
    transfer.toAccountId = provider.accountId;
    transfer.fromAccountNarration = `${billerInfo.name} Purchase`;
    transfer.toAccountNarration = `Purchase by ${userPhone}`;

    const allowWithdrawal =
      await this.transferService.dailyWithdrawalLimitAndDailyLimit(
        ctx.authUser.userId,
        TRANSACTION_TYPE.WITHDRAWAL,
        input.amount,
        ctx.authUser.user.level,
      );
    console.log('withdrawlLimit', allowWithdrawal);
    if (allowWithdrawal.status == WITHDRAWL_DAILY_LIMIT_STATUS.SUCCESS) {
      
      if (await this.accountService.accountHasEnoughBalance(userAccount.id, input.amount)) {
        const debitResponse = await this.transferService.userAccountWithdrawalVas(
          transfer,
        );
        if (debitResponse.statusCode == TRANSFER_STATUS_CODE.SUCCESS) {
          let vastransaction = new VasTransactionEntity();
          vastransaction.userId = ctx.authUser.userId;
          vastransaction.transactionType = billerInfo.transactionType;
          vastransaction.amount = input.amount;
          vastransaction.payload = input;
          vastransaction.transactionId = reference;
  
          if (billerInfo.transactionType == 'artm') {
            vastransaction.status = TRANSACTION_STATUS.PENDING;
          } else {
            vastransaction.status = TRANSACTION_STATUS.CANCELLED;
          }
  
          ///check the other
          await this.em.save(vastransaction);
  
          try {
            const vasData = await this.callVasGateWay(
              billerInfo.category,
              input.amount,
              debitResponse.trxnRef,
              debitResponse.message,
              input.data,
            );
            return vasData;
          } catch (error) {
            throw new HttpException(
              'Error whilst requesting from VasGateway',
              500,
            );
          }
        } else {
          this.logger.log(
            debitResponse,
            'User has insufficient balance for withdrawal ',
          );
          vasTransactionResponse = {
            message:
              TRANSFER_STATUS_MESSAGE[TRANSFER_STATUS_CODE.INSUFFICIENT_BALANCE],
            status: TRANSFER_STATUS_CODE.INSUFFICIENT_BALANCE,
          };
  
          throw new HttpException(
            'User has insufficient balance to make this transaction',
            400,
          );
        }
      }else{
        throw new HttpException('User cannot withdrawal below minimum balance', 400);

      }
      
     
    } else {
      throw new HttpException(allowWithdrawal.message, 400);
    }
  }

  async getMovies(){
    const query=`SELECT * FROM movies_entity`
    return await this.em.query(query)
  }

  async getUserPaymentPhone(network?: NETWORK) {
    const ctx = getAppContextALS<AppRequestContext>();
    const paymentMethod = await this.paymentRepository.findOne({
      where: { userId: ctx.authUser.userId, default: true },
      //where: { userId: ctx.authUser.userId, ...(network && { network }) },
    });
    if (!paymentMethod)
      throw new HttpException('Payment method not found', 404);
    return paymentMethod;
  }

  async getProviderById(id: string): Promise<VasProviderEntity> {
    return this.em.findOne(VasProviderEntity, {
      where: {
        id,
      },
    });
  }

  async callVasGateWay(
    serviceCode: string,
    amount: number,
    transactionId: string,
    description: string,
    details: object,
  ) {
    const url = `${this.cfg.vas.url}/makeVasPayment`;

    console.log('url', url);
    console.log('environment', process.env.NODE_ENV);

    let vasPayload = {
      appId: this.cfg.vas.appId,
      serviceCode: serviceCode.toUpperCase(),
      amount,
      transactionId,
      description,
      details,
    };

    console.log('data sending>>>>', vasPayload);
    this.logger.debug(`Request data: ${JSON.stringify(vasPayload, null, 2)}`);

    await this.post(url, vasPayload);
    this.logger.debug(`Error Response ${JSON.stringify(this.error, null, 2)}`);
    if (this.error) {
      throw new HttpException(this.error, 400);
    }
    this.logger.debug(`Response ${JSON.stringify(this.response, null, 2)}`);
    // this.response.reference = reference;
    return this.response;
  }

  async vastransactionCallback(request: any) {
    const vastransaction = await this.getVasTransactionByRef(
      request.transactionRef,
    );
    if (vastransaction) {
      if (vastransaction.status === TRANSACTION_STATUS.PENDING) {
        console.log('Updating transaction');
        await this.updateVasTransaction(request, vastransaction);
      } else {
        vastransaction.response = request;
        await this.em.save(vastransaction);
        // await this.notificationService.sendSms({
        //   to: ['233246583910', '233559876493'],
        //   sms: `BEZADMIN: Failed callback received from Payment GateWay. ${transaction.transactionId}.`,
        // });
      }
    }
  }

  async updateVasTransaction(data, vastransaction: VasTransactionEntity) {
    console.log('Updating transaction data>>', data);
    // console.log('Updating AB TB>>', transaction);
    if (vastransaction && data.status === 'SUCCESS') {
      vastransaction.status = TRANSACTION_STATUS.SUCCESS;
      vastransaction.response = data;
      await this.em.save(vastransaction);
    } else {
      vastransaction.status = TRANSACTION_STATUS.FAILED;
      this.transactionService.reverseVasTransaction(vastransaction); //todo clone it and
    }
  }

  private async getVasTransactionByRef(ref: string) {
    return await this.em.findOne(VasTransactionEntity, {
      where: { transactionId: ref },
    });
  }
}
