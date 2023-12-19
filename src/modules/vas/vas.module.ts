import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VasController } from './controllers/vas.controller';

import { HttpModule } from '@nestjs/axios';
import { HttpRequestService } from '../shared/services/http.request.service';

import { NotificationService } from '../notifications/services/notification.service';


import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BillerEntity } from './entities/biller.entity';
import { BillerFormFieldsEntity } from './entities/billers_form_fields.entity';
import { VasService } from './services/vas.service';
import { UserPinModule } from '../userpin/userpin.module';
import { AccountModule } from '../account/account.module';
import { AccountService } from '../account/services/account.service';
import { TransferService } from '../transfers/services/transfer.service';
import { TransferCoreService } from '../transfers/services/transfer.core.service';
import { AuthModule } from '../auth/auth.module';
import { FileUploadModule } from '../fileupload/fileupload.module';
import { FeeService } from '../transfers/services/fees.service';
import { UserService } from '../auth/services/user.service';
import { APP_GUARD } from '@nestjs/core';
import { SharedModule } from '../shared/shared.module';
import { TransferModule } from '../transfers/transfer.module';
import { PaymentMethodModule } from '../payment-method/payment-method.module';
import { TransactionEntity } from '../transactions/entities/transaction.entity';
import { PaymentMethodEntity } from '../main/entities/paymentmethod.entity';
import { AccountTransactionEntity } from '../transactions/entities/account-transaction.entity';
import { AccountEntity } from '../account/entities/account.entity';
import { TransactionService } from '../transactions/services/transaction.service';
import { TransactionModule } from '../transactions/transaction.module';
import { StreakService } from '../streak/service/streak.service';

export const Entities = [
  BillerEntity,
  BillerFormFieldsEntity,
  TransactionEntity,
  PaymentMethodEntity,
  AccountTransactionEntity,
  AccountEntity,
 
  

];

@Module({
  imports: [
    ThrottlerModule.forRoot(),
    TypeOrmModule.forFeature(Entities),
    HttpModule,
    AuthModule,
    UserPinModule,
    SharedModule,

    AccountModule,
    TransferModule,
    FileUploadModule,
    PaymentMethodModule,
    TransactionModule
  
  ],
  controllers: [VasController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    VasService, 
    HttpRequestService, 
    TransferService, 
    TransferCoreService, 
    FeeService, 
    AccountService,
    StreakService,
  //  TransactionHistoryService, 
    UserService, 
    NotificationService, 
    TransactionService
  ],
  exports: [TransferService],
})
export class VasModule { }
