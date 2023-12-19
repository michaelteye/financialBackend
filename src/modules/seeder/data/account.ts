import { ACCOUNT_TYPE_CATEGORY } from '../../main/entities/enums/accounttypecategory.enum';
import { AccountTypeEntity } from '../../account/entities/account-type.entity';
import { uuid } from 'uuidv4';
import { AccountEntity } from '../../account/entities/account.entity';
import { WalletTypeEntity } from '../../wallet/entities/wallet.entity';
import { SYSTEM_ACCOUNT_TYPE } from '../../transfers/services/systemaccts.constants';
import { FeesEntity } from '../../transfers/entities/fees.entity';
import { FEE_FORMAT } from '../../enums/fee-format.enum';
import { FEE_TYPE } from '../../enums/fee-type.enum';
import { UserLevelEntity } from '../../main/entities/user-level.entity';
import { LEVEL } from '../../auth/entities/enums/level.enum';
import { INTEREST_TYPE } from '../../interest/enums/interest-type.enum';
import { INTEREST_FORMAT } from '../../interest/enums/interest-format.enum';
import { InterestEntity } from '../../interest/entities/interest.entity';

export const accountTypeData: AccountTypeEntity[] = [
  {
    id: '57301e10-73f0-4b22-b605-e007caa0ab01',
    name: 'Primary',
    alias: "primary",
    description: "Bezo User Primary Account",
    accountTypeCategory: ACCOUNT_TYPE_CATEGORY.user_account,
    allowWithdrawal: true,
    allowWithdrawalWithFees: false,
    allowDeposit: true,
    canOverDraw: false
  },
  {
    id: '4d912996-e216-4d26-8b86-da7070893836',
    name: 'Investment',
    alias: "investment",
    description: "Investment Product Account",
    accountTypeCategory: ACCOUNT_TYPE_CATEGORY.investment_product,
    allowWithdrawal: false,
    allowWithdrawalWithFees: false,
    allowDeposit: true,
    canOverDraw: false
  },
  {
    id: 'f31dad46-dcc1-4474-8096-542838a56c60',
    name: 'BezoFlex',
    alias: "flexi-save",
    description: "Kudos! You have decided to take your financial journey a notch higher by choosing our BezoFlex savings option. We are here to support you all the way!   The BezoFlex savings option gives you the flexibility to create savings goals for your short-term financial goals. You can reach your savings goals at any time with BezoFlex. However, taking out your money before the goal ends will attract an early withdrawal fee of 3%. ",
    allowWithdrawal: false,
    allowWithdrawalWithFees: true,
    allowDeposit: true,
    canOverDraw: false,
    accountTypeCategory: ACCOUNT_TYPE_CATEGORY.core_product,
    withdrawalPeriod: 30,
    dailyLimit: 100000,
    monthlyLimit: 100000,
    withdrawalStartingCost: 2,
    withdrawalEndingCost: 5,
  },
  {
    id: 'bc77ced0-e811-4c41-861e-8820240dbb17',
    name: 'Bezo Lock',
    alias: "bezo-lock",
    description: "Bezo Lock is highest earning core product. Early liquidation attracts higher penalties",
    allowWithdrawal: false,
    allowWithdrawalWithFees: true,
    allowDeposit: true,
    canOverDraw: false,
    accountTypeCategory: ACCOUNT_TYPE_CATEGORY.core_product,
    withdrawalPeriod: 60,
    dailyLimit: 100000,
    monthlyLimit: 1000000,
    withdrawalStartingCost: 6,
    withdrawalEndingCost: 11,
  },
  {
    id: uuid(),
    name: 'LEDGER',
    alias: "ledger",
    description: "Internal Ledger account",
    allowWithdrawal: true,
    allowWithdrawalWithFees: false,
    allowDeposit: true,
    canOverDraw: true,
    accountTypeCategory: ACCOUNT_TYPE_CATEGORY.ledger,
    dailyLimit: 10000000,
    monthlyLimit: 100000000
  },

  {
    id: uuid(),
    name: 'Default Group',
    alias: "default_group",
    description: "Default Group Savings",
    allowWithdrawal: true,
    allowWithdrawalWithFees: false,
    allowDeposit: true,
    canOverDraw: false,
    accountTypeCategory: ACCOUNT_TYPE_CATEGORY.user_account,
    dailyLimit: 10000000,
    monthlyLimit: 100000000
  },
];



export const systemAccounts: AccountEntity[] = [
  {
    id: uuid(),
    accountTypeId: "",
    alias: "deposit_withdrawals",
    name: SYSTEM_ACCOUNT_TYPE.DEPOSIT_WITHDRAWALS,
    accountNumber: "10001000",
    userId: "",
    walletId: "",
    allowDeposit: true,
    allowWithdrawal: true,
    allowWithdrawalWithFees: false,
    canOverDraw: true
  },
  {
    id: uuid(),
    accountTypeId: "",
    alias: "early_withdrawal_fees",
    name: SYSTEM_ACCOUNT_TYPE.EARLY_WITHDRAWAL_FEES,
    accountNumber: "10002000",
    userId: "",
    walletId: "",
    allowDeposit: true,
    allowWithdrawal: false,
    allowWithdrawalWithFees: false,
    canOverDraw: false
  },
  {
    id: uuid(),
    accountTypeId: "",
    alias: "staff_allowances",
    name: SYSTEM_ACCOUNT_TYPE.STAFF_ALLOWANCES,
    accountNumber: "10003000",
    userId: "",
    walletId: "",
    allowDeposit: true,
    allowWithdrawal: true,
    allowWithdrawalWithFees: false,
    canOverDraw: true
  }

];



export const feeData: FeesEntity[] = [
  {
    feeType: FEE_TYPE.EARLY_WITHDRAWAL,
    value: 3,
    threshHoldValue: 3,
    feeFormat: FEE_FORMAT.PERCENTAGE,
    threshHoldFormat: FEE_FORMAT.PERCENTAGE,
    thresholdStartPoint: 0
  },
];

export const InterestData: InterestEntity[] = [
  {
    interestType: INTEREST_TYPE.BEZOFLEX,
    value: 1,
    threshHoldValue: 1,
    feeFormat: INTEREST_FORMAT.PERCENTAGE,
    threshHoldFormat: INTEREST_FORMAT.PERCENTAGE,
    thresholdStartPoint: 0
  },

  {
    interestType: INTEREST_TYPE.BEZOLOCK,
    value: 9,
    threshHoldValue: 9,
    feeFormat: INTEREST_FORMAT.PERCENTAGE,
    threshHoldFormat: INTEREST_FORMAT.PERCENTAGE,
    thresholdStartPoint: 0
  },
];

export const accountLevel: UserLevelEntity[] = [
  {
    level: LEVEL.beginner,
    withdrawalLimit: 200,
    depositLimit: 0,
    transferLimit: 100,
  },
  {
    level: LEVEL.intermediate,
    withdrawalLimit: 500,
    depositLimit: 0,
    transferLimit: 500,
  },
  {
    level: LEVEL.advance,
    withdrawalLimit: 5000,
    depositLimit: 0,
    transferLimit: 5000,
  },
];

 