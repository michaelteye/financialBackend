import { Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { AccountEntity } from '../../account/entities/account.entity';
import { EntityManager } from 'typeorm';
import { uuid } from 'uuidv4';
import { TransferCoreDto } from '../dto/TransferCoreDto';
import { TransferCoreResponseDto } from '../dto/TransferCoreResponseDto';
import { TRANSFER_STATUS_CODE } from '../enums/transferstatus.enum';
import TRANSFER_STATUS_MESSAGE from '../enums/transferstatus.message';
import { gen } from 'n-digit-token';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import Decimal from 'decimal.js';
import { TRANSACTION_STATUS } from '../../enums/transaction.status';
import { TransactionEntity } from '../../transactions/entities/transaction.entity';
import { FeeService } from './fees.service';
import { FEE_TYPE } from '../../enums/fee-type.enum';
import { RimEntity } from '../../account/entities/rim.entity';
import { getAppContextALS } from '../../../utils/context';
import { AppRequestContext } from '../../../utils/app-request.context';


@Injectable()
export class TransferCoreService {
  constructor(
    @InjectEntityManager('default') private em: EntityManager,
    private feeService: FeeService,
  ) { }

  public buildResponseMessage(
    statusCode,
    trxnRef?,
    userRef?,
  ): TransferCoreResponseDto {
    const transferResponse = new TransferCoreResponseDto();
    transferResponse.statusCode = statusCode;
    transferResponse.message =
      TRANSFER_STATUS_MESSAGE[transferResponse.statusCode];
    transferResponse.trxnRef = trxnRef || '';
    transferResponse.userRef = userRef || '';
    console.log('The transfer response >>>', transferResponse);
    return transferResponse;
  }

  private accountHasSufficientBalance(
    account: AccountEntity,
    transferAmount: number,
  ): boolean {
    const balance = new Decimal(account.balance);
    const amount = new Decimal(transferAmount);
    console.log('The account balance >>', balance.toFixed(2));
    console.log('The withdrawing amount is >>', amount.toFixed(2));
    return balance.greaterThanOrEqualTo(amount);
  }

  private async writeTransaction(
    fromAccount: AccountEntity,
    toAccount: AccountEntity,
    input: TransferCoreDto,
  ) {
    const transaction = new TransactionEntity();
    transaction.amount = Number(input.amount);
    transaction.transactionType = TRANSACTION_TYPE.TRANSFER;
    transaction.transactionId = input.reference;
    transaction.fromAccountId = fromAccount.id;
    transaction.toAccountId = toAccount.id;
    transaction.userId = fromAccount.userId;
    transaction.transactionStatus = TRANSACTION_STATUS.SUCCESS;
    if (input.fromAccountNarration === input.toAccountNarration) {
      transaction.narration = `${input.fromAccountNarration}`;
    } else {
      if (input.fromAccountNarration && input.fromAccountNarration !== '') {
        transaction.narration = `${input.fromAccountNarration}`;
      }
      if (input.toAccountNarration != 'undefined' && input.toAccountNarration) {
        transaction.narration += `:${input.toAccountNarration}`;
      }
    }
    transaction.userRef = '' + gen(5);
    if (input.reference == null || input.reference == '') {
      transaction.transactionId = uuid();
    }
    transaction.transactionData = input;
    const savedTransaction = await this.em.save(transaction);
    return savedTransaction;
  }

  /**
   * Transfer Method for account to account transfer takes into account early withdrawals charges
   * and debits charges
   * @param input
   * Cha
   * @param transaction
   * @returns TransferCoreResponseDto
   */
  async transfer(
    input: TransferCoreDto,
    transaction?: TransactionEntity,
  ): Promise<TransferCoreResponseDto> {
    const fromAccount = await this.em.findOne(AccountEntity, {
      where: { id: input.fromAccountId },
    });
    const toAccount = await this.em.findOne(AccountEntity, {
      where: { id: input.toAccountId },
    });
    if (!toAccount) {
      return this.buildResponseMessage(TRANSFER_STATUS_CODE.ACCOUNT_NOT_FOUND);
    }
    if (!fromAccount) {
      return this.buildResponseMessage(TRANSFER_STATUS_CODE.ACCOUNT_NOT_FOUND);
    }
    if (!toAccount.allowDeposit) {
      console.log('Deposit not Allowed for ', toAccount);
      return this.buildResponseMessage(
        TRANSFER_STATUS_CODE.DEPOSIT_NOT_ALLOWED,
      );
    }
    let withDrawalMode = 'not_allowed';

    if (fromAccount.allowWithdrawal===true && fromAccount.allowWithdrawalWithFees==false) {
      withDrawalMode = 'without_fees';
    } else if (fromAccount.allowWithdrawalWithFees===true && fromAccount.allowWithdrawal===true) {
      withDrawalMode = 'with_fees';
    }else if(fromAccount.allowWithdrawal===false){
      withDrawalMode = 'not_allowed';
    }
    let accountBalanceSufficient = false;
    let deductFees = false;
    let feeTransfer: TransferCoreDto;

    console.log("withDrawalMode>>>",withDrawalMode)

    switch (withDrawalMode) {
      case 'not_allowed': {
        return this.buildResponseMessage(
          TRANSFER_STATUS_CODE.WITHDRAWAL_NOT_ALLOWED,
        );
        break;
      }
      case 'with_fees': {
        feeTransfer = await this.feeService.buildFeeTransfer(
          FEE_TYPE.EARLY_WITHDRAWAL,
          input,
        );
        let feePlusAmount =
          Number((await feeTransfer).amount) + Number(input.amount);

        if (
          await this.accountHasSufficientBalance(fromAccount, feePlusAmount)
        ) {
          accountBalanceSufficient = true;
          deductFees = true;
          
        } else {
          accountBalanceSufficient = false;
        }
        break;
      }
      case 'without_fees': {
        if (this.accountHasSufficientBalance(fromAccount, input.amount)) {
          accountBalanceSufficient = true;
        } else {
          accountBalanceSufficient = false;
        }
      }
    }
    if (accountBalanceSufficient || fromAccount.canOverDraw) {
      let transferResponse = await this.executTransfer(
        fromAccount,
        toAccount,
        input,
        transaction,
      );
      if (transferResponse.statusCode == TRANSFER_STATUS_CODE.SUCCESS) {
        console.log('Should Deduct Fees', deductFees);
        if (deductFees) {
          let feeAccount = await this.em.findOne(AccountEntity, {
            where: { id: feeTransfer.toAccountId },
          });
          transferResponse = await this.executTransfer(
            fromAccount,
            feeAccount,
            feeTransfer,
            null,
          );
        }
      }
      return transferResponse;
    } else {
      if (transaction) {
        transaction.transactionStatus = TRANSACTION_STATUS.FAILED;
      }
      return this.buildResponseMessage(
        TRANSFER_STATUS_CODE.INSUFFICIENT_BALANCE,
      );
    }
  }

  /**
   * Transfer Method used for charges
   * @param input
   * Cha
   * @param transaction
   * @returns TransferCoreResponseDto
   */
  async chargeTransfer(
    input: TransferCoreDto,
    transaction?: TransactionEntity,
  ): Promise<TransferCoreResponseDto> {
    const fromAccount = await this.em.findOne(AccountEntity, {
      where: { id: input.fromAccountId },
    });
    const toAccount = await this.em.findOne(AccountEntity, {
      where: { id: input.toAccountId },
    });
    if (!toAccount) {
      return this.buildResponseMessage(TRANSFER_STATUS_CODE.ACCOUNT_NOT_FOUND);
    }
    if (!fromAccount) {
      return this.buildResponseMessage(TRANSFER_STATUS_CODE.ACCOUNT_NOT_FOUND);
    }
    if (!toAccount.allowDeposit) {
      return this.buildResponseMessage(
        TRANSFER_STATUS_CODE.DEPOSIT_NOT_ALLOWED,
      );
    }
    if (!fromAccount.allowWithdrawal && !fromAccount.allowWithdrawalWithFees) {
      return this.buildResponseMessage(
        TRANSFER_STATUS_CODE.WITHDRAWAL_NOT_ALLOWED,
      );
    }
    let accountBalanceSufficient = false;
    if (this.accountHasSufficientBalance(fromAccount, input.amount)) {
      accountBalanceSufficient = true;
    } else {
      accountBalanceSufficient = false;
    }
    if (accountBalanceSufficient || fromAccount.canOverDraw) {
      let transferResponse = await this.executTransfer(
        fromAccount,
        toAccount,
        input,
        transaction,
      );
      return transferResponse;
    } else {
      if (transaction) {
        transaction.transactionStatus = TRANSACTION_STATUS.FAILED;
      }
      return this.buildResponseMessage(
        TRANSFER_STATUS_CODE.INSUFFICIENT_BALANCE,
      );
    }
  }

  private async executTransfer(
    fromAccount: AccountEntity,
    toAccount: AccountEntity,
    input: TransferCoreDto,
    transaction?: TransactionEntity,
  ): Promise<TransferCoreResponseDto> {
    if (transaction) {
      transaction.amount = Number(input.amount);
      transaction.fromAccountId = fromAccount.id;
      transaction.toAccountId = toAccount.id;
      if (!transaction.userId) {
        transaction.userId = fromAccount.userId;
      }
      if (!transaction.transactionStatus) {
        transaction.transactionStatus = TRANSACTION_STATUS.SUCCESS;
      }
      if (input.fromAccountNarration === input.toAccountNarration) {
        transaction.narration = `${input.fromAccountNarration}`;
      } else {
        if (input.fromAccountNarration && input.fromAccountNarration !== '') {
          transaction.narration = `${input.fromAccountNarration}`;
        }
        if (
          input.toAccountNarration != 'undefined' &&
          input.toAccountNarration
        ) {
          transaction.narration += `:${input.toAccountNarration}`;
        }
      }
      if (!transaction.userRef) {
        transaction.userRef = '' + gen(5);
      }
      if (!input.reference || input.reference == '') {
        transaction.transactionId = uuid();
      }
      console.log('transaction.transactionId here', transaction);
      transaction.transactionData = input;
      await this.em.save(transaction);
    } else {
      transaction = await this.writeTransaction(fromAccount, toAccount, input);
      transaction.platform = input.channel;
    }

    let execResult = await this.executeTransferTransaction(
      fromAccount.id,
      toAccount.id,
      transaction.amount,
      transaction.transactionType,
      transaction.senderPhone,
      input.reference,
      transaction.transactionId,
      transaction.userRef,
      input.toAccountNarration,
      input.fromAccountNarration,
    );
    console.log('fromAccount.id', fromAccount.id, 'toAccount.id', toAccount.id);
    if (execResult === 0) {
      await this.updateRimBalances(fromAccount.userId, toAccount.userId);
      return this.buildResponseMessage(
        TRANSFER_STATUS_CODE.SUCCESS,
        transaction.transactionId,
        transaction.userRef,
      );
    } else {
      return this.buildResponseMessage(
        TRANSFER_STATUS_CODE.ERROR,
        transaction.transactionId,
        transaction.userRef,
      );
    }
  }

  
  private async updateRimBalances(
    fromAccount: string,
    toAccount: string,
  ): Promise<void> {
    const ctx = getAppContextALS<AppRequestContext>();

    console.log('ctx >>', ctx);
    const queryFromAccountBalances = `SELECT 
      SUM(CASE WHEN name = 'Primary' THEN balance ELSE 0 END) AS "withPrimary",
      SUM(CASE WHEN name != 'Primary' THEN balance ELSE 0 END) AS "withoutPrimary" 
      FROM public.account_entity WHERE "userId" = '${fromAccount}';`;

    const result = await this.em.query(queryFromAccountBalances);
    console.log('resultFrom', result);

    const checkExistenceFromAccount = await this.em.findOne(RimEntity, {
      where: { userId: fromAccount },
    });
    if (checkExistenceFromAccount) {
      console.log('checkExistenceFromAccount', checkExistenceFromAccount);
      // checkExistence
      checkExistenceFromAccount.totalAccountsBalance =
        Number(result[0].withPrimary) + Number(result[0].withoutPrimary);
      checkExistenceFromAccount.totalSavingsGoalBalance =
        result[0].withoutPrimary;
      checkExistenceFromAccount.createdAt = new Date();
      checkExistenceFromAccount.updatedAt = new Date();

      await this.em.save(checkExistenceFromAccount);
    } else {
      let newRim = new RimEntity();
      newRim.totalAccountsBalance = Number(result[0].withPrimary) + Number(result[0].withoutPrimary);
      newRim.totalSavingsGoalBalance = result[0].withoutPrimary;
      newRim.createdAt = new Date();
      newRim.updatedAt = new Date();
      newRim.userId = fromAccount;
      await this.em.save(newRim);
    }

    ////// To ACCOUNT

    const queryToAccountBalances = ` SELECT 
      SUM(CASE WHEN name = 'Primary' THEN balance ELSE 0 END) AS "withPrimary",
      SUM(CASE WHEN name != 'Primary' THEN balance ELSE 0 END) AS "withoutPrimary"
      FROM public.account_entity
      WHERE "userId" = '${toAccount}';`;
    const resultToAccount = await this.em.query(queryToAccountBalances);
    console.log('resultToAccount', resultToAccount);

    const checkExistenceToAccount = await this.em.findOne(RimEntity, {
      where: { userId: toAccount },
    });

    if (checkExistenceToAccount) {
      console.log('checkExistenceToAccount', checkExistenceToAccount);
      checkExistenceToAccount.totalAccountsBalance = Number(resultToAccount[0].withPrimary) + Number(resultToAccount[0].withoutPrimary);
      checkExistenceToAccount.totalSavingsGoalBalance =resultToAccount[0].withoutPrimary;
      checkExistenceToAccount.createdAt = new Date();
      checkExistenceToAccount.updatedAt = new Date();
      checkExistenceToAccount.userId = toAccount;
      await this.em.save(checkExistenceToAccount);
    } else {
      let newRimToAccount = new RimEntity();
      newRimToAccount.totalAccountsBalance =
        Number(resultToAccount[0].withPrimary) +
        Number(resultToAccount[0].withoutPrimary);
      newRimToAccount.totalSavingsGoalBalance =
        resultToAccount[0].withoutPrimary;
      newRimToAccount.createdAt = new Date();
      newRimToAccount.updatedAt = new Date();
      newRimToAccount.userId = toAccount;
      await this.em.save(newRimToAccount);
    }
  }


 

private  escapeSqlString(value: string): string {
  const escapedValue = value.replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/'/g, "''") // Escape single quotes
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\0/g, '\\0') // Escape null characters
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r') // Escape carriage returns
    .replace(/\t/g, '\\t') // Escape tabs
    .replace(/\x1a/g, '\\Z'); // Escape Ctrl+Z
  return `'${escapedValue}'`; // Surround the escaped value with single quotes
}
 


  async executeTransferTransaction(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    transactionType: string,
    phone: string,
    reference: string,
    transactionId: string,
    userRef: string,
    creditNarration: string,
    debitNarration: string,
  ): Promise<number> {

  if(creditNarration){
    creditNarration = this.escapeSqlString(creditNarration);
  }
  if(debitNarration){
    debitNarration = this.escapeSqlString(debitNarration);
  }
  if(phone){
    phone = this.escapeSqlString(phone);
  }
   

    let sqlQuery = `DO $$
DECLARE fromAccountId uuid;
    toAccountId uuid;
    amount REAL;
    transactionType VARCHAR(20);
  phone VARCHAR(20);
  reference VARCHAR(200);
  transactionId VARCHAR(200);
  userRef VARCHAR(200);
  creditNarration VARCHAR(400);
  debitNarration VARCHAR(400);
  initialBalance REAL;
  currentBalance REAL;
  statusCode INT;
BEGIN

SELECT '${fromAccountId}' INTO fromAccountId;
SELECT '${toAccountId}' INTO toAccountId;
SELECT ${amount} INTO amount;
SELECT '${transactionType}' INTO transactionType;
SELECT ${phone} INTO phone;
SELECT '${reference}' INTO reference;
SELECT '${transactionId}' INTO transactionId;
SELECT '${userRef}' INTO userRef;
SELECT ${creditNarration} INTO creditNarration;
SELECT ${debitNarration} INTO debitNarration;

--writing credits--
SELECT balance INTO initialBalance FROM account_entity WHERE id = toAccountId;
UPDATE account_entity SET balance = balance + amount WHERE id = toAccountId;
SELECT balance INTO currentBalance FROM account_entity WHERE id = toAccountId;
INSERT INTO public.account_transaction_entity(
	 "accountId", "referenceId", phone,  amount, "initialBalance", 
	"currentBalance", "transactionType", "transactionStatus", "transactionId", narration, 
	"userRef", "createdAt", "updatedAt")
	VALUES (toAccountId, reference, phone,amount, initialBalance, currentBalance,'CREDIT' ,'SUCCESS', 
			transactionId, creditNarration, userRef, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
--writing debits--
SELECT balance INTO initialBalance FROM account_entity WHERE id = fromAccountId;
UPDATE account_entity SET balance = balance - amount WHERE id = fromAccountId;
SELECT balance INTO currentBalance FROM account_entity WHERE id = fromAccountId;
INSERT INTO public.account_transaction_entity(
	 "accountId", "referenceId", phone,  amount, "initialBalance", 
	"currentBalance", "transactionType", "transactionStatus", "transactionId", narration, 
	"userRef", "createdAt", "updatedAt")
	VALUES (fromAccountId, reference, phone,amount, initialBalance, currentBalance,'DEBIT' ,'SUCCESS', 
			transactionId, debitNarration, userRef, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
COMMIT;
END $$;
`;
    console.log('sqlQuery', sqlQuery);
    try {
      const result = await this.em.query(sqlQuery);
      console.log('Final Transaction hit ', result);
      return 0;
    } catch (error) {
      console.log("error", error);
      return -1;
    }
  }
}
