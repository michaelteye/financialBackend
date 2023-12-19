import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreakService } from "./service/streak.service";
import { UserPinService } from '../userpin/services/userpin.service';
import { StreakController } from "./controller/streak.controller";
import { HttpModule } from '@nestjs/axios';
import { TransactionService } from '../transactions/services/transaction.service';
import { PayloadTooLargeException } from '@nestjs/common';
import { PaymentMethodEntity } from '../main/entities/paymentmethod.entity';
import { AccountEntity } from '../account/entities/account.entity';
import { AccountService } from '../account/services/account.service';
import { TransferService } from '../transfers/services/transfer.service';
import { NotificationService } from '../notifications/services/notification.service';
import { AuthService } from '../auth/services/auth.service';
import { PasswordEncoderService } from '../auth/services/password-encorder.service';
import { TransferCoreService } from '../transfers/services/transfer.core.service';
import { UserService } from '../auth/services/user.service';
import { FileUploadService } from '../fileupload/services/fileupload.service';
import { FileUploadModule } from '../fileupload/fileupload.module';
import { FILE_UPLOAD_OPTIONS } from '../fileupload/uploadtypes/upload.type'; 
import { globalConfig } from '../../config/config';
import { ConfigType } from '@nestjs/config';
import { JwtManagerService } from '../auth/services/jwt-manager.service';
import { RefreshTokenEntity } from '../auth/entities/refresh-token.entity';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from '../shared/services/sms.service';
import { PhoneNumberService } from '../shared/services/phoneNumber.service';
import { FeeService } from '../transfers/services/fees.service';
import { IdentityProviderService } from '../auth/services/identity-provider.service';
import { EntityManager, Repository } from 'typeorm';
import { IdentityProviderServiceToken } from '../auth/interfaces/identity-provider.service.interface';
import { AuthUserEntity } from '../auth/entities/auth-user.entity';
import { UserProviderServiceToken } from '../auth/interfaces/user-identity-provider.service.interface';
import { UserIdentityProviderService } from '../auth/services/user-identity-provider.service';
import { SavingsGoalService } from '../savings-goal/services/savings-goal.service';
import { AccountTypeService } from '../account/services/account-type.service';
import { MandateService } from '../transactions/services/mandate.service';
import { AccountTypeEntity } from '../account/entities/account-type.entity';
import { MandateEntity } from '../transactions/entities/mandate.entity';
import { RabbitMQConnectionService } from '../events/services/rabbitmq-connection.service';
import { EventPublisherService } from '../events/services/event-publisher.service';



// import { AuthModule } from '../auth/auth.module';

export const Entities = [
    TransactionEntity, PaymentMethodEntity,AccountEntity,RefreshTokenEntity,AccountTypeEntity,MandateEntity
];

@Module({
    imports: [
        TypeOrmModule.forFeature(Entities),
        HttpModule,
        FileUploadModule
        
    ],
    controllers: [StreakController],
    providers:[StreakService,SmsService,PhoneNumberService,FeeService,IdentityProviderService,Repository,AuthService, TransactionService, UserPinService,UserService,FileUploadService,JwtManagerService,
        AccountService,JwtService, TransferService, NotificationService, AuthService, PasswordEncoderService,TransferCoreService,SavingsGoalService,AccountTypeService,MandateService,RabbitMQConnectionService,EventPublisherService,
        {
            provide: FILE_UPLOAD_OPTIONS,
            useFactory: (config: ConfigType<typeof globalConfig>) => {
              return {
                connectionString: config.azure.connectionString,
                containerName: config.azure.container,
              };
            },
            inject: [globalConfig.KEY],
          },
          {
            provide: IdentityProviderServiceToken,
            useFactory: (em: EntityManager) => {
              return new IdentityProviderService(
                em.getRepository(AuthUserEntity),
              );
            },
            inject: [EntityManager],
          },
          {
            provide: UserProviderServiceToken,
            useFactory: (em: EntityManager) => {
              return new UserIdentityProviderService(
                em.getRepository(AuthUserEntity),
              );
            },
            inject: [EntityManager],
          },],
    exports: [ TypeOrmModule.forFeature(Entities), StreakService]
})
export class StreakModule { }
