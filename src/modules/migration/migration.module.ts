import { NotificationService } from './../notifications/services/notification.service';
import { TransferService } from '../transfers/services/transfer.service';
import { TransferCoreService } from './../transfers/services/transfer.core.service';
import { AccountService } from '../account/services/account.service';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorEntity } from './entitites/error.entity';
import { MigrateProfileCommand } from './commands/migrate-profile.command';
import { MigrateTransactionPinCommand } from './commands/migrate-transactionpin.command';
import { MigrateAccountCommand } from './commands/migrate-account.command';
import { MigrateAccountTransactionCommand } from './commands/migrate-account-transactions';
import { MigrateInvestmentCommand } from './commands/migrate-investments';
import { MigrateDepositsCommand } from './commands/migrate-deposits.command';
import { MigrateWithdrawalsCommand } from './commands/migrate-withdrawals.command';
import { MigrationService } from './services/migration.service';
import { MigrateSavingInterestCommand } from './commands/migrate-saving-interest';
import { MigrateReferralsCommand } from './commands/migrate-account-referral';
import { MigrateReferredUsersCommand } from './commands/migrate-account-referred_users';
import { MigrateReferredCodeCommand } from './commands/migrate-account-referred_code';

import { PasswordEncoderService } from '../auth/services/password-encorder.service';
import { UserPinModule } from '../userpin/userpin.module';
import { MigrateGoalDescriptionCommand } from './commands/migrate-goal-descriptions';
import { MigrateProfilePicsCommand } from './commands/migrate-profile-pics';
import { MigrateAllowGoalWithdrawCommand } from './commands/migrate-allowgoaalwithdrawal.command';
import { MigrateAccountVolume2Command } from './commands/migrate-sv2.command';
import { MigrateStaffBalanceCommand } from './commands/migrate-staff.balance.command';
import { MigrateAccountV3Command } from './commands/migrate-account.command2';
import { MigrateMandateAutoDeductCommand } from './commands/migrate-cancel-autodeduct';
import { HttpRequestService } from '../shared/services/http.request.service';
import { HttpModule } from '@nestjs/axios';
import { MigrateAllUserDataCommand } from './commands/migrate-userdata-all';
import { FeeService } from '../transfers/services/fees.service';
import { MigrateMandatesCommand } from './commands/migrate-mandates.command';
import { MigrateAddDeductionCommand } from './commands/migrate-addDeduction';
import { MigrateInterestCommand } from './commands/migrate-interests';
import { MigrateAccountIdInSavingGoalCommand } from './commands/migrate-accountId-savings-goal';
import { MigrateInvestmentPrincipalPaymenCommand } from './commands/migrate-credit-interest-principal';
import { MigrateSignUpDateCommand } from './commands/migrate-signupdate.command';
import { MigrateRimBalancesCommand } from './commands/migrate-rimbalances.command';
import { MigrateGenerateReferralForExistingUsers } from './commands/migrate-gen-referral-existing-users';
import { MigrateAllSavingsGoalsCommand } from './commands/migrate-all-savingsgoal.command';
import { TestRimBalancesCommand } from './commands/migrate-test-rim.command';
import { MigrateRoleToStaffCommand } from './commands/migrate-role-to-staff.command';
import { MigrateReverseWithdrawalCommand } from './commands/migrate-reverse-withdrawal';
import { UserPinService } from '../userpin/services/userpin.service';
import { UserPinEntity } from '../userpin/entities/userpin.entity';
import { TransactionModule } from '../transactions/transaction.module';
import { MigrateFromGoogleCloudToAzureCommand } from './commands/migrate-files-from-google-to-azure';
import { MigrateInterestJanuaryFebruaryCommand } from './commands/migrate-pay-interest-jan-feb';
import { MigrateDuplicatePrimaryCommand } from './commands/migrate-delete-duplicate-primary';
import { MigrateTestDailyInterestPaymentCommand } from './commands/migrate-test-daily-interest-payment';
import { InterestPaymentService } from '../interest/services/interest-payment.service';
import { MigrateUsersWithoutPinCommand } from './commands/migrate-user-without-pin.command';
import { MigrateTestDailyInterestPaymentBezoLockCommand } from './commands/migrate-test-daily-interest-payment-bezolock';
import { MigrateTestDailyInterestPaymentMonthCommand } from './commands/migrate-test-daily-interest-payment-pay-month';
import { MigrateTestDailyInterestPaymentSavingBeforeFebruaryCommand } from './commands/migrate-test-daily-interest-payment-saving-before-february';
import { MigrateDeactivateDormantAccountsCommand } from './commands/migrate-deactivate-dormant-accounts.command';
import { MigrateTestPhoneNumbersCommand } from './commands/migrate-testphonenumbers.command';
import { PhoneNumberService } from '../shared/services/phoneNumber.service';
import { MigrateReferralCashbackCommand } from './commands/migrate-referral-cashback.command';
import { MigratePayUserCashbackFrom28AprilToMay8Command } from './commands/migrate-cashback-from-april-may';
import { MigrateDeleteDuplicateAuthUserUserEntityPrimaryCommand } from './commands/migrate-delete-user-from-auth_user_and_user_entity.command';
import { MigrateBoltDiscountCodesAccountsCommand } from './commands/migrate-add-bolt-discount-codes.command';
// import { TransferCoreService } from '../transfers/services/transfer.core.service';
// import { TransferService } from '../transfers/services/transfer.service';
// import { AccountService } from '../account/services/account.service';
// import { NotificationService } from '../notifications/services/notification.service';



@Module({
  imports: [TypeOrmModule.forFeature([ErrorEntity,UserPinEntity]), AuthModule, UserPinModule, HttpModule, TransactionModule],
  controllers: [],
  providers: [
    // commands
    MigrateProfileCommand,
    MigrateTransactionPinCommand,
    MigrateAccountCommand,
    MigrateProfileCommand,
    MigrateAccountTransactionCommand,
    MigrateInvestmentCommand,
    MigrateDepositsCommand,
    MigrateWithdrawalsCommand,
    MigrateInterestCommand,
    MigrateGoalDescriptionCommand,
    MigrateProfilePicsCommand,
    MigrateAllowGoalWithdrawCommand,
    MigrateAccountVolume2Command,
    MigrateStaffBalanceCommand,
    MigrateAccountV3Command,
    MigrateGoalDescriptionCommand,
    MigrateMandateAutoDeductCommand,
    MigrateMandatesCommand,
    MigrateAllUserDataCommand,
    MigrateReferralsCommand,
    MigrateAddDeductionCommand,
    MigrateSavingInterestCommand,
    MigrateAccountIdInSavingGoalCommand,
    MigrateInvestmentPrincipalPaymenCommand,
    MigrateRimBalancesCommand,
    MigrateSignUpDateCommand,
    MigrateReferredUsersCommand,
    MigrateGenerateReferralForExistingUsers,
    MigrateAllSavingsGoalsCommand,
    TestRimBalancesCommand,
    MigrateRoleToStaffCommand,
    MigrateReverseWithdrawalCommand,
    MigrateFromGoogleCloudToAzureCommand,
    MigrateReferredCodeCommand,

    MigrateInterestJanuaryFebruaryCommand,
    MigrateDuplicatePrimaryCommand,
    MigrateTestDailyInterestPaymentCommand,
    MigrateUsersWithoutPinCommand,
    MigrateTestDailyInterestPaymentBezoLockCommand,
    MigrateTestDailyInterestPaymentMonthCommand,
    MigrateTestDailyInterestPaymentSavingBeforeFebruaryCommand,
    MigrateDeactivateDormantAccountsCommand,
    MigrateTestPhoneNumbersCommand,
    MigrateReferralCashbackCommand,
    MigrateReferredCodeCommand,
    MigratePayUserCashbackFrom28AprilToMay8Command,
    MigrateDeleteDuplicateAuthUserUserEntityPrimaryCommand,
    MigrateBoltDiscountCodesAccountsCommand,
    //services
    HttpRequestService,
    MigrationService,
    UserPinService,
    PasswordEncoderService,
    NotificationService,
    TransferCoreService,
    FeeService,
    TransferService,
    AccountService,
    NotificationService,
    InterestPaymentService,
    PhoneNumberService

  ],
})
export class MigrationModule { }
