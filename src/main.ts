import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AuthModule } from './modules/auth/auth.module';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { MainModule } from './modules/main/main.module';
import { AccountModule } from './modules/account/account.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { SavingsGoalModule } from './modules/savings-goal/savings-goal.module';
import { TransactionModule } from './modules/transactions/transaction.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { StreakModule } from './modules/streak/streak.module';
import { UserPinModule } from './modules/userpin/userpin.module';
import { UssdApiModule } from './modules/ussdapi/ussdapi.module';
import { TransferModule } from './modules/transfers/transfer.module';
import { InvestmentModule } from './modules/investment/investment.module';
import { MyLoggerService } from './logger.service';
import { ReferralModule } from './modules/referrals/referrals.module';
import { NextOfKinModule } from './modules/nextofkin/nextofkin.module';
import { PaymentMethodModule } from './modules/payment-method/payment-method.module';
import { SurveyModule } from './modules/survey/survey.module';
import { VasModule } from './modules/vas/vas.module';
import { GroupModule } from './modules/group/group.module';
import { AdminModule } from './modules/admin/admin.module';
// import { EventsModule } from './modules/events/events.module';
import { OrchidModule } from './modules/orchid/orchid.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: /.*/,
  });
  app.useLogger(new MyLoggerService('bezoSusuCore'))
  app.useGlobalPipes(new ValidationPipe());
  app.getHttpServer().setTimeout(120000);
  app.setGlobalPrefix('api/v2');


  const config = new DocumentBuilder()
    .setTitle('BEZOMONEY API Platform')
    .setDescription('Description')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    include: [
      MainModule,
      AuthModule,
      AccountModule,
      WalletModule,
      SavingsGoalModule,
      TransactionModule,
      NotificationModule,
      UserPinModule,
      TransferModule,
      UssdApiModule,
      InvestmentModule,
      StreakModule,
      ReferralModule,
      NextOfKinModule,
      PaymentMethodModule,
      SurveyModule,
      VasModule,
      GroupModule,
      AdminModule,
     // EventsModule,
     OrchidModule
    ],
  });
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 4200);
}
bootstrap();
