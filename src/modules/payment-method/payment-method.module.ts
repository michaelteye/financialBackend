import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentMethodController } from './controllers/payment-method.controller';
import { PaymentMethodService } from './services/payment-method.service';
import { MigrationService } from '../migration/services/migration.service';
import { AccountService } from '../account/services/account.service';
import { TransferCoreService } from '../transfers/services/transfer.core.service';
import { NotificationService } from '../notifications/services/notification.service';
import { HttpModule } from '@nestjs/axios';
import { PaymentMethodEntity } from '../main/entities/paymentmethod.entity';
import { AuthService } from '../auth/services/auth.service';


@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([PaymentMethodEntity])],
  providers: [PaymentMethodService],
  controllers: [

    PaymentMethodController,

  ],
  exports: [PaymentMethodService],
})
export class PaymentMethodModule { }
