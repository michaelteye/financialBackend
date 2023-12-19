import { Module } from '@nestjs/common';
// import { TransactionCronService } from './services/transactions.cron.service';
import { SavingGoalCronService } from './services/savings-goal.cron.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavingsGoalEntity } from '../savings-goal/entities/savings-goal.entity';
import { AccountEntity } from '../account/entities/account.entity';
import { NotificationService } from '../notifications/services/notification.service';
import { ScheduleModule } from '@nestjs/schedule';
import { connectionSource } from 'ormconfig';
import { DataSourceOptions, EntityManager } from 'typeorm';
import { AccountService } from '../account/services/account.service';
import { AuthModule } from '../auth/auth.module';
import { AccountModule } from '../account/account.module';
import { NotificationModule } from '../notifications/notification.module';
import { MainModule } from '../main/main.module';
import { MailModule } from '../mail/mail.module';
import { WalletModule } from '../wallet/wallet.module';
import { globalConfig } from '../../config/config';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { AppRequestContext } from '../../utils/app-request.context';
import { ConsoleModule } from 'nestjs-console';
import { RequestContextModule } from '@medibloc/nestjs-request-context';
import { ReferralModule } from '../referrals/referrals.module';
import { StreakModule } from '../streak/streak.module';
import { InvestmentModule } from '../investment/investment.module';
import { UssdApiModule } from '../ussdapi/ussdapi.module';
import { TransferModule } from '../transfers/transfer.module';
import { InvestmentEntity } from '../investment/entities/invest.entity';
import { UserPinModule } from '../userpin/userpin.module';
import { MigrationModule } from '../migration/migration.module';
import { FileUploadModule } from '../fileupload/fileupload.module';
import { SeederModule } from '../seeder/seeder.module';
import { TransactionModule } from '../transactions/transaction.module';
import { SavingsGoalModule } from '../savings-goal/savings-goal.module';
import { HttpModule } from '@nestjs/axios';
import { TransactionService } from '../transactions/services/transaction.service';
import { InterestPaymentCronService } from './services/interest-payment.cron.service';
import { DeactivateDormantAccountsCronService } from './services/deactivate-dormant-account.cron.service';
import { InterestPaymentService } from '../interest/services/interest-payment.service';
import { ReferrralCampaignCronService } from './services/referral-cashback.cron.service';
import { AutoDebitFromPrimaryCronService } from './services/auto-debit-primary-accounts.cron.service';
import { BoltReferrralCampaignCronService } from './services/bolt-referral-cashback.cron.service';
import { ReconcileAccountCronService } from './services/reconciliation.cron.service';

export const Entities = [
  SavingsGoalEntity,
  AccountEntity
];

@Module({
  imports: [
    ScheduleModule.forRoot(),
     // ScheduleModule.forRoot(),
     ConsoleModule,
     HttpModule,
     ConfigModule.forRoot({
       envFilePath: ['.env'],
       isGlobal: true,
       load: [globalConfig],
     }),
     TypeOrmModule.forRootAsync({
       useFactory: async () => (await connectionSource) as DataSourceOptions,
     }),
     RequestContextModule.forRoot({
       isGlobal: true,
       contextClass: AppRequestContext,
     }),
     MongooseModule.forRootAsync({
       useFactory: async (config: ConfigType<typeof globalConfig>) => {
         const parsed = new URL(config.mongo.uri);
         const baseUri = `${parsed.protocol}//${parsed.username}:${parsed.password}@${parsed.host}`;
         const opts = {
           uri: baseUri,
           dbName: 'bezosusuDBlive',
         } as MongooseModuleOptions;
         return opts;
       },
       inject: [globalConfig.KEY],
     }),
     AuthModule,
     MainModule,
     MailModule,
     AccountModule,
     WalletModule,
     SavingsGoalModule,
     TransactionModule,
     SeederModule,
     FileUploadModule,
     NotificationModule,
     MigrationModule,
     UserPinModule,
     InvestmentEntity,
     TransferModule,
     UssdApiModule,
     InvestmentModule,
     StreakModule,
     ReferralModule
  ],
  controllers: [],
  providers: [
    SavingGoalCronService, 
    NotificationService,
    AccountService,
    TransactionService,
    UserPinModule,
    InterestPaymentService,
    InterestPaymentCronService,
    DeactivateDormantAccountsCronService,
    ReferrralCampaignCronService,
    AutoDebitFromPrimaryCronService,
    BoltReferrralCampaignCronService,
    ReconcileAccountCronService
   // MonthlyDebitCronService
  ],
})
export class CronModule {}
