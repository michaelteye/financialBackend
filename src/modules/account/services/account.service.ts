import { Injectable, HttpException, Logger } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { SavingsGoalInputDto } from '../../savings-goal/dtos/savings-goal.dto';
import { WalletTypeEntity } from '../../wallet/entities/wallet.entity';
import { AppRequestContext } from '../../../utils/app-request.context';
import { getAppContextALS } from '../../../utils/context';
import { generateCode } from '../../../utils/shared';
import { EntityManager, Repository } from 'typeorm';
import { AccountEntity } from '../entities/account.entity';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { TransferStatus } from '../../transactions/entities/account-transaction.entity';
import { TRANSACTION_STATUS } from '../../enums/transaction.status';
import { SYSTEM_ACCOUNT } from '../../transfers/services/systemaccts.constants';
import { ReferralEntity } from '../../referrals/entities/referral.entity';
import e from 'express';

export type TransactionHistory = {
  amount: number;
  accountId?: string;
  narration?: string;
  transactionType: TRANSACTION_TYPE;
  userId?: string;
  initialBalance: number;
  currentBalance: number;
  debitCreditType?: TRANSACTION_TYPE;
  transactionStatus: TRANSACTION_STATUS;
  transferStatus: TransferStatus;
  reference: string;
};

@Injectable()
export class AccountService {
  private logger = new Logger('AccountService');
  constructor(@InjectEntityManager('default') private em: EntityManager) { }

  async mapAccountFromSavingsGoal(
    input: SavingsGoalInputDto,
  ): Promise<AccountEntity> {
    const ctx = getAppContextALS<AppRequestContext>();
    const account = new AccountEntity();
    account.name = input.name;
    account.accountTypeId = input.accountTypeId;
    account.userId = ctx.authUser.userId;
    account.accountNumber = '' + Number(generateCode(10));
    account.walletId = input.walletId ?? (await this.getDefaultWalletId());
    return account;
  }

  async getDefaultWalletId(): Promise<string> {
    return this.em
      .findOne(WalletTypeEntity, { where: { name: 'Local' } })
      .then((wallet) => wallet.id);
  }

  async getAccountbyType(type: string): Promise<AccountEntity> {
    //console.log("type",type)
    if (type === SYSTEM_ACCOUNT.DEPOSIT_WITHDRAWALS) {
      const account = await this.em.findOne(AccountEntity, {
        where: { alias: SYSTEM_ACCOUNT.DEPOSIT_WITHDRAWALS },
      });
      if (!account) {
        throw new HttpException(`Account with alias${type} not found`, 400);
      }
      return account;
    } else if (type === SYSTEM_ACCOUNT.EARLY_WITHDRAWAL_FEES) {
      const account = await this.em.findOne(AccountEntity, {
        where: { alias: SYSTEM_ACCOUNT.EARLY_WITHDRAWAL_FEES },
      });
      if (!account) {
        throw new HttpException(`Account with alias${type} not found`, 400);
      }
      return account;
    } else if (type === SYSTEM_ACCOUNT.MOMO_WITHDRAWAL_FEES) {
      const account = await this.em.findOne(AccountEntity, {
        where: { alias: SYSTEM_ACCOUNT.MOMO_WITHDRAWAL_FEES },
      });
      if (!account) {
        throw new HttpException(`Account with alias${type} not found`, 400);
      }

      return account;
    } else if (type === SYSTEM_ACCOUNT.STAFF_ALLOWANCES) {
      const account = await this.em.findOne(AccountEntity, {
        where: { alias: SYSTEM_ACCOUNT.STAFF_ALLOWANCES },
      });
      if (!account) {
        throw new HttpException(`Account with alias${type} not found`, 400);
      }
    } else if (type === SYSTEM_ACCOUNT.INTEREST_PAYMENTS) {
      const account = await this.em.findOne(AccountEntity, {
        where: { alias: SYSTEM_ACCOUNT.INTEREST_PAYMENTS },
      });
      if (!account) {
        throw new HttpException(`Account with alias${type} not found`, 400);
      }
      return account;
    } else {
      throw new HttpException(`Account with alias${type} not found`, 400);
    }
  }

  async getUserAccount(accountId: string): Promise<AccountEntity> {
    const account = await this.em.findOne(AccountEntity, {
      where: { id: accountId },
    });
    if (!account) {
      throw new HttpException(`Account with id ${accountId} not found`, 400);
    }
    return account;
  }

  async getUserPrimaryAccount(user: {
    userId?: string;
    accountId?: string;
  }): Promise<AccountEntity> {
    this.logger.debug('user', user);
    const account = await this.em.findOne(AccountEntity, {
      where: {
        userId: user.userId,
        name: 'Primary',
      },
    });
    console.log('The user primary account is >>', account);
    return account;
  }

  async getUserPrimaryAndOtherAccount(userId: string): Promise<any> {
    this.logger.debug('user', userId);

    const accounts = await this.em.find(AccountEntity, {
      where: { userId },
    });
    const accountIds = accounts.map((r) => r.userId);
    if (!accountIds.length) {
      throw new HttpException(`User records not found`, 400);
    }
    return accountIds;
  }

  async userHasEnoughBalance(userId: string, amount: number) {
    const account = await this.getUserPrimaryAccount({ userId });
    if (account) {
      if (Number(account.balance) >= Number(amount)) return true;
      return false;
    }
    return false;
  }

  async getUserReferral(userId: string) {
    const referral = await this.em.findOne(ReferralEntity, {
      where: { userId },
    })
    return referral;
  }

  async accountHasEnoughBalance(accountId: string, amount: number): Promise<boolean> {
    //get account type and its minimum balance and return true or false
    // let account = `select a.balance, t."minimumBalance" from account_entity a join account_type_entity t
    // on a."accountTypeId"=t."id" where a.id='${accountId}'`;
    let account = `SELECT 
                CASE 
                WHEN account_entity.balance >= ${amount} + MIN(account_type_entity."minimumBalance") THEN '00'
                ELSE '01'
                END as status
                FROM account_entity 
                JOIN account_type_entity 
                ON account_entity."accountTypeId" = account_type_entity.id
                WHERE account_entity.id = '${accountId}'
                GROUP BY account_entity.balance;`

    const query = await this.em.query(account);
    console.log('Query => ', account);
    console.log('Result => ', query[0]);
    console.log("@accountHasEnoughBalance")

    if (
      query[0].status == '00'
    ) {

      return true;
    }
    return false;
  }

  async getUserBalance(userId: string) {
    const account = await this.getUserPrimaryAccount({ userId });
    if (account) return Number(account.balance);
    return 0;
  }
}
