import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAccountTypeController } from './controllers/admin-account-type.controller';
import { AccountTypeEntity } from './entities/account-type.entity';
import { AccountEntity } from './entities/account.entity';
import { AccountTypeService } from './services/account-type.service';
import { UserAccountTypeController } from './controllers/user-account-type.controller';
import { AccountService } from './services/account.service';
import { WalletModule } from '../wallet/wallet.module';
import { AccountController } from './controllers/account.controller';
import { UserPinModule } from '../userpin/userpin.module';
import { CreateLedgerAccountCommand } from './commands/create-ledger-account.command';
import { AdminUserMigrationController } from './controllers/user-migration.controller';
import { AccountDuplicatePrimaryEntity } from './entities/account_duplicate_primary.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountTypeEntity, AccountEntity,AccountDuplicatePrimaryEntity]),
    WalletModule
  ],
  controllers: [
    UserAccountTypeController,
    AdminAccountTypeController,
    AccountController,
    AdminUserMigrationController
  ],
  providers: [AccountTypeService, AccountService, CreateLedgerAccountCommand],
  exports: [AccountService, AccountTypeService],
})
export class AccountModule { }
//account_transaction
//streak_entity
//file_entity
// user_pin
// saving_goal
// transaction,
// user_entity
//mandate_entity
