import { AdminAuthController } from './controllers/admin.controller';

import { Module } from '@nestjs/common';
import { ApiKeyIdentityEntity } from './entities/api-key-identity.entity';
import { MixedAuthGuard } from './guards/mixed-auth.guard';
import { RoleAuthGuard } from './guards/role-auth.guard';

import { ConfigType } from '@nestjs/config';
import { globalConfig } from '../../config/config';
import { JwtStrategy } from './guards/jwt.strategy';
import { UserProviderServiceToken } from './interfaces/user-identity-provider.service.interface';
import { UserIdentityProviderService } from './services/user-identity-provider.service';
import { PasswordEncoderService } from './services/password-encorder.service';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { JwtManagerService } from './services/jwt-manager.service';
import { AdminIdentityService } from './services/admin.service';
import { AuthUserEntity } from './entities/auth-user.entity';

import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { OtpEntity } from './entities/otp.entity';
import { OtpController } from './controllers/otp.controller';
import { SmsService } from '../shared/services/sms.service';
import { HttpModule } from '@nestjs/axios';
import { FileUploadModule } from '../fileupload/fileupload.module';
import { UserController } from './controllers/user.controller';
import { EncryptionService } from './services/encryption.service';
import { UserService } from './services/user.service';
import { CreateAdminCommand } from './commands/create-admin.command';
import { UserPinModule } from '../userpin/userpin.module';
import { IdentityProviderService } from './services/identity-provider.service';
import { IdentityProviderServiceToken } from './interfaces/identity-provider.service.interface';
import { SharedModule } from '../shared/shared.module';
import { PhoneNumberService } from '../shared/services/phoneNumber.service';
import { NotificationService } from '../notifications/services/notification.service';
import { AccountModule } from '../account/account.module';
import { AccountService } from '../account/services/account.service';
import { FileUploadService } from '../fileupload/services/fileupload.service';
import { TransferCoreService } from '../transfers/services/transfer.core.service';
import { TransferModule } from '../transfers/transfer.module';
import { FeeService } from '../transfers/services/fees.service';
import { TransactionService } from '../transactions/services/transaction.service';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { PaymentMethodModule } from '../payment-method/payment-method.module';
import { PaymentMethodEntity } from '../main/entities/paymentmethod.entity';
import { AccountEntity } from '../account/entities/account.entity';
import { UserPinService } from '../userpin/services/userpin.service';
import { TransferService } from '../transfers/services/transfer.service';
import { StreakService } from '../streak/service/streak.service';
import { TransactionModule } from '../transactions/transaction.module';
import { SavingsGoalService } from '../savings-goal/services/savings-goal.service';
import { MandateService } from '../transactions/services/mandate.service';
import { MandateEntity } from '../transactions/entities/mandate.entity';
import { EventPublisherService } from '../events/services/event-publisher.service';
import { RabbitMQConnectionService } from '../events/services/rabbitmq-connection.service';

@Module({
  imports: [
    HttpModule,
    
    JwtModule.registerAsync({
      inject: [globalConfig.KEY],
      useFactory: async (cfg: ConfigType<typeof globalConfig>) => {
        return {
          secret: cfg.auth.jwt.secret,
          signOptions: {
            expiresIn: cfg.auth.accessToken.expiresIn,
          },
        };
      },
    }),
    TypeOrmModule.forFeature([
      ApiKeyIdentityEntity,
      RefreshTokenEntity,
      AuthUserEntity,
      OtpEntity,
      TransactionEntity,
      PaymentMethodEntity,
      AccountEntity,
      MandateEntity
    ]),
    FileUploadModule,
    // TransferModule,
    SharedModule,
    AccountModule,
    PaymentMethodModule,
    
    // TransactionModule
  
  ],
  controllers: [
    AdminAuthController,
    AuthController,
    UserController,
    OtpController,
  ],
  providers: [
    AuthService,
    AdminIdentityService,
    JwtManagerService,
    PasswordEncoderService,
    SmsService,
    EncryptionService,
    UserService,
    PhoneNumberService,
    RoleAuthGuard,
    MixedAuthGuard,
    // strategy
    JwtStrategy,
    // commands
    NotificationService,
    CreateAdminCommand,
    TransferCoreService,
    FeeService,
    StreakService,
    TransferService,
    UserPinService,
    TransactionService,
    SavingsGoalService,
    MandateService,
    EventPublisherService,
    RabbitMQConnectionService,

    // {
    //   provide: EmailIdentityProviderServiceToken,
    //   useFactory: (em: EntityManager) => {
    //     return new EmailIdentityServiceProvider(
    //       em.getRepository(EmailIdentityEntity),
    //     );
    //   },
    //   inject: [EntityManager],
    // },
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
    },
  ],
  exports: [
    // services
    AuthService,
    PasswordEncoderService,
    IdentityProviderServiceToken,
    UserProviderServiceToken,
    JwtManagerService,
    RoleAuthGuard,
    MixedAuthGuard,
    UserService,
    UserPinService,
    // strategy
    JwtStrategy
  ],
})
export class AuthModule {

}
