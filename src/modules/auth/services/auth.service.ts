import { AddressEntity } from './../../main/entities/address.entity';
import {
  BadRequestException,
  Inject,
  Injectable,
  HttpException,
  HttpStatus,
  ForbiddenException,
  Logger,
  Put,
  forwardRef,
} from '@nestjs/common';
import { EntityManager, Not } from 'typeorm';
import { STATUS } from '../entities/enums/status.enum';
import { UserEntity } from '../../../../src/modules/main/entities/user.entity';
import { PasswordEncoderService } from './password-encorder.service';
import { PlatformEntity } from '../../../../src/modules/main/entities/platform.entity';
import {
  RegisterResponseDto,
  RegisterUserInputDto,
} from '../dto/register-user.dto';
import { AuthUserEntity } from '../entities/auth-user.entity';
import { AuthUserRole } from '../types/auth-user.roles';
import { JwtManagerService } from './jwt-manager.service';
import { LoginOutput } from '../types/login-output.type';
import { CreateOtpDto, OtpDto } from '../dto/otp.dto';
import { OtpEntity } from '../entities/otp.entity';
import { OTP_STATUS } from '../entities/enums/otp-status.enum';
import {
  PhoneEmailPasswordLoginInputDto,
  ResetPasswordDto,
} from '../dto/phone-email-login.dto';

import { AccountEntity } from '../../account/entities/account.entity';
import { PaymentMethodEntity } from '../../../../src/modules/main/entities/paymentmethod.entity';
import { AccountTypeEntity } from '../../account/entities/account-type.entity';
import { WalletTypeEntity } from '../../wallet/entities/wallet.entity';
import { InjectEntityManager } from '@nestjs/typeorm';
import { SmsService } from '../../shared/services/sms.service';
import {
  generateCode,
  generateReferralCode,
} from '../../../../src/utils/shared';
import { ReferralEntity } from '../../referrals/entities/referral.entity';
import { PlATFORM } from '../../../../src/modules/main/entities/enums/platform.enum';
import {
  FileEntity,
  APP_TYPE,
  FILE_TYPE,
} from '../../fileupload/entities/file.entity';
import { FileUploadService } from '../../fileupload/services/fileupload.service';
import { DeviceEntity } from '../../main/entities/device.entity';
import { VerificationType } from '../../enums/verification-type.enum';
import { ChangePasswordDto } from '../dto/phone-email-login.dto';

import { AppRequestContext } from '../../../utils/app-request.context';
import { getAppContextALS } from '../../../utils/context';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { addSeconds, isBefore } from 'date-fns';
import { globalConfig } from '../../../config/config';
import { ConfigType } from '@nestjs/config';
import { PAYMENT_TYPE } from '../../main/entities/enums/paymenttype.enum';
import { LEVEL } from '../entities/enums/level.enum';
import { IdentityInterface } from '../interfaces/identity.interface';
import {
  IdentityProviderServiceInterface,
  IdentityProviderServiceToken,
} from '../interfaces/identity-provider.service.interface';
import { NotificationService } from '../../notifications/services/notification.service';
import { PhoneNumberService } from '../../shared/services/phoneNumber.service';
import { NETWORK } from '../../main/entities/enums/network.enum';
import { UserPinEntity } from '../../userpin/entities/userpin.entity';
import { AccountService } from '../../account/services/account.service';
import { ReferralDto } from '../../referrals/dtos/referrals.dto';
import { ReferredUserEntity } from '../../referrals/entities/reffered_user.entity';
import { AutoDebitEntity } from '../../main/entities/autodebit.entity';
import { UserDto, UserInputEditDto } from '../dto/user.dto';
import { DepositInputDto } from '../../transactions/dtos/deposit.dto';
import { TransactionService } from '../../transactions/services/transaction.service';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { TransferService } from '../../transfers/services/transfer.service';
import { AccountDepositWithrawalDto } from '../../transfers/dto/AccountDepositDto';
import { uuid } from 'uuidv4';
import { ReferralCashbackEntity } from '../../referrals/entities/referralcashback.entity';
import { SavingsGoalService } from '../../savings-goal/services/savings-goal.service';
import { SavingsGoalInputDto } from '../../savings-goal/dtos/savings-goal.dto';
import { FREQUENCY_TYPE } from '../../main/entities/enums/savingsfrequency.enum';
import { DEPOSIT_PREFERENCE } from '../../main/entities/enums/deposittype.enum';
import { ReferralCampaignEntity } from '../../referrals/entities/referral-campaign.entity';
import { ReferralBoltEntity } from '../../referrals/entities/referral-bolt.entity';
import { TRANSACTION_STATUS } from '../../enums/transaction.status';
import { EventPublisherService } from '../../events/services/event-publisher.service';
import { EventType } from '../../events/enums/event-types';
import { SOCIAL } from '../../../modules/enums/social.enum';
import { AppVersionEntity } from '../entities/app-version.entity';

export interface AuthenticateInput {
  phone: string;
  password: string;
}

@Injectable()
export class AuthService<
  Identity extends IdentityInterface = IdentityInterface,
> {
  private logger = new Logger('AuthService');
  @Inject(IdentityProviderServiceToken)
  private readonly identityProvider: IdentityProviderServiceInterface;

  @Inject(PasswordEncoderService)
  private readonly encoder: PasswordEncoderService;
  //
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    private passwordHash: PasswordEncoderService,
    private readonly jwtManager: JwtManagerService,
    public smsService: SmsService,
    public accountService: AccountService,
    private notificationService: NotificationService,
    private transferService: TransferService,
    private fileService: FileUploadService,
    private phoneNumberService: PhoneNumberService,

    // @Inject(forwardRef(() => EventPublisherService))
    private eventPublisherService: EventPublisherService,

    @Inject(forwardRef(() => SavingsGoalService))
    private savingGoal: SavingsGoalService,
    @Inject(forwardRef(() => TransactionService))
    private transactionService: TransactionService,
    @Inject(globalConfig.KEY) private config: ConfigType<typeof globalConfig>,
  ) {}

  async resetPassword(input: ResetPasswordDto) {
    await this.validateEmailPhoneInput(input);
    let identity: AuthUserEntity;
    if (input.phone != null && input.phone !== '') {
      identity = await this.em.findOne(AuthUserEntity, {
        where: { phone: input.phone },
      });
    } else if (input.email != null && input.email !== ''){
      identity = await this.em.findOne(AuthUserEntity,{
        where: { phone: input.email },
      });
    }

    if (!identity){
      throw new BadRequestException('missing_identity');
    }

    identity.password = await this.passwordHash.encodePassword(input.password);
    await this.em.save(identity);

    const tokens = await this.jwtManager.getTokens(identity);
    await this.updateRefreshToken(tokens.refreshToken, identity, 'login');
    return tokens;
  }

  async changePassword(input: ChangePasswordDto) {
    // const identity = await this.validateEmailPhoneInput(input);
    let identity: AuthUserEntity;
    if (input.phone != null && input.phone !== '') {
      identity = await this.em.findOne(AuthUserEntity, {
        where: { phone: input.phone },
        relations: ['user'],
      });
    } else if (input.email != null && input.email !== '') {
      identity = await this.em.findOne(AuthUserEntity, {
        where: { phone: input.email },
        relations: ['user'],
      });
    }
    if (!input.oldPassword) {
      throw new BadRequestException('not_found', 'Old Password is required');
    }

    if (!identity) {
      throw new BadRequestException('not_found', 'User Not Found');
    }

    console.log('identity', identity);

    let migrated = null;
    if (identity.user.user_id) {
      migrated = { user_id: identity.user.user_id, phone: identity.phone };
    }

    const verifyPassword = this.encoder.verifyPassword(
      input.oldPassword,
      identity.password,
      migrated,
    );

    if (verifyPassword) {
      identity.password = await this.passwordHash.encodePassword(
        input.password,
      );
      await this.em.save(identity);
      return {
        message: 'Congrats! Your password change was successful.',
      };
    } else {
      throw new BadRequestException('not_found', 'Wrong old Password');
    }
  }


  async getAppVersion(){

    const query=`SELECT * FROM app_version_entity where id>=1 order by "createdAt"  desc limit 1`
     const res= await this.em.query(query)


      if(res.length){
        return  res[0]
      }else{

        throw new HttpException(
          'App Version Data not found',
          404,
        );
      }
  }

  async authenticate(
    input: PhoneEmailPasswordLoginInputDto,
  ): Promise<LoginOutput> {
    let identity: AuthUserEntity;

    if (input.phone) {
      identity = await this.em.findOne(AuthUserEntity, {
        where: { phone: input.phone },
        relations: ['user'],
      });
    }
    if (input.email) {
      identity = await this.em.findOne(AuthUserEntity, {
        where: { phone: input.email },
        relations: ['user'],
      });
    }

    if (!identity) {
      throw new HttpException(
        'Account not found. Check details or create a new account ',
        401,
      );
    }

    if (identity.accountStatus == STATUS.disabled) {
      throw new HttpException('Your account has been disabled', 400);
    }

    if (!identity) {
      throw new BadRequestException('missing_identity');
    }

    this.em.save(identity);
    let migrated = null;
    if (identity.user.user_id) {
      migrated = { user_id: identity.user.user_id, phone: identity.phone };
    }
    identity.lastLoginDate = new Date();
    identity.signInchannel = input.channel;
    const verifyPassword = this.encoder.verifyPassword(
      input.password,
      identity.password,
      migrated,
    );

    if (verifyPassword) {
      if (input.deviceId) {
        // await this.storeUserDevice(input.deviceId, identity.userId);
        const device = await this.em.findOne(DeviceEntity, {
          where: {
            deviceId: input.deviceId,
          },
        });
        if (!device && input.deviceId) {
          console.log('got here 1');
          const newDevice = new DeviceEntity();

          newDevice.deviceId = input.deviceId;
          newDevice.userId = identity.userId;
          await this.em.save(newDevice);
        }
      }

      const tokens = await this.jwtManager.getTokens(identity);
      await this.updateRefreshToken(tokens.refreshToken, identity, 'login');
      /** Publis login event to RabbitMq */
      await this.eventPublisherService.publishToExchange(
        EventType.LOGIN_EVENT,
        { userId: identity.userId, success: true },
      );
      return tokens;
    } else {
      this.logger.error(
        "Login failed The credentials you entered don't match our records. Please try again",
        input,
      );
      //await this.eventPublisherService.publishToExchange(EventType.LOGIN_EVENT,{userId:identity.userId,success:false});
      throw new BadRequestException(
        "The credentials you entered don't match our records. Please try again",
      );
      return;
    }
  }

  async sendOtp(data: { phone?: string; email?: string }, otp: number) {
    if (process.env.NODE_ENV !== 'test') {
      if (data.email) {
        const otpSmsResponse = await this.notificationService.sendEmail({
          subject: 'Welcome to Bezomoney! Your Generated Password',
          message: `${otp}`,
          to: data.email,
          template: {
            provider: 'sendgrid',
            name: 'otp',
            data: {},
          },
          from: 'support Team<support@bezomoney.com>', //  Support Team<support@bezomoney.com> override default from
        });
        return otpSmsResponse;
      }
      if (data.phone) {
        const otpSmsResponse = await this.notificationService.sendSms({
          to: data.phone,
          sms: 'Bezo OTP: ' + `${otp}`,
        });
        console.log('otpSmsResponse', otpSmsResponse);
        return otpSmsResponse;
      }
    }
  }

  async storeUserDevice(deviceId: string, userId: string) {
    const device = new DeviceEntity();
    device.deviceId = deviceId;
    device.userId = userId;
    return await this.em.save(device);
  }

  async getUserDeviceId(userId) {
    const data = await this.em.find(DeviceEntity, { where: { userId } });
    return data.map((r) => r.deviceId);
  }

  async phoneIsUser(phone: string) {
    const identity = await this.identityProvider.retrieveIdentityByPhone(phone);
    if (identity) {
      return true;
    }
    return false;
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

  async createOtp(input: CreateOtpDto) {
    if (input.phone && input.email)
      throw new BadRequestException('phone_or_email_only');

    const otp = new OtpEntity();
    const generatedOtp = generateCode(6);
    otp.otp = generatedOtp;
    if (input.phone) otp.phone = input.phone;
    if (input.email) otp.email = input.email;
    otp.verificationType = input.verificationType;
    if (input.phone && input.phone !== '233222222222') {
      await this.notificationService.sendSms({
        to: `${input.phone}`,
        sms: 'Bezo OTP: ' + `${otp.otp}`,
      });
    }
    if (await this.em.save(otp)) {
      console.log('environment', process.env.NODE_ENV);
      const otpResponse: any = {
        message: 'Your OTP code has been sent via SMS. Kindly check your inbox and enter the code here.',
      };
      if (process.env.NODE_ENV === 'test') otpResponse.otp = generatedOtp;
      return otpResponse;
    }
    throw new HttpException('Unable to send otp', HttpStatus.BAD_REQUEST);
  }

  async phoneEmailIsOtpVerified(
    request: Partial<RegisterUserInputDto>,
    verifyType?: VerificationType,
  ) {
    const query = {
      ...(request.phone_number && { phone: request.phone_number }),
      ...(request.email && { email: request.email }),
      ...(verifyType && { verificationType: verifyType }),
      status: OTP_STATUS.verified,
    };
    const verifyStatus = await this.em.findOne(OtpEntity, {
      where: query,
      order: { createdAt: 'DESC' },
    });
    return verifyStatus;
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
        throw new BadRequestException(
          'Verification code has already been used',
        );
      if (otp_data.status === OTP_STATUS.expired)
        throw new BadRequestException('Verification code has expired');
      if (otp_data.otp !== `${input.otp}`)
        throw new BadRequestException(
          'The verification code you entered is invalid',
        );
      otp_data.status = OTP_STATUS.verified;
      await this.em.save(otp_data);
      return {
        message: "Congrats! You're good to go!",
      };
    } else {
      throw new BadRequestException(
        'The verification code you entered is invalid',
      );
    }
  }

  async ifAuthTypeExists(input: OtpDto): Promise<AuthUserEntity> {
    let phone: AuthUserEntity;
    let email: AuthUserEntity;
    //const ctx = getAppContextALS<AppRequestContext>();
    if (input.phone) {
      phone = await this.em.findOne(AuthUserEntity, {
        where: { phone: input.phone },
      });
      if (!phone) throw new BadRequestException('missing_identity');

      // phone.status = STATUS.active;
      // phone.phoneValidated = true;
      // phone.verifiedAt = new Date();
      return phone;
    }
    if (input.email) {
      email = await this.em.findOne(AuthUserEntity, {
        where: { email: input.email },
      });
      if (!email) throw new BadRequestException('missing_identity');

      // email.status = STATUS.active;
      // email.emailValidated = true;
      return email;
    }
  }

  async validateEmailPhoneInput(input: { phone?: string; email?: string }) {
    let identity: IdentityInterface;
    if (input.phone) {
      identity = await this.identityProvider.retrieveIdentityByPhone(
        input.phone,
      );
      if (!identity) {
        throw new BadRequestException('Phone number not found');
      }
      return identity;
    }
    if (input.email) {
      identity = await this.identityProvider.retrieveIdentityByEmail(
        input.email,
      );
      if (!identity) {
        throw new BadRequestException('Email not found');
      }
      return identity;
    }
  }

  async getIdentityByEmailOrPhone(input: { phone?: string; email?: string }) {
    let identity: IdentityInterface;
    if (input.phone) {
      // identity = await this.userProvider.retrieveIdentity(input.phone);
      if (!identity) {
        throw new BadRequestException('Phone number not found');
      }
      return identity;
    }
    if (input.email) {
      identity = await this.identityProvider.retrieveIdentityByEmail(
        input.email,
      );
      if (!identity) {
        throw new BadRequestException('Email not found');
      }
      return identity;
    }
  }

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

  async saveUserPhone(phone: AuthUserEntity) {
    const phoneExist = await this.em.findOne(AuthUserEntity, {
      where: { phone: phone.phone },
    });
    if (phoneExist) {
      return phoneExist;
    }
    return await this.em.save(phone);
  }

  async savePaymentMethod(payment: PaymentMethodEntity) {
    return await this.em.save(payment);
  }

  generateRandomNumber() {
    return Math.floor(Math.random() * 10000) + 1;
  }

  async registerUser(
    request: RegisterUserInputDto,
  ): Promise<RegisterResponseDto> {

      console.log('SIGNUP REQUEST>>>', request);
      this.logger.log(request, 'SIGNUP REQUEST');

      let referrer: UserEntity;
      await this.fieldValidation(request);
      if (!request.network) {
        request.network = this.phoneNumberService.provider(
          request.phone_number,
        );
      }

      // if (request.referralCode) {
      //   referrer = await this.em.findOne(UserEntity, {
      //     where: { referralCode: request.referralCode },
      //   });
      //   if (!referrer) throw new BadRequestException('invalid_referral_code');
      // }
      if (!request.phone_number) {
        throw new BadRequestException('phone_number_is_required');
      }
      if (request.phone_number) {
        const checkPhone = await this.phoneExist(request.phone_number);
        console.log('checkPhone', checkPhone);
        if (checkPhone) {
          throw new BadRequestException('phone_already_exist');
        }
      }

      if (request.email) {
        const emailExist = await this.emailExist(request.email);
        // const emailIsVerified = await this.phoneEmailIsOtpVerified(request);
        if (emailExist) throw new BadRequestException('email_already_exist');
        //TODO - Send email verification code to user
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

      const genNumber = this.generateRandomNumber();
      if (!request.userName)
        user.userName =
          (await this.generateRefUserName(
            request.firstName,
            request.lastName,
          )) + genNumber;
      user.level = LEVEL.beginner;
      user.platforms = [platform];
      user.occupation = request.occupation;

      // user.profile = profile;
      // user.userPaymentMethods = [paymentMethod];
      user.accounts = [account];
      // user.referralCode = generateCode(6);
      user.user_id = null;
      if (user.bezoSource){
      
       user.bezoSource= request.bezoSource as unknown as SOCIAL || SOCIAL.FRIEND
       console.log("bezoSource1",user.bezoSource)
      }else{
        user.bezoSource= SOCIAL.FRIEND
        console.log("bezoSource1",user.bezoSource)
      }

      // add file if exists
      if (request.file) {
        const { name, url } = await this.fileService.uploadFile(request.file);
        const file = new FileEntity();
        file.name = name;
        file.url = [url];
        file.appType = APP_TYPE.PROFILE;
        user.files = [file];
      }
      //
      // optional date of birth
      if (request.dateOfBirth)
        user.dateOfBirth =
          typeof request.dateOfBirth === 'string'
            ? new Date(request.dateOfBirth)
            : request.dateOfBirth;
      user.gender = request.gender;

      // add optional address
      const address: AddressEntity = {
        ...(request.homeAddress && { homeAddress: request.homeAddress }),
        ...(request.country && { country: request.country }),
        ...(request.region && { region: request.region }),
        ...(request.gpsAddress && { gpsAddress: request.gpsAddress }),
      };

      console.log('address', address);

      user.address = address;
      const authUser = new AuthUserEntity();
      authUser.email = request.email;
      authUser.phone = request.phone_number;
      authUser.roles = [AuthUserRole.User];
      authUser.password = this.passwordHash.encodePassword(request.password);
      authUser.accountStatus = STATUS.active;
      authUser.signUpchannel = request.channel ?? "android"
      authUser.user = user;

      console.log('userName>>', user.userName);

      const auth: AuthUserEntity = await this.em.save(authUser);

      console.log('got here 1 ');
      address.userId = user.id;
      // await this.em.save(AddressEntity, address);
      const paymentMethod = new PaymentMethodEntity(); //create default payment method

      console.log('got here 2');
      if (request.phone_number) {
        // phone.userId = auth.id;
        // const savedPhone = await this.saveUserPhone(phone);
        // paymentMethod.network = this.getNetwork(request?.network?.toUpperCase());

        paymentMethod.network = this.getNetwork(request.network.toUpperCase());

        if (request.phone_number) paymentMethod.phoneNumber = authUser.phone;

        paymentMethod.userId = auth.userId;
        paymentMethod.status = STATUS.enabled;
        paymentMethod.default = true;
        paymentMethod.paymentType = PAYMENT_TYPE.mobile_money;

        console.log('payment', paymentMethod);
        await this.em.save(paymentMethod);
      }

      ///adding referrals
      // let users  = await this.em.findOne(UserEntity,{where:{id:user.id}})
      let newReferralCode =
        (await this.generateRefUserName(user.firstName, user.lastName)) +
        genNumber;
      //
      console.log('newRerralCode >>>', newReferralCode);
      const referral = new ReferralDto();
      // referral.code = generateReferralCode(9)
      referral.code = newReferralCode;
      // referral.code = request.referralCode;
      // referral.createdAt = new Date();
      referral.userId = user.id;

      // if (referral.code)
      //   var referrerCode = await this.getInitials(
      //     request.firstName,
      //     request.lastName,
      //   );
      // console.log('the referrer code is >>>', referrerCode);

      if (!request.userName)
        user.userName =
          (await this.generateRefUserName(
            request.firstName,
            request.lastName,
          )) + genNumber;
      console.log('ab', referral);

      const refSaved = await this.em.save(ReferralEntity, referral);
      ////

      if (request.referralCode) {
        const getReferrerData = await this.em.findOne(ReferralEntity, {
          where: { code: request.referralCode },
        });
        console.log('getReferrerData', getReferrerData);

        if (!getReferrerData)
          throw new BadRequestException('invalid_referral_code');

        /// GET NUMBER OF REFERRALS BY A USER
        const countUsersReferred = await this.em.find(ReferredUserEntity, {
          where: { referrerId: getReferrerData.id },
        });

        // const primaryAccountOfReferrer= await this.em.findOne(AccountEntity,{
        //   where:{userId:getReferrerData.userId, name:'Primary'}
        // })

        // GET CAMPAIGN DATA WHETHER CAMPAIGN IS OPENED OR NOT

        // if (countUsersReferred.length < 20) {
        // // get Referral Phone Number
        const getReferer = await this.em.findOne(AuthUserEntity, {
          where: { userId: getReferrerData.userId },
        });

        console.log('getReferer', getReferer);

        //// CREATE A SAVING GOAL -- Referral Bonus

        const resAccount = await this.em.findOne(AccountEntity, {
          where: {
            name: 'Referral Bonus',
            userId: getReferer.userId,
          },
        });

        /// CHECK IF CAMPAIGN HAS STARTED
        const checker = await this.em.findOne(ReferralCampaignEntity, {
          where: [{ status: true }, { status: false }],
        });
        console.log('checker', checker);

        if (checker.status == true) {
          const INFLUENCER_LIST = ['bezoxbolt'];

          // if(INFLUENCER_LIST.includes(request.referralCode)==true){
          //     //  INFLUENCER REFERRED

          //     if (!resAccount) {
          //       /// CREATE A FLEX SAVING GOAL THAT USERS CANNOT WITHDRAWAL
          //       const savingGoalDetails = new SavingsGoalInputDto();

          //       (savingGoalDetails.name = 'Referral Bonus'),
          //         (savingGoalDetails.emoji = '😊'),
          //         (savingGoalDetails.accountTypeAlias = 'flexi-save'),
          //         (savingGoalDetails.accountTypeName = 'Flexi Save'),
          //         (savingGoalDetails.description =
          //           'purpose is to save to build start up'),
          //         (savingGoalDetails.period = 12),
          //         (savingGoalDetails.frequency = FREQUENCY_TYPE.daily);
          //       savingGoalDetails.preference = DEPOSIT_PREFERENCE.manual;
          //       (savingGoalDetails.amount = 2000),
          //         (savingGoalDetails.startDate = '2023-05-08'),
          //         (savingGoalDetails.endDate = '2024-08-20'),
          //         (savingGoalDetails.goalTypeId =
          //           '65147d29-7452-41a3-9c88-55a68614d2d2'),
          //         (savingGoalDetails.accountTypeId =
          //           'f31dad46-dcc1-4474-8096-542838a56c60'),
          //         (savingGoalDetails.walletId =
          //           '7d0783b1-511d-4c73-991b-67474d4d5701');

          //       await this.savingGoal.createSavingGoalReferral(
          //         savingGoalDetails,
          //         request.phone_number,
          //         auth.userId,
          //       );

          //       /// Send SMS
          //       await this.notificationService.sendSms({
          //         to: request.phone_number,
          //         sms: `Hurray! You earned your first GHS10! Rewards will be in your 'Referral Bonus' savings goal. You can withdraw tomorrow at 12pm. Thank you for referring!`,
          //       });

          //       await this.notificationService.sendSms({
          //         to: request.phone_number,
          //         sms: `Hurray, to redeem your GHS10 reward, please ensure you complete the ID verification process. Thanks!!`,
          //       });
          //     } else {
          //       //GET REFERRAL ACCOUNT WITH NAME REFERRAL BONUS

          //       const accountReferralBonus = await this.em.findOne(AccountEntity, {
          //         where: { name: 'Referral Bonus', userId: getReferer.userId },
          //       });

          //       const depositRef = new AccountDepositWithrawalDto();
          //       const cashbackCal = 10;
          //       depositRef.amount = cashbackCal;
          //       depositRef.accountId = accountReferralBonus.id;
          //       depositRef.phone = request.phone_number;
          //       depositRef.reference = uuid();
          //       depositRef.narration = 'Referral Bonus';
          //       console.log('Got Herr >>>', depositRef);
          //       await this.transferService.userAccountDeposit(depositRef);

          //       await this.notificationService.sendSms({
          //         to: request.phone_number,
          //         sms: `Hurray! to redeem your GHS10 reward, please ensure you complete the ID verification process. Thanks!!`,
          //       });
          //     }
          // }else{

          //   console.log(" NOT INFLUENCER REFERRED")

          //   /// NOT INFLUENCER REFERRED

          //   if (!resAccount) {
          //     /// CREATE A FLEX SAVING GOAL THAT USERS CANNOT WITHDRAWAL
          //     const savingGoalDetails = new SavingsGoalInputDto();

          //     (savingGoalDetails.name = 'Referral Bonus'),
          //       (savingGoalDetails.emoji = '😊'),
          //       (savingGoalDetails.accountTypeAlias = 'flexi-save'),
          //       (savingGoalDetails.accountTypeName = 'Flexi Save'),
          //       (savingGoalDetails.description =
          //         'purpose is to save to build start up'),
          //       (savingGoalDetails.period = 12),
          //       (savingGoalDetails.frequency = FREQUENCY_TYPE.daily);
          //     savingGoalDetails.preference = DEPOSIT_PREFERENCE.manual;
          //     (savingGoalDetails.amount = 2000),
          //       (savingGoalDetails.startDate = '2023-05-08'),
          //       (savingGoalDetails.endDate = '2024-08-20'),
          //       (savingGoalDetails.goalTypeId =
          //         '65147d29-7452-41a3-9c88-55a68614d2d2'),
          //       (savingGoalDetails.accountTypeId =
          //         'f31dad46-dcc1-4474-8096-542838a56c60'),
          //       (savingGoalDetails.walletId =
          //         '7d0783b1-511d-4c73-991b-67474d4d5701');

          //     await this.savingGoal.createSavingGoalReferral(
          //       savingGoalDetails,
          //       getReferer.phone,
          //       getReferer.userId,
          //     );

          //     /// Send SMS
          //     await this.notificationService.sendSms({
          //       to: getReferer.phone,
          //       sms: `Hurray! You earned your first GHS10! Rewards will be in your 'Referral Bonus' savings goal. You can withdraw tomorrow at 12pm. Thank you for referring!`,
          //     });
          //     await this.notificationService.sendSms({
          //       to: getReferer.phone,
          //       sms: `Hurray! ${user.firstName} ${user.lastName}  used your referral code, to redeem your GHS10 reward, please ensure they complete the ID verification process. Thanks!!`,
          //     });
          //   } else {
          //     //GET REFERRAL ACCOUNT WITH NAME REFERRAL BONUS

          //     const accountReferralBonus = await this.em.findOne(AccountEntity, {
          //       where: { name: 'Referral Bonus', userId: getReferer.userId },
          //     });

          //     const depositRef = new AccountDepositWithrawalDto();
          //     const cashbackCal = 10;
          //     depositRef.amount = cashbackCal;
          //     depositRef.accountId = accountReferralBonus.id;
          //     depositRef.phone = getReferer.phone;
          //     depositRef.reference = uuid();
          //     depositRef.narration = 'Referral Bonus';
          //     console.log('Got Herr >>>', depositRef);
          //     await this.transferService.userAccountDeposit(depositRef);

          //     await this.notificationService.sendSms({
          //       to: getReferer.phone,
          //       sms: `Hurray! ${user.firstName} ${user.lastName}  used your referral code, to redeem your GHS10 reward, please ensure they complete the ID verification process. Thanks!!`,
          //     });
          //   }
          // }

          if (
            INFLUENCER_LIST.includes(request.referralCode.toLowerCase()) == true
          ) {
            let resFetch = await this.em.findOne(ReferralBoltEntity, {
              where: {
                status: TRANSACTION_STATUS.PENDING,
                userId: null,
              },
            });

            if (resFetch) {
              resFetch.userId = auth.userId;

              await this.em.save(resFetch);
            }

            // await this.notificationService.sendSms({
            //   to: request.phone_number,
            //   sms: ` Your BezoXBolt is${resFetch.code} Thank you for referring!`,
            // });
            //console.log("Sent SMS")
          }

          /// Send SMS

          // await this.em.save(ReferralCashbackEntity, {
          //   referrerId: getReferrerData.userId,
          //   referreeId: auth.userId,
          // });
        }

        //}

        ///RECORD IN REFERRAL CASHBACK TABLE
        await this.em.save(ReferredUserEntity, {
          userId: auth.userId,
          referrerId: getReferrerData.id,
          referrer: getReferrerData,
          user: user,
        });
      }

      ///save data for auto debit INITIATIATION

      const autoDebit = new AutoDebitEntity();
      autoDebit.userId = user.id;
      autoDebit.network = paymentMethod.network;
      autoDebit.phoneNumber = request.phone_number;

      // const paymentMethods = await this.getUserPaymentPhone()
      // const phoneNumbers = paymentMethods.phoneNumber

      const userDeviceIds = await this.getUserDeviceId(auth.userId);
      // let transaction = new TransactionEntity()
      // await this.notificationService.sendAll({
      //   data: authUser,
      //   to:request.phone_number,
      //   sms:`Welcome to BezoSusu. Your account has been created successfully. You will receive a payment prompt of 10GHS shortly.Kindly approve it to activate your BezoSusu account. You can also deposit at a later time to activate your account.`,
      //   subject: 'Create an account',
      //   message:`Welcome to BezoSusu. Your account has been created successfully. You will receive a payment prompt of 10GHS shortly.Kindly approve it to activate your BezoSusu account. You can also deposit at a later time to activate your account.`,
      //   deviceId : userDeviceIds,
      //   email:auth.email,
      //   template:{
      //     name:"account",
      //     data:{
      //       logourl:"",
      //       title:"Bezo account",
      //       emailMessage:`Welcome to BezoSusu. Your account has been created successfully. You will receive a payment prompt of 10GHS shortly.Kindly approve it to activate your BezoSusu account. You can also deposit at a later time to activate your account.`
      //     }
      //   },
      //   userId: auth.userId,
      //   activityType: transaction.transactionType
      // })
      // await this.eventPublisherService.publishToExchange(EventType.SIGNUP_EVENT, {userId:user.id, phone:request.phone_number});

      await this.notificationService.sendSms({
        to: request.phone_number,
        sms: `Welcome to Bezo. Your account has been created successfully. You will receive a payment prompt of 10GHS shortly.Kindly approve it to activate your Bezo account. You can also deposit at a later time to activate your account.`,
      });

      // if(request.channel==PlATFORM.ios||  request.channel==PlATFORM.android){

      // const deposit = new AccountDepositWithrawalDto();
      // deposit.amount = 10
      // deposit.accountId = account.id
      // deposit.phone = request.phone_number;
      // deposit.reference = uuid();
      // deposit.narration = 'Deposit to primary account:App launch';
      // console.log("Got Herr >>>", deposit)
      // await this.transferService.userAccountDeposit(deposit);

      // }

      setTimeout(async () => {
        const input = new DepositInputDto();
        input.amount = Number(10);
        input.network = paymentMethod.network;
        input.accountId = account.id;
        input.verificationId = '423df0-3920-34-000';
        input.channel = PlATFORM.web;

        await this.transactionService.depositWithoutVerification(
          input,
          user.id,
          request.phone_number,
        );
      }, 5000);

      const { token, refreshToken } = await this.userTokens(auth);

      return {
        token,
        refreshToken,
      } as RegisterResponseDto;
   
  }

  async userTokens(
    auth: AuthUserEntity,
  ): Promise<{ token: string; refreshToken: string }> {
    return {
      token: await this.jwtManager.issueAccessToken(auth),
      refreshToken: await this.jwtManager.generateRefreshToken(auth),
    };
  }

  async checkIfInfluencer(referralCode): Promise<boolean> {
    ///ARRAY OF INFLUENCERS
    let influencers = [''];
    const isFound = influencers.includes(referralCode);
    return isFound;
  }

  getNetwork(network): NETWORK {
    console.log('network', network);
    if (network == 'MTN') {
      return NETWORK.mtn;
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

  async UpdateUserProfile(
    userId: string,
    input: UserInputEditDto,
  ): Promise<any> {
    // if(input.userName){
    //   const checkusername  = await this.usernameExist(input.userName)
    //   console.log('checkusername >>>',checkusername);
    //   if(checkusername){
    //     throw new BadRequestException('username already exist')
    //   }
    // }

    const profile = await this.em.findOne(UserEntity, {
      where: { id: userId },
    });
    console.log('the profile is >>>>', profile);
    if (!profile) {
      throw new HttpException('profile details not found', 404);
    }
    const ctx = getAppContextALS<AppRequestContext>();

    profile.userName = input.userName;
    profile.firstName = input.firstName;
    profile.lastName = input.lastName;
    profile.dateOfBirth =
      typeof input.dateOfBirth === 'string'
        ? new Date(input.dateOfBirth)
        : input.dateOfBirth;
    profile.occupation = input.occupation;
    profile.gender = input.gender;
    profile.country = input.country;
    profile.region = input.region;
    console.log('the profile of the user is >>>', profile);
    const address = await this.em.findOne(AddressEntity, { where: { userId } });
    if (!address) {
      throw new HttpException('Address not found', HttpStatus.NOT_FOUND);
    }

    address.homeAddress = input.homeAddress;
    address.gpsAddress = input.gpsAddress;
    console.log('the address of the user is >>>', address);
    await this.em.save(address);
    console.log('the profile of the exist user is >>>>', profile);
    return (await this.em.save(profile)) as unknown as UserDto;
  }

  async insertRefreshToken(refreshToken: string) {
    const hashedRefreshToken = await this.jwtManager.hashData(refreshToken);
    const ctx = getAppContextALS<AppRequestContext>();
    const refreshTokenEntity = new RefreshTokenEntity();
    refreshTokenEntity.userId = ctx.authUser.id;
    refreshTokenEntity.token = hashedRefreshToken;
    await this.em.save(refreshTokenEntity);
  }

  async phoneExist(phone: string) {
    return await this.em.findOne(AuthUserEntity, { where: { phone } });
  }

  async emailExist(email: string) {
    return await this.em.findOne(AuthUserEntity, { where: { email } });
  }

  async usernameExist(userName: string) {
    return await this.em.findOne(UserEntity, { where: { userName } });
  }

  async deviceExist(deviceId: string) {
    return await this.em.findOne(DeviceEntity, { where: { deviceId } });
  }
  async generateRefUserName(firstName, lastName) {
    let userName = firstName.slice(0, 3) + lastName.slice(0, 3);
    const queryStatement = `SELECT * FROM referral_entity 
    WHERE code LIKE '${userName}%' `;

    const result = await this.em.query(queryStatement);
    // console.log('result', result);

    if (result.length > 0) {
      if (result.length > 9) {
        userName = userName + (Number(result.length) + 1);
      } else {
        userName = userName + '0' + (Number(result.length) + 1);
      }
    }
    return userName;
  }

  async refferralcodeExist(code: string) {
    return await this.em.findOne(ReferralEntity, { where: { code } });
  }

  async fieldValidation(request: RegisterUserInputDto) {
    if (request.documentType && !request.file)
      throw new BadRequestException('missing_file');

    if (request.file && !request.documentType)
      throw new BadRequestException('missing_document_type');
  }

  async userProfile() {
    const ctx = getAppContextALS<AppRequestContext>();
    const authUser = Object.assign({}, ctx.authUser) as any;
    delete authUser.createdAt;
    delete authUser.updatedAt;
    delete authUser.password;
    delete authUser.user.createdAt;
    delete authUser.user.updatedAt;
    delete authUser.user.pin;
    let paymentMethods = authUser.user.userPaymentMethods;
    let payMethods = [];
    if (paymentMethods.length) {
      payMethods = authUser.user.userPaymentMethods;
    } else {
      payMethods = await this.em.find(PaymentMethodEntity, {
        where: { userId: authUser.user.id },
      });
    }
    payMethods.forEach((p) => {
      delete p.createdAt;
      delete p.updatedAt;
      delete p.userId;
    });
    authUser.paymentMethods = payMethods;
    authUser.user.userPaymentMethods = paymentMethods;
    const pin = await this.em.findOne(UserPinEntity, {
      where: { userId: ctx.authUser.userId },
    });
    authUser.pinCreated = pin != null;
    const address = await this.em.findOne(AddressEntity, {
      where: { userId: ctx.authUser.userId },
    });
    authUser.address = address;
    try {
      authUser.account = await this.accountService.getUserPrimaryAccount({
        userId: authUser.userId,
      });

      const referralInfo = await this.accountService.getUserReferral(
        authUser.userId,
      );

      authUser.balance = authUser.account.balance;
      authUser.referral = referralInfo;
    } catch (err) {
      this.logger.error(
        'there was an error getting primary account balance',
        err,
      );
      console.log('Error getting primary account balance', err);
    }
    console.log('The user profile response >>', authUser);
    return authUser;
  }

  async uploadProfilePic(request) {
    const ctx = getAppContextALS<AppRequestContext>();

    console.log('ctx', ctx.authUser);

    console.log('request file', request.files.profilePic[0]);

    if (request.files.profilePic) {
      const { name, url } = await this.fileService.uploadFile(
        request.files.profilePic[0],
      );

      const profileImage = await this.em.findOne(FileEntity, {
        where: { userId: ctx.authUser.userId, appType: APP_TYPE.PROFILE },
        order: {
          createdAt: 'DESC',
        },
      });

      //console.log("profileImage",profileImage)

      if (profileImage) {
        // profileImage.url = [url];
        // profileImage.userId = ctx.authUser.userId;

        // const dataToSend = await this.em.save(FileEntity, profileImage);

        // delete dataToSend.user;
        // return dataToSend;

        // await this.em.delete(FileEntity, {
        //   where: { userId:ctx.authUser.userId,appType:APP_TYPE.PROFILE },

        // })

        const query = `DELETE FROM file_entity where "userId"='${ctx.authUser.userId}' 
        and "appType"='${APP_TYPE.PROFILE}'`;
        const res = await this.em.query(query);

        const file = new FileEntity();
        file.url = [url];
        file.appType = APP_TYPE.PROFILE;
        file.idNumber = request.body.idNumber;
        file.type = FILE_TYPE.image;
        file.userId = ctx.authUser.userId;
        file.user = ctx.authUser.user;
        file.idType = request.body.idType;
        await this.em.save(FileEntity, file);

        delete file.user;
        return file;
      } else {
        const file = new FileEntity();
        file.url = [url];
        file.appType = APP_TYPE.PROFILE;
        file.idNumber = request.body.idNumber;
        file.type = FILE_TYPE.image;
        file.userId = ctx.authUser.userId;
        file.user = ctx.authUser.user;
        file.idType = request.body.idType;

        await this.em.save(FileEntity, file);

        delete file.user;
        return file;
      }
    } else {
      throw new HttpException('file is required', 400);
    }
  }

  async getUploadImage() {
    const ctx = getAppContextALS<AppRequestContext>();
    const userData = await this.em.findOne(UserEntity, {
      where: { id: ctx.authUser.userId },
      relations: ['files'],
      order: { createdAt: 'DESC' },
    });
    return userData.files
      .map((r) => {
        if (r.appType == 'ID_CARD' || r.appType == 'SELFIE') {
          return r;
        }
      })
      .splice(-2);
  }

  // save new token

  async saveHashToken(hashedRefreshToken: string, userId: string) {
    const refreshTokenEntity = new RefreshTokenEntity();
    refreshTokenEntity.userId = userId;
    refreshTokenEntity.token = hashedRefreshToken;
    refreshTokenEntity.expiresAt = addSeconds(
      Date.now(),
      this.config.auth.refreshToken.expiresIn,
    );
    return await this.em.save(refreshTokenEntity);
  }

  // refresh token

  async updateRefreshToken(
    token: string,
    user?: AuthUserEntity,
    updateType?: string,
  ) {
    const ctx = getAppContextALS<AppRequestContext>();
    const hashedRefreshToken = await this.jwtManager.hashData(token);

    if (updateType === 'refresh_token') {
      const refreshToken = await this.getUserRefreshToken(ctx.authUser.id);
      console.log('update refresh token', refreshToken);
      if (!refreshToken)
        throw new BadRequestException('refresh_token_not_found');
      refreshToken.token = hashedRefreshToken;
      return await this.em.save(refreshToken);
    }
    try {
      const newToken = await this.getUserRefreshToken(user.id);
      if (newToken) {
        newToken.token = hashedRefreshToken;
        newToken.expiresAt = addSeconds(
          Date.now(),
          this.config.auth.refreshToken.expiresIn,
        );
        await this.em.save(newToken);
      } else {
        await this.saveHashToken(hashedRefreshToken, user.id);
      }
    } catch (err) {
      console.log(err);
      throw new HttpException('error saving refresh token', 500);
    }
  }

  async getUserRefreshToken(userId: string) {
    const userToken = await this.em.findOne(RefreshTokenEntity, {
      where: { userId },
    });
    if (userToken) return userToken;
    return false;
  }

  async refreshToken(token: string) {
    console.log('received token', token);
    const ctx = getAppContextALS<AppRequestContext>();
    console.log('context', ctx.authUser.id);
    const user = await this.em.findOne(RefreshTokenEntity, {
      where: { userId: ctx.authUser.id },
      order: { createdAt: 'ASC' },
    });
    console.log('user Token', user);
    if (!user || !user.token) throw new ForbiddenException('Access Denied');
    console.log('user token', user.token);
    console.log('incoming token', token);
    // const refreshTokenMatches = await argon2.verify(user.token, token);
    // console.log('refreshTokenMatches', refreshTokenMatches);
    // if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');
    const tokens = await this.jwtManager.getTokens(ctx.authUser);

    // console.log("tokens",tokens)
    if (tokens) {
      await this.updateRefreshToken(
        tokens.refreshToken,
        ctx.authUser,
        'refresh_token',
      );
      return tokens;
    } else {
      throw new ForbiddenException('Access Denied');
    }
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
    console.log('The suggestions are >>>', suggestions);

    const minIndex = 0;
    const maxIndex = suggestions.length - 1;
    return suggestions[
      Math.floor(Math.random() * (maxIndex - minIndex + 1)) + minIndex
    ];
  };

  getInitials = (firstName, lastName) => {
    return firstName.substring(0, 3) + lastName.substring(lastName.length - 3);
  };

  async verifyUserByPhone(phone: string): Promise<any> {
    const authUser = await this.em.find(AuthUserEntity, {
      where: { phone: phone },
    });

    if (authUser.length >= 1) {
      return {
        message: `Oops! You already have a Bezo account. Log into your account to change your password if you have forgotten your account details.`,
        exist: true,
      };
    } else {
      return {
        message: `User does not exist`,
        exist: false,
      };
    }
  }

  async upgradeUserAccount(userId: string): Promise<any> {
    try {
      const upgrade = await this.em
        .getRepository(UserEntity)
        .createQueryBuilder()
        .update(UserEntity)
        .set({ level: LEVEL.advance })
        .where('userId = :userId', { userId: userId })
        .execute();

      return upgrade;
    } catch (e) {
      throw new BadRequestException(`Could not update user information`);
    }
  }
}
