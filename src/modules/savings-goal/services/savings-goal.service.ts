import { SavingsGoalEntity } from './../entities/savings-goal.entity';
import { EntityManager, Not, Repository } from 'typeorm';
import {
  SavingsGoalDto,
  SavingsGoalInputDto,
  SavingsGoalInputEditDto,
} from '../dtos/savings-goal.dto';
import { AccountEntity } from '../../account/entities/account.entity';
import { STATUS } from '../../../../src/modules/auth/entities/enums/status.enum';
import { AppRequestContext } from '../../../../src/utils/app-request.context';
import { getAppContextALS } from '../../../../src/utils/context';
import { GOAL_STATUS } from '../../../../src/modules/auth/entities/enums/goal-status.enum';
import { Inject, HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { generateCode } from '../../../utils/shared';
import { WalletTypeEntity } from '../../wallet/entities/wallet.entity';
import { DEPOSIT_PREFERENCE } from '../../main/entities/enums/deposittype.enum';

import { format, format as formatDate, isBefore, isEqual } from 'date-fns';
import { response } from 'express';
import { TransferCoreDto } from '../../transfers/dto/TransferCoreDto';
import { uuid } from 'uuidv4';
import { UserEntity } from '../../main/entities/user.entity';
import { AccountService } from '../../account/services/account.service';
import { TransferCoreService } from '../../transfers/services/transfer.core.service';
import { TRANSFER_STATUS_CODE } from '../../transfers/enums/transferstatus.enum';
import { NotificationService } from '../../notifications/services/notification.service';
import { AccountTypeService } from '../../account/services/account-type.service';
import { MandateService } from '../../transactions/services/mandate.service';
import { CreateMandateDto } from '../../transactions/dtos/createmandate.dto';
import { FrequencyTypes } from '../../enums/frequency-types.enum';
import { FREQUENCY_TYPE } from '../../main/entities/enums/savingsfrequency.enum';
import { MandateEntity } from '../../transactions/entities/mandate.entity';
import { AccountTypeEntity } from '../../account/entities/account-type.entity';
import { FeeService } from '../../transfers/services/fees.service';
import { FEE_TYPE } from '../../enums/fee-type.enum';
import { SYSTEM_ACCOUNT } from '../../transfers/services/systemaccts.constants';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { TransferCoreResponseDto } from '../../transfers/dto/TransferCoreResponseDto';
import { AccountDepositWithrawalDto } from '../../transfers/dto/AccountDepositDto';
import { TransferService } from '../../transfers/services/transfer.service';


@Injectable()
export class SavingsGoalService {
  private logger = new Logger('SavingsGoalService');


  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    private accountService: AccountService,
    private accountTypeService: AccountTypeService,
    private transferCoreService: TransferCoreService,
    private transferService: TransferService,
    private notificationService: NotificationService,
    private mandateService: MandateService,
    private feeService: FeeService,
  ) { }

  async create(input: SavingsGoalInputDto): Promise<any> {
    console.log('Create savings goal payload>>', input);

    const ctx = getAppContextALS<AppRequestContext>();
    if (await this.savingsGoalExist(input.name, ctx.authUser.userId)) {
      // return {
      //   status: 'FAILED',
      //   message: 'Oops! You already have a Savings Goal with this name. Kindly rename your new goal.'
      // }

      throw new HttpException('Oops! You already have a Savings Goal with this name. Kindly rename your new goal.', 400);
    }
    const accountType = await this.accountTypeService.getAccountTypeById(
      input.accountTypeId,
    );
    const account = new AccountEntity();
    account.name = input.name;
    account.accountTypeId = input.accountTypeId;
    console.log('The user Id is >>>', ctx.authUser.userId);
    account.userId = ctx.authUser.userId;
    account.accountNumber = '' + Number(generateCode(10));
    account.walletId = input.walletId ?? (await this.getDefaultWalletId());
    account.allowDeposit = accountType.allowDeposit;
    account.allowWithdrawal = accountType.allowWithdrawal;
    account.allowWithdrawalWithFees = accountType.allowWithdrawalWithFees;
    account.dailyLimit = accountType.dailyLimit;
    account.canOverDraw = false;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const checkStartDate =
      typeof input.startDate === 'string'
        ? new Date(input.startDate)
        : input.startDate;
    const checkEndDate =
      typeof input.endDate === 'string'
        ? new Date(input.endDate)
        : input.endDate;

    if (isBefore(currentDate, checkStartDate) === true) {
      throw new HttpException('You cannot use a past date', 400);
    }

    if (isBefore(checkEndDate, checkStartDate) === true) {
      throw new HttpException('Start date must be before end date', 400);
    }

    
    const savingsGoal = new SavingsGoalEntity();
    savingsGoal.name = input.name;
    savingsGoal.description = input.description;
    savingsGoal.goalTypeId = input.goalTypeId;
    savingsGoal.account = account;
    savingsGoal.amountToRaise = input.amount;
    savingsGoal.amountToSave = input.amountToSave;
    savingsGoal.preference = input.preference;
    savingsGoal.period = input.period;
  
    savingsGoal.goalStatus = GOAL_STATUS.INPROGRESS;
    savingsGoal.userId = ctx.authUser.userId;
    savingsGoal.frequency = input.frequency;
    savingsGoal.emoji=input.emoji

    if(accountType.alias=='bezo-lock'){

      const res=this.isDateDifferenceThreeMonths(checkStartDate,checkEndDate)

      if(!res)   throw new HttpException('Bezo Lock Goal requires that your end date be 3 months or more from the present', 400);
      
      savingsGoal.startDate = checkStartDate;
      savingsGoal.endDate = checkEndDate;
    }else{
      savingsGoal.startDate = checkStartDate;
      savingsGoal.endDate = checkEndDate;
    }
    // savingsGoal.preference = DEPOSIT_PREFERENCE.manual;//TODO re
    let savedGoal = await this.em.save(savingsGoal);
    if (savedGoal.preference == DEPOSIT_PREFERENCE.automatic) {
      const createMandate = new CreateMandateDto();
      createMandate.accountId = savingsGoal.accountId;
      createMandate.amount = input.amountToSave;
      createMandate.frequency = input.frequency;
      createMandate.phoneNumber = ctx.authUser.phone;
      createMandate.startDate = format(new Date(savedGoal.startDate), 'yyyy-MM-dd');
      createMandate.endDate = format(new Date(input.endDate), 'yyyy-MM-dd');
      createMandate.category= input.category

      let mandateResult = await this.mandateService.create(createMandate);
      console.log('Create mandate result >>', mandateResult);
      this.logger.log(JSON.stringify(mandateResult), "create mandate result");
    }
    let retResponse: any = { status: 'SUCCESS', message: 'Savings Goal created successfully' };
    console.log('Deposit preference >>',)
    return retResponse
  }



   isDateDifferenceThreeMonths(startDate, endDate) {
    // Parse the date strings into Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
  
    // Calculate the difference in months
    const differenceInMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  
    // Compare the difference with three months
    if (differenceInMonths >= 3) {
      return true;
    } else {
      return false;
    }
  }
  async createSavingGoalReferral(input: SavingsGoalInputDto,phone:string,userId): Promise<any> {
    console.log('Create savings goal payload>>', input);

    const ctx = getAppContextALS<AppRequestContext>();
    if (await this.savingsGoalExist(input.name, userId)) {
      return {
        status: 'FAILED',
        message: 'Savings Goal already exist'
      }
    }
    const accountType = await this.accountTypeService.getAccountTypeById(
      input.accountTypeId,
    );
    const account = new AccountEntity();
    account.name = input.name;
    account.accountTypeId = input.accountTypeId;
    console.log('The user Id is >>>', userId);
    account.userId =userId;
    account.accountNumber = '' + Number(generateCode(10));
    account.walletId = input.walletId ?? (await this.getDefaultWalletId());
    account.allowDeposit =true;
    account.allowWithdrawal = false
    account.allowWithdrawalWithFees = false
    account.dailyLimit = accountType.dailyLimit;
    account.canOverDraw = false;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const checkStartDate =
      typeof input.startDate === 'string'
        ? new Date(input.startDate)
        : input.startDate;
    const checkEndDate =
      typeof input.endDate === 'string'
        ? new Date(input.endDate)
        : input.endDate;

    if (isBefore(currentDate, checkStartDate) === true) {
      throw new HttpException('You cannot use a past date', 400);
    }

    if (isBefore(checkEndDate, checkStartDate) === true) {
      throw new HttpException('Start date must be before end date', 400);
    }
    const savingsGoal = new SavingsGoalEntity();
    savingsGoal.name = input.name;
    savingsGoal.description = input.description;
    savingsGoal.goalTypeId = input.goalTypeId;
    savingsGoal.account = account;
    savingsGoal.amountToRaise = input.amount;
    savingsGoal.amountToSave = input.amountToSave;
    savingsGoal.preference = input.preference;
    savingsGoal.period = input.period;
    savingsGoal.startDate = checkStartDate;
    savingsGoal.endDate = checkEndDate;
    savingsGoal.goalStatus = GOAL_STATUS.INPROGRESS;
    savingsGoal.userId = userId;
    savingsGoal.frequency = input.frequency;
    savingsGoal.emoji=input.emoji
    // savingsGoal.preference = DEPOSIT_PREFERENCE.manual;//TODO re
    let savedGoal = await this.em.save(savingsGoal);
    // if (savedGoal.preference == DEPOSIT_PREFERENCE.automatic) {
    //   const createMandate = new CreateMandateDto();
    //   createMandate.accountId = savingsGoal.accountId;
    //   createMandate.amount = input.amountToSave;
    //   createMandate.frequency = input.frequency;
    //   createMandate.phoneNumber = ctx.authUser.phone;
    //   createMandate.startDate = format(new Date(savedGoal.startDate), 'yyyy-MM-dd');
    //   createMandate.endDate = format(new Date(savingsGoal.endDate), 'yyyy-MM-dd');
    //   let mandateResult = await this.mandateService.create(createMandate);
    //   console.log('Create mandate result >>', mandateResult);
    //   this.logger.log(JSON.stringify(mandateResult), "create mandate result");
    // }
    let retResponse: any = { status: 'SUCCESS', message: 'Savings Goal created successfully' };
    console.log('Deposit preference >>',)

    
          //TRANSFER 10 CEDIS TO SAVING GOAL CALLED Referral Bonus
    const depositRef = new AccountDepositWithrawalDto();
    const cashbackCal= 10
    depositRef.amount =cashbackCal
    depositRef.accountId =savingsGoal.accountId;;
    depositRef.phone = phone;
    depositRef.reference = uuid();
    depositRef.narration = 'Referral Bonus';
    console.log('Got Herr >>>', depositRef);
    await this.transferService.userAccountDeposit(depositRef);

    await this.notificationService.sendSms({
      to:phone,
      sms:`Congratulations BezoSaver! You have successfully received GHS${cashbackCal} in your account through our cashback program. Keep saving and earning!`
    })

    return retResponse
  }
  async all(): Promise<SavingsGoalDto[]> {
    const ctx = getAppContextALS<AppRequestContext>();
    const goals = await this.em.find(SavingsGoalEntity, {
      relations: ['account', 'account.accountType'],
      where: {
        userId: ctx.authUser.userId,
        name: Not('Primary'),
        goalStatus: Not('TERMINATED'),
        goalType: { name: Not('Primary') },
      },
    });
    let array: SavingsGoalDto[] = [];
    for (let k = 0; k < goals.length; k++) {
      let item = goals[k] as unknown as SavingsGoalDto
      item.accountTypeAlias = goals[k].account.accountType?.alias;
      item.accountTypeName = goals[k].account.accountType?.name;
      array.push(item)
    }
    return array;
  }
  async get(id: string): Promise<SavingsGoalDto> {
    const ctx = getAppContextALS<AppRequestContext>();
    let savingsGoal = (await this.em.findOne(SavingsGoalEntity, {
      where: { id: id, userId: ctx.authUser.userId },
      relations: ['account', 'goalType'],
    })) as unknown as SavingsGoalDto;
    let accounType = await this.em.findOne(AccountTypeEntity, {
      where: { id: savingsGoal.account.accountTypeId }
    });
    if (accounType) {
      savingsGoal.accountTypeAlias = accounType.alias;
      savingsGoal.accountTypeName = accounType.name;
    }
    return savingsGoal;
  }


  async getSavingGoalWithoutRelations(id: string): Promise<SavingsGoalDto> {
    const ctx = getAppContextALS<AppRequestContext>();
    let savingsGoal = (await this.em.findOne(SavingsGoalEntity, {
      where: { id: id, userId: ctx.authUser.userId },
    })) as unknown as SavingsGoalDto;

    return savingsGoal;
  }

  async getSavingsGoalById(savingsGoalId: string): Promise<SavingsGoalEntity> {
    return await this.em.findOne(SavingsGoalEntity, {
      where: { id: savingsGoalId },
      relations: ['account'],
    });
  }

  async getSavingsGoalByAccountId(accountId: string): Promise<SavingsGoalEntity> {
    return await this.em.findOne(SavingsGoalEntity, {
      where: { accountId: accountId }
    });
  }

  async getAccountIdByAccountNumber(accNum): Promise<AccountEntity> {
    return await this.em.findOne(AccountEntity, {
      where: { accountNumber: accNum },
    });
  }

  async update(id: string, input: SavingsGoalInputEditDto): Promise<any> {
    const savingsGoal = await this.em.findOne(SavingsGoalEntity, {
      where: { id: id },
      relations: ['account'],
    })
    // const savingsGoal: SavingsGoalEntity = await this.get(id);
    if (!savingsGoal) {
      throw new HttpException('AccountType not found', 404);
    }
    const ctx = getAppContextALS<AppRequestContext>();
    savingsGoal.name = input.name;
    //savingsGoal.preference = input.preference
    savingsGoal.amountToSave = input.amountToSave;

    // savingsGoal.preference = DEPOSIT_PREFERENCE.manual;
    if (
      savingsGoal.preference == DEPOSIT_PREFERENCE.manual &&
      input.preference == DEPOSIT_PREFERENCE.automatic
    ) {
      ///call the create mandate method in mandate service
      const createMandate = new CreateMandateDto();
      createMandate.accountId = savingsGoal.accountId;
      createMandate.amount = input.amount;
      // createMandate.debitDay = 'Monday';
      createMandate.frequency = FREQUENCY_TYPE.daily;
      createMandate.phoneNumber = ctx.authUser.phone;
      createMandate.startDate = format(
        new Date(),
        'yyyy-MM-dd',
      );
      createMandate.endDate = format(
        new Date(savingsGoal.endDate),
        'yyyy-MM-dd',
      );
      await this.mandateService.create(createMandate);
    } else if (
      savingsGoal.preference == "" + DEPOSIT_PREFERENCE.automatic &&
      input.preference == DEPOSIT_PREFERENCE.manual
    ) {
      //call cancel method of mandate service
      // const userAccount = await this.getAc(
      //   savingsGoal.account.accountNumber,
      // );
      const mandate = await this.em.findOne(MandateEntity, {
        where: { accountId: savingsGoal.accountId },
      });
      await this.mandateService.deactivate(mandate.reference);
    }
    savingsGoal.preference = input.preference;
    savingsGoal.emoji = input.emoji;
    // savingsGoal.amountToSave=
    return this.em.save(savingsGoal) as unknown as SavingsGoalDto;
  }


  async updateFavourite(
    id: string,
    input: { isFavorite: boolean },
  ): Promise<SavingsGoalDto> {
    const savingsGoal: SavingsGoalEntity | SavingsGoalDto = await this.get(id);
    // if(savingsGoal){
    //   return
    // }
    if (!savingsGoal) {
      throw new HttpException('AccountType not found', 404);
    }
    savingsGoal.isFavorite = input.isFavorite;
    // return { "status":200, "message":"data successfully updated" }  as unknown as SavingsGoalDto
    return this.em.save(savingsGoal) as unknown as SavingsGoalDto;
  }


  // delete savings goal
  async delete(id: string): Promise<void> {
    const savingsGoal: SavingsGoalEntity | SavingsGoalDto = await this.getSavingGoalWithoutRelations(id);
    if (!savingsGoal) {
      throw new HttpException('Savings Goal not found', 404);
    }
    if (savingsGoal.goalStatus == GOAL_STATUS.TERMINATED) {
      throw new HttpException('This savings goal cannot be altered', 404);
    }

    const ctx = getAppContextALS<AppRequestContext>();
    const primaryAccount = await this.accountService.getUserPrimaryAccount({
      userId: ctx.authUser.userId,
    });

    // GetAccount by savings goal
    const secondaryAccount = await this.getSavingsGoalById(id);
    const userSavingGoalAccount = await this.em.findOne(AccountEntity, {
      where: { id: secondaryAccount.accountId },
    });

    console.log('primaryAccount', primaryAccount);
    console.log('secondaryAccount', secondaryAccount);
    console.log('userSavingGoalAccount', userSavingGoalAccount);
    const reference = uuid();
    const transferRequest = new TransferCoreDto();
    transferRequest.fromAccountId = userSavingGoalAccount.id;
    transferRequest.toAccountId = primaryAccount.id;
    transferRequest.reference = reference;
    transferRequest.fromAccountNarration = 'SAVINGS GOAL CLOSURE ';
    transferRequest.toAccountNarration = 'SAVINGS GOAL CLOSURE ';
    transferRequest.amount = userSavingGoalAccount.balance
    //transferRequest.channel =input.channel;
    let transferResult: TransferCoreResponseDto;
    let savingGoalEntity:SavingsGoalEntity = savingsGoal as unknown as SavingsGoalEntity;
    if(savingGoalEntity.preference==DEPOSIT_PREFERENCE.automatic){
      const mandate = await this.em.findOne(MandateEntity, {
        where: { accountId: savingGoalEntity.accountId },
      });

   

      console.log("mandate",mandate)
      await this.mandateService.deactivate(mandate.reference);
    }

    
     
    if (userSavingGoalAccount.balance > 0) {
      if (userSavingGoalAccount.allowWithdrawalWithFees && userSavingGoalAccount.allowWithdrawal===true ) {

        const feeTransfer = await this.feeService.buildFeeTransfer(
          FEE_TYPE.EARLY_WITHDRAWAL,
          transferRequest,
        );
        
        console.log('The feeTransfer>>', feeTransfer)
        feeTransfer.reference = `CHRG:` + feeTransfer.reference
        transferResult = await this.transferCoreService.chargeTransfer(feeTransfer);
        const secondaryAcctAfterChargeDebit = await this.em.findOne(AccountEntity, {
          where: { id: secondaryAccount.accountId },
        });
        console.log('Secondary acct after charge debit')
        if (transferResult.statusCode == TRANSFER_STATUS_CODE.SUCCESS) {
          let feeAmount = feeTransfer.amount;
          const savingGoalAccountWithNewBalance = await this.em.findOne(AccountEntity, {
            where: { id: secondaryAccount.accountId },
          });
          let remainingAmount = savingGoalAccountWithNewBalance.balance
          console.log('Saving goal closure remaining balance>>', remainingAmount)
          transferRequest.amount = remainingAmount;
          transferResult = await this.transferCoreService.chargeTransfer(transferRequest);
          console.log('the remaining balance transfer result>>', transferResult);
        }
      } else if (userSavingGoalAccount.allowWithdrawal && userSavingGoalAccount.allowWithdrawalWithFees===false) {
        console.log("Not withdrawal fees >>>")
        transferRequest.amount = userSavingGoalAccount.balance
        transferResult = await this.transferCoreService.transfer(transferRequest);
      }else if(userSavingGoalAccount.allowWithdrawal===false ){
        transferRequest.amount = userSavingGoalAccount.balance
        transferResult = await this.transferCoreService.transfer(transferRequest);
      }
      if (transferResult.statusCode == TRANSFER_STATUS_CODE.SUCCESS) {
        savingsGoal.goalStatus = GOAL_STATUS.TERMINATED;
        await this.em.save(savingsGoal);
      } else {
        throw new HttpException(
          'Deletion of goal failed' +" " + transferResult.message,
          400,
        );
      }

    } else {
      savingsGoal.goalStatus = GOAL_STATUS.TERMINATED;
      await this.em.save(savingsGoal);
    }

  }

  async getDefaultWalletId(): Promise<string> {
    return this.em
      .findOne(WalletTypeEntity, { where: { name: 'Local' } })
      .then((wallet) => wallet.id);
  }

  async savingsGoalExist(name: string, userId: string) {
    return await this.em.findOne(SavingsGoalEntity, {
      where: { name: name, userId: userId },
    });
  }
}
