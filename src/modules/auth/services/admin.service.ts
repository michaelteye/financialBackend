import { AppRequestContext } from '../../../utils/app-request.context';
import { getAppContextALS } from '../../../utils/context';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
// import {
//   EmailIdentityProviderServiceToken,
//   EmailIdentityProviderServiceInterface,
// } from '../interfaces/email-identity-provider.service.interface';
// import { EmailIdentityInterface } from '../interfaces/email-identity.inteface';
import {
  UserProviderServiceToken,
  UserProviderServiceInterface,
} from '../interfaces/user-identity-provider.service.interface';

import { UserInterface } from '../interfaces/user.interface';
import { PasswordEncoderService } from './password-encorder.service';
import { AuthUserEntity } from '../entities/auth-user.entity';
import { IdentityInterface } from '../interfaces/identity.interface';
import { IdentityProviderServiceInterface, IdentityProviderServiceToken } from '../interfaces/identity-provider.service.interface';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { UserEntity } from '../../main/entities/user.entity';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { uuid } from 'uuidv4';
import { TransferCoreDto } from '../../transfers/dto/TransferCoreDto';
import { TransferCoreService } from '../../transfers/services/transfer.core.service';
import { TRANSFER_STATUS_CODE } from '../../transfers/enums/transferstatus.enum';
import { NotificationService } from '../../notifications/services/notification.service';
import { TransactionStatus } from '../../userpin/entities/userpin.entity';
import { TRANSACTION_STATUS } from '../../enums/transaction.status';

export interface AuthenticateInput {
  email: string;
  password: string;
}

//export class EmailIdentityService<UserEntity extends UserInterface = UserInterface, Identity extends EmailIdentityInterface = EmailIdentityInterface> {

@Injectable()
export class AdminIdentityService<
  UserEntity extends UserInterface = UserInterface,
  Identity extends IdentityInterface = IdentityInterface,
> {

  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    private transferCoreService: TransferCoreService,
    private notificationService: NotificationService,
    @Inject(PasswordEncoderService)
    private readonly encoder: PasswordEncoderService
  ) { }



  async authenticate(
    input: AuthenticateInput,
  ): Promise<AuthUserEntity> {
    // const identity = (await this.identityProvider.retrieveIdentityByEmail(
    //   input.email,
    // )) as AuthUserEntity;

    const identity = await this.em.findOne(AuthUserEntity, {
      where: { email: input.email },
      relations: ['user']
    }) as AuthUserEntity
    if (!identity) {
      throw new BadRequestException('missing_identity');
    }
    console.log('identity', identity);
    const user = identity.user
    //  const user = identity
    console.log('user', user);
    if (!user) {
      throw new BadRequestException('missing_user');
    }
    if (
      this.encoder.verifyPassword(
        input.password,
        identity.password,
      )
    ) {
      // return null//
      return identity

      // return null
    } else {
      throw new BadRequestException("The credentials you entered don't match our records. Please try again");
    }
  }

  async me() {
    const ctx = getAppContextALS<AppRequestContext>();
    return ctx.authUser;
  }

  async reverseTransaction(trxnId: string) {
    const transactionDetails = await this.em.findOne(TransactionEntity, {
      where: { transactionId: trxnId },
    });
    if (transactionDetails == null) {
      return { status: "404", message: "Transaction not found" }
    }
    if (transactionDetails.transactionStatus == TRANSACTION_STATUS.REVERSED) {
      return { status: "404", message: "Transaction already reversed" }
    }
    const transferRequest = new TransferCoreDto();
    transferRequest.fromAccountId = transactionDetails.toAccountId;
    const userAuth = await this.em.findOne(AuthUserEntity, {
      where: { userId: transactionDetails.userId }
    })
    transferRequest.toAccountId = transactionDetails.fromAccountId;
    transferRequest.reference = "REV:" + transactionDetails.transactionId;
    let narration = `${transactionDetails.transactionType} Revervasal`;
    if (transactionDetails.narration) {
      narration = `${transactionDetails.narration}`
    }
    transferRequest.fromAccountNarration = 'REV:' + narration + "REF:" + transactionDetails.userRef;
    transferRequest.toAccountNarration = 'REV:' + narration + "REF:" + transactionDetails.userRef;
    transferRequest.amount = transactionDetails.amount;
    transactionDetails.transactionStatus = TRANSACTION_STATUS.REVERSED;
    console.log('The transfer log >>>', transferRequest);
    const transferResponse = await this.transferCoreService.transfer(transferRequest, transactionDetails);
    console.log('The transfer response >>>', transferResponse)
    if (transferResponse.statusCode == TRANSFER_STATUS_CODE.SUCCESS) {
      await this.notificationService.sendSms({
        to: userAuth.phone, sms: `Your withdrawal of GHS${transactionDetails.amount} has been reversed to your account.REF:${transferResponse.userRef}`
      })
      return { status: "00", message: "Transaction successfully reversed" }
    } else {
      return { status: transferResponse.statusCode, message: transferResponse.message }
    }
  }
}
