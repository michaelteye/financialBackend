import { Injectable } from '@nestjs/common';
import {
  CreateSavingsGoalDto,
  deleteSavingsGoalDto,
} from '../../ussdapi/dtos/create-savingsgoal.dto';
import { DepositDto } from '../../ussdapi/dtos/deposit.dto';
import { WithdrawalDto } from '../../ussdapi/dtos/withdraw.dto';
import { WalletDto } from '../../ussdapi/dtos/wallet.dto';
import { GenericResponse } from '../dtos/generic-response';
import { SavingsGoalService } from '../../savings-goal/services/savings-goal.service';
import { GoalTypeService } from '../../savings-goal/services/goal-type.service';
import { UserService } from '../../auth/services/user.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { UserPinService } from '../../userpin/services/userpin.service';
import {
  SavingsGoalInputDto,
  SavingsGoalInputEditDto,
} from '../../savings-goal/dtos/savings-goal.dto';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import {
  DepositInputDto,
  NETWORK,
} from '../../transactions/dtos/deposit.dto';
import { TransferDto } from '../dtos/transfer.dto';
import { TransferToAccountDto } from '../../account/dtos/transfer-account.dto';
import { AccountService } from '../../account/services/account.service';
import { TransferService } from '../../transfers/services/transfer.service';
import { AccountTypeService } from '../../account/services/account-type.service';
import { FREQUENCY_TYPE } from '../../main/entities/enums/savingsfrequency.enum';
import { checkRegistrationDto } from '../dtos/check-registration-status.dto';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { AuthUserEntity } from '../../auth/entities/auth-user.entity';
import { registerInputDto } from '../dtos/register.dto';
import { PhoneNumberService } from '../../shared/services/phoneNumber.service';
import { PlatformEntity } from '../../main/entities/platform.entity';
import { PlATFORM } from '../../main/entities/enums/platform.enum';
import { WalletTypeEntity } from '../../wallet/entities/wallet.entity';
import { AccountTypeEntity } from '../../account/entities/account-type.entity';
import { UserEntity } from '../../main/entities/user.entity';
import { AccountEntity } from '../../account/entities/account.entity';
import { generateCode, generateReferralCode } from '../../../utils/shared';
import { AuthUserRole } from '../../auth/types/auth-user.roles';
import { PasswordEncoderService } from '../../auth/services/password-encorder.service';
import { LEVEL } from '../../auth/entities/enums/level.enum';
import { STATUS } from '../../auth/entities/enums/status.enum';
import { PaymentMethodEntity } from '../../main/entities/paymentmethod.entity';
import { PAYMENT_TYPE } from '../../main/entities/enums/paymenttype.enum';
import { UserPinEntity } from '../../userpin/entities/userpin.entity';
import { NotificationService } from '../../notifications/services/notification.service';
import {
  APP_TYPE,
  FileEntity,
  ID_TYPE,
} from '../../fileupload/entities/file.entity';
import { DEPOSIT_PREFERENCE } from '../../main/entities/enums/deposittype.enum';
import { getAppContextALS } from '../../../utils/context';
import { AppRequestContext } from '../../../utils/app-request.context';
import { SavingsGoalEntity } from '../../savings-goal/entities/savings-goal.entity';
import { PinInputDto, UserPinDto } from '../dtos/pin.dto';
import { ReferralDto } from '../dtos/referral.dto';
import { ReferralEntity } from '../../referrals/entities/referral.entity';
import { GOAL_STATUS } from '../../auth/entities/enums/goal-status.enum';
import { VasService } from '../../vas/services/vas.service';
import { VasDto } from '../dtos/vas.dto';

@Injectable()
export class UssdApiService {
  constructor(
    private savingsGoalService: SavingsGoalService,
    private accountService: AccountService,
    private accountTypeService: AccountTypeService,
    private transferService: TransferService,
    private userPinService: UserPinService,
    private goalTypeService: GoalTypeService,
    private transactionService: TransactionService,
    private phoneNumberService: PhoneNumberService,
    private passwordHash: PasswordEncoderService,
    private notificationService: NotificationService,
    private vasservice: VasService,
    @InjectEntityManager('default') private em: EntityManager,
  ) {}

  async signUp(request: registerInputDto): Promise<GenericResponse> {
    console.log('Request to server', request);
    let referrer: UserEntity;
    const response = new GenericResponse();
    try {
      if (!request.mobileNumber) {
        request.mobileNumber = this.phoneNumberService.provider(
          request.mobileNumber,
        );
      }
      // if (request.referralCode) {
      //   referrer = await this.em.findOne(UserEntity, {
      //     where: { referralCode: request.referralCode },
      //   });
      //   if (!referrer) throw new BadRequestException('invalid_referral_code');
      // }
      if (!request.mobileNumber) {
        // throw new BadRequestException('phone_number_is_required');
      }

      // create user platform
      const platform = new PlatformEntity();
      platform.name = PlATFORM.android;

      // create default profile
      // const profile = new ProfileEntity(); //profile identity is empty

      // create default account
      const defaultAccountType = await this.getDefaultAccountType();
      const defaultWallet = await this.getDefaultWallet();
      const account = new AccountEntity();
      account.accountTypeId = defaultAccountType.id;
      account.name = defaultAccountType.name;
      account.accountNumber = generateCode(10);
      account.walletId = defaultWallet.id;
      account.canOverDraw = false;

      // create user
      const user = new UserEntity();
      user.firstName = request.firstName;
      user.lastName = request.lastName;
      if (!request.userName)
        user.userName = this.generateUsername(
          request.firstName,
          request.lastName,
        );
      user.level = LEVEL.beginner;
      user.platforms = [platform];

      // user.profile = profile;
      // user.userPaymentMethods = [paymentMethod];
      user.accounts = [account];
      user.referralCode = generateCode(6);
      user.user_id = null;
      if (user.bezoSource) user.bezoSource = request.bezoSource;

      // add file if exists

      // optional date of birth
      if (request.dob) {
        user.dateOfBirth =
          typeof request.dob === 'string' ? new Date(request.dob) : request.dob;
        user.gender = request.gender;
      } else {
        response.status = '01';
        response.message = 'Goal created successfully';
        return response;
      }

      // add optional address

      // const address: AddressEntity = {
      //   ...(request.streetAddress && { homeAddress: request.streetAddress }),
      //   ...(request.country && { country: request.country }),
      //   ...(request.region && { region: request.region }),
      //   ...(request.digitalAddress && { gpsAddress: request.digitalAddress }),
      // };
      // user.address = address;
      const authUser = new AuthUserEntity();
      const userPassword = this.generatePassword(8);

      authUser.phone = request.mobileNumber;
      authUser.roles = [AuthUserRole.User];
      authUser.password = this.passwordHash.encodePassword(userPassword);
      authUser.accountStatus = STATUS.active;
      authUser.signUpchannel = PlATFORM.ussd;

      authUser.user = user;
      const auth: AuthUserEntity = await this.em.save(authUser);

      if (request.pin) {
        const encryptedPin = await this.encryptPin(
          Number(request.pin),
          auth.userId,
        );
        console.log('encryptedPin', encryptedPin);

        const pin = new UserPinEntity();
        pin.pin = encryptedPin;
        pin.status = STATUS.active;
        pin.userId = auth.userId;

        if (await this.em.save(pin)) {
          const otpSmsResponse = await this.notificationService.sendSms({
            to: request.mobileNumber,
            sms: 'Your Bezo pin has been created successfully',
          });

          const passwordSmsResponse = await this.notificationService.sendSms({
            to: request.mobileNumber,
            sms: `Your Bezo password is ${userPassword}`,
          });
        }
      }
      if (request.mobileNumber) {
        // phone.userId = auth.id;
        // const savedPhone = await this.saveUserPhone(phone);
        const paymentMethod = new PaymentMethodEntity(); //create default payment method
        paymentMethod.network = this.getNetwork(
          request?.network?.toUpperCase(),
        ).toLowerCase() as unknown as NETWORK;
        if (request.mobileNumber) paymentMethod.phoneNumber = authUser.phone;

        paymentMethod.userId = auth.userId;
        paymentMethod.status = STATUS.enabled;
        paymentMethod.default = true;
        paymentMethod.paymentType = PAYMENT_TYPE.mobile_money;

        console.log('payment', paymentMethod);
        try {
          await this.em.save(paymentMethod);
        } catch (error) {
          console.log('Error saving Payment >>>', error);
        }
      }

      const file = new FileEntity();

      file.idNumber = request.idNumber;

      if (request.idCardType == 'Ghana Card') {
        file.idType = ID_TYPE.GHANA_CARD;
      } else if (request.idCardType == 'Passport') {
        file.idType = ID_TYPE.PASSPORT;
      } else if (request.idCardType == 'Passport') {
        file.idType = ID_TYPE.VOTERS_ID;
      }

      file.appType = APP_TYPE.PROFILE;

      user.files = [file];

      ///Adding referral
      const referral = new ReferralDto();
      referral.code = generateReferralCode(9);
      referral.userId = user.id;

      await this.em.save(ReferralEntity, referral);

      ////

      response.status = '00';
      response.message = 'Goal created successfully';
      return response;
    } catch (error) {
      response.status = '01';
      response.message = 'Something went wrong whiles saving';
      return response;
    }
  }

  async encryptPin(pin: number, userId: string): Promise<string> {
    const genPin = `${pin}${userId}`;
    const encryptedPin = this.passwordHash.encryptKey(genPin);
    return encryptedPin;
  }

  getNetwork(network): NETWORK {
    console.log('network', network);
    if (network == 'MTN') {
      return NETWORK.mtn;
    } else if (network == 'AIRTEL_TIGO') {
      return NETWORK.airteltigo;
    } else if (network == 'VODAFONE') {
      return NETWORK.vodafone;
    } else if (network == 'GLO') {
      return NETWORK.glo;
    } else {
      return NETWORK.mtn;
    }
  }

  generatePassword(length) {
    let password = '';
    let possibleCharacters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
      password += possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length),
      );
    }

    return password;
  }

  generateUsername = (word1, word2) => {
    const suffix = ['2022', '22', 'theGreat', '10'];
    const prefix = ['great', 'good', 'the', 'brilliant'];

    const suggestions = [];
    suggestions.push(`${word1}${word2}`);
    suffix.forEach((word) => {
      suggestions.push(`${word1}${word}${word2}`);
      suggestions.push(`${word1}${word}`);
      suggestions.push(`${word2}${word}`);
      suggestions.push(`${word1}${word2}${word}`);
    });
    prefix.forEach((word) => {
      suggestions.push(`${word1}${word}${word2}`);
      suggestions.push(`${word}${word1}`);
      suggestions.push(`${word}${word2}`);
      suggestions.push(`${word1}${word}${word2}`);
    });

    return suggestions[Math.floor(Math.random() * suggestions.length)];
  };

  async getDefaultAccountType(): Promise<AccountTypeEntity | any> {
    return await this.em.findOne(AccountTypeEntity, {
      where: { name: 'Primary' },
    });
  }

  async getDefaultWallet(): Promise<WalletTypeEntity> {
    return await this.em.findOne(WalletTypeEntity, {
      where: { name: 'Local' },
    });
  }

  async createSavingsGoal(dto: CreateSavingsGoalDto): Promise<GenericResponse> {
    //
    let input = new SavingsGoalInputDto();
    input.name = dto.nameOfGoal;
    input.accountTypeId = dto.accountTypeId;
    input.goalTypeId = dto.goalTypeId;
    input.amount = dto.goalAmount; //what about goal amount
    input.amountToSave = dto.amountToSave;
    input.preference = (<any>DEPOSIT_PREFERENCE)[dto.deductionMethod];
    input.period = dto.durationOfGoal;
    input.description = dto.description;
    input.frequency = (<any>FREQUENCY_TYPE)[dto.saveFrequency];
    input.startDate = dto.startDate;
    const response = new GenericResponse();

    console.log('input>>>', input);
    try {
      const checkPin = await this.userPinService.verifyUserPinUssd(dto.pin);
      if (checkPin.status == '01') {
        response.status = '01';
        response.message = 'Incorrect Pin';
        return response;
      }
      return await this.savingsGoalService.create(input);
    } catch (error) {
      response.status = '01';
      response.message = `${error}`;
      return response;
      // console.log("error",error)
    }
  }

  async deleteSavingsGoal(dto: deleteSavingsGoalDto): Promise<GenericResponse> {
    //

    const response = new GenericResponse();

    try {
      const checkPin = await this.userPinService.verifyUserPinUssd(dto.pin);
      if (checkPin.status == '01') {
        response.status = '01';
        response.message = 'Incorrect Pin';
        return response;
      }

      console.log('dto>>', dto);
      const getGoal = await this.savingsGoalService.getSavingsGoalByAccountId(
        dto.goalId,
      );
      console.log('getGoal', getGoal);
      const deletedGoal = await this.savingsGoalService.delete(getGoal.id);

      response.status = '00';
      response.message = 'Saving Goal deleted successfully';
      return response;
    } catch (error) {
      response.status = '01';
      response.message = `${error}`;
      return response;
      // console.log("error",error)
    }
  }

  async getAllGoalTypes(): Promise<any> {
    return await this.goalTypeService.allSavingsGoalTypes();
  }

  async getBillers(): Promise<any> {
    const res = await this.vasservice.getBillers();
    console.log('res billers', res);

    return res;
  }

  async buy(dto: VasDto): Promise<any> {
    let response = new GenericResponse();
    try {
      const checkPin = await this.userPinService.verifyUserPinUssd(dto.pin);
      if (checkPin.status == '01') {
        response.status = '01';
        response.message = 'Incorrect Pin';
        return response;
      }

      
    

      const buyWithVas= await this.vasservice.buy(dto)

      if(buyWithVas.status=='SUCCESS'){
        response.status = '00';
        response.message = 'Your request is being processed. Your will receive a message soon ';
      }else{
        response.status = '01';
        response.message = 'Transaction failed';
      }

      
      return response;
    } catch (error) {
      response.status = '01';
      response.message = `${error}`;
      return response;
      // console.log("error",error)
    }
  }

  async getGoalById(): Promise<any> {}

  // async allSavingsGoalAccounts():Promise<any>{

  //   const ctx = getAppContextALS<AppRequestContext>();
  //      return await this.savingsGoalService.get(id);

  // }

  async getAccountTypes(): Promise<any> {
    return await this.accountTypeService.all();
  }

  async getMySavingsGoal(): Promise<any> {
    return await this.goalTypeService.all();
  }

  async depositToWallet(dto: DepositDto): Promise<GenericResponse> {
    const pinVerification = await this.userPinService.verifyUserPinUssd(
      dto.pin,
    );

    const response = new GenericResponse();

    if (pinVerification.status == '01') {
      response.status = '01';
      response.message = 'Invalid Pin';
      return response;
    }

    const input = new DepositInputDto();
    input.amount = dto.amount;
    input.network = dto.network;
    input.accountId = dto.accountId;
    input.verificationId = pinVerification.verificationId;
    input.channel = PlATFORM.ussd;
    console.log('The deposit request input>>>', input);

    const result = await this.transactionService.deposit(input);
    // uncoment ussd here.

    if (result.status === 'SUCCESS') {
      response.status = '00';
      response.message = 'Deposit successful';
    } else if (result.status === 'PENDING') {
      response.message =
        'Initiated. A payment prompt has been sent to your phone for approval. You can also check your approvals.';
      response.status = '01';
    } else {
      response.message =
        'Deposit request could not be initiated. Please try again in a few minutes.';
      response.status = '01';
    }
    return response;
  }

  async withdrawFromWallet(dto: WithdrawalDto): Promise<GenericResponse> {
    const pinVerification = await this.userPinService.verifyUserPinUssd(
      dto.pin,
    );

    const response = new GenericResponse();

    if (pinVerification.status == '01') {
      response.status = '01';
      response.message = 'Incorrect Pin';
      return response;
    }
    const input = new DepositInputDto();
    input.amount = dto.amount;
    input.network = dto.network;
    input.verificationId = pinVerification.verificationId;
    input.accountId = dto.accountId;
    input.channel = PlATFORM.ussd;

    const result = await this.transactionService.withdrawal(input);

    if (result.status === 'SUCCESS') {
      response.status = '00';
      response.message = 'Withdrawal successful';
    } else if (result.status === 'PENDING') {
      response.message = 'Withdrawal Initiated.';
      response.status = '01';
    }
    return response;
  }

  // async transferFromWallet(dto):Promise<GenericResponse>{

  //   const pinVerification = await this.userPinService.verifyUserPinUssd(
  //     Number(dto.pin),
  //   );

  //   const response = new GenericResponse();

  //   if (pinVerification.status == '01') {
  //     response.status = '01';
  //     response.message = 'Invalid Pin';
  //     return response;
  //   }
  //   const input = new TransferToAccountDto();
  //   input.amount = dto.amount;

  //   input.verificationId = pinVerification.verificationId;
  //   input.transferAccountId=dto.accountId

  //   const result = await this.transactionService.depositWithdrawal(
  //     input,
  //     TRANSACTION_TYPE.DEBIT,
  //   );
  // }

  async allSavingsGoalByuser(): Promise<any> {
    const ctx = getAppContextALS<AppRequestContext>();
    //console.log("ctx",ctx)
    const accounts = await this.em.find(AccountEntity, {
      where: {
        userId: ctx.authUser.userId,
      },
    });

    const savingsGoals = await this.em.find(SavingsGoalEntity, {
      where: {
        userId: ctx.authUser.userId,
      },
    });

    const dataToSend = [];

    accounts.map((r) => {
      if (r.name == 'Primary') {
        const changeObj = { ...r, name: 'BezoWallet' };
        dataToSend.unshift(changeObj);
      }
      savingsGoals.map((r2) => {
        if (r.id == r2.accountId && r2.goalStatus != GOAL_STATUS.TERMINATED) {
          dataToSend.push(r);
        }
      });
    });

    return dataToSend;
  }

  async getReceiverDetails(mobile): Promise<any> {
    const ctx = getAppContextALS<AppRequestContext>();

    console.log('mobile to check', mobile);
    //console.log("ctx",ctx)
    const authData = await this.em.findOne(AuthUserEntity, {
      where: {
        phone: mobile,
      },
    });

    return this.em.find(AccountEntity, {
      where: {
        userId: authData.userId,
        name: 'Primary',
      },
      relations: ['user'],
    });
  }

  async editSavingsGoalByuser(
    id: string,
    input: SavingsGoalInputEditDto,
  ): Promise<any> {
    const ctx = getAppContextALS<AppRequestContext>();
    //console.log("ctx",ctx)
    const response = new GenericResponse();
    try {
      const dataAfterSave = await this.savingsGoalService.update(id, input);

      if (dataAfterSave) {
        response.status = '00';
        response.message = 'Saving goal updated';
      }
    } catch (error) {
      response.status = '01';
      response.message = 'Oops. We could not update your saving goal';
    }
  }

  async transfer(dto: TransferDto): Promise<GenericResponse> {
    const pinVerification = await this.userPinService.verifyUserPinUssd(
      dto.pin,
    );

    const response = new GenericResponse();

    if (pinVerification.status == '01') {
      response.status = '01';
      response.message = 'Incorrect Pin';
      return response;
    }
    const input = new TransferToAccountDto();
    input.amount = dto.amount;
    input.transferAccountId = dto.transferAccountId;
    input.verificationId = pinVerification.verificationId;
    input.narration = dto.narration;
    input.channel = PlATFORM.ussd;

    const result = await this.transferService.transferToUserAccount(input);

    console.log('result>> transfer', result);

    if (result.statusCode == '00') {
      response.status = result.statusCode;
      response.message = result.message;
      return response;
    } else {
      response.status = result.statusCode;
      response.message = result.message;
      return response;
    }

    // if (result.status === 'SUCCESS') {
    //   response.status = '00';
    //   response.message = 'Deposit successful';
    // } else if (result.status === 'PENDING') {
    //   response.message =
    //     'Initiated. A payment prompt has been sent to your phone for approval. You can also check your approvals.';
    //   response.status = '01';
    // }
  }

  async updateUserPinUSSD(input: any): Promise<GenericResponse> {
    const response = new GenericResponse();
    try {
      const checkPin = await this.userPinService.verifyUserPinUssd(
        input.oldpin,
      );

      if (checkPin.status == '01') {
        response.status = '01';
        response.message = 'Incorrect Pin';
        return response;
      }

      const dataToSave = new UserPinDto();
      dataToSave.userPin = input.pin;

      const updatedPin = await this.userPinService.updateUserPinUssd(
        dataToSave,
      );
      if (updatedPin) {
        response.status = '00';
        response.message = 'Pin Updated';
        return response;
      }

      response.status = '01';
      response.message = 'Wrong Pin';

      return response;
    } catch (error) {
      response.status = '01';
      response.message = `${error}`;
      return response;
      // console.log("error",error)
    }
  }

  async verifyUserPin(input: any): Promise<GenericResponse> {
    const response = new GenericResponse();

    console.log('Input @ verifyUserPin>>>', input);
    try {
      const checkPin = await this.userPinService.verifyUserPinUssd(input.pin);

      console.log('checkPin', checkPin);

      if (checkPin.status == '01') {
        response.status = '01';
        response.message = 'Incorrect Pin';
        return response;
      } else {
        response.status = '00';
        response.message = 'Valid Pin';
        return response;
      }
    } catch (error) {
      response.status = '01';
      response.message = `${error}`;
      return response;
    }
  }

  async walletBalance(input: WalletDto): Promise<GenericResponse> {
    return null; //todo implement
  }

  async checkUserRegistrationStatus(input: checkRegistrationDto): Promise<any> {
    return this.em.findOne(AuthUserEntity, {
      where: { phone: input.mobileNumber },
    });
    //as unknown as GenericResponse;
  }
}
