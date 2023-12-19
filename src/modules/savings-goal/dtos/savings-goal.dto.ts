import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { AccountDto } from '../../account/dtos/account.dto';
import { GoalTypeDto } from './goal-type.dto';
import { FREQUENCY_TYPE } from '../../main/entities/enums/savingsfrequency.enum';
import { STATUS } from '../../main/entities/enums/status.enum';
import { WalletDto } from '../../wallet/dtos/wallet.dto';
import { DEPOSIT_PREFERENCE } from '../../main/entities/enums/deposittype.enum';
import { MandateCategory } from '../../enums/mandate.category.enum';

export class SavingsGoalDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    type: String,
  })
  id: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Account name',
    example: 'My Account',
    type: String,
  })
  name: string;

  
  @IsString()
  @ApiProperty({
    description: 'An emoji',
    example: '',
    type: String,
  })
  emoji?: string;

   
  @IsString()
  @ApiProperty({
    description: 'Savings Goal Account Type',
    example: 'flexi-save,bezo-lock"',
    type: String,
  })
  accountTypeAlias?: string;

  @IsString()
  @ApiProperty({
    description: 'Savings Goal Account Name',
    example: 'Flexi Save, Bezo Lock',
    type: String,
  })
  accountTypeName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Goal Status',
    example: 'TERMINATED | PENDING',
    type: String,
  })
  goalStatus?: string;


  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Description of the savings goal',
    example: 'purpose is to save to buy a car',
    type: String,
  })
  description?: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({
    description: 'Savings account',
    type: AccountDto,
  })
  account: AccountDto;

  @IsObject()
  @IsOptional()
  @ApiProperty({
    description: 'Savings account',
    type: WalletDto,
  })
  wallet: WalletDto;

  @IsObject()
  @ApiProperty({
    type: GoalTypeDto,
  })
  goalType: GoalTypeDto;

  @IsString()
  @ApiProperty({
    type: String,
  })
  userId: string;

  @IsNumber()
  @ApiProperty({
    description: 'Period in days for the savings goal',
    example: 10,
    type: Number,
  })
  period: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'Amount to save',
    example: 10,
    type: Number,
  })
  amountToSave?: number;


  @IsNotEmpty()
  @IsEnum(FREQUENCY_TYPE)
  @ApiProperty({
    description: 'Frequency of savings',
    example: FREQUENCY_TYPE.daily,
    enum: FREQUENCY_TYPE,
  })
  frequency: FREQUENCY_TYPE;

  @IsNotEmpty()
  @IsOptional()
  @IsEnum(DEPOSIT_PREFERENCE)
  @ApiProperty({
    description: 'Deduction Preference',
    example: DEPOSIT_PREFERENCE.automatic,
    enum: DEPOSIT_PREFERENCE,
  })
  preference?: DEPOSIT_PREFERENCE;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Amount of money to be saved',
    example: 100,
    type: Number,
  })
  amount: number;

  @IsBoolean()
  @ApiProperty({
    description: 'Whether the goal is active',
    example: true,
    type: Boolean,
  })
  lockSaving: boolean;

  @IsEnum(STATUS)
  @ApiProperty({
    description: 'Savings Goal Status',
    example: STATUS.enabled,
    enum: STATUS,
  })
  status: STATUS;

  @IsBoolean()
  @ApiProperty({
    description: 'Make this goal your favourite',
    example: true,
    type: Boolean,
  })
  isFavorite: boolean;

  

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Date you want to start contributing to the goal',
    example: '2020-12-12',
    type: Date,
  })
  startDate: Date | string;



  @IsDateString()
  @IsOptional()
  @ApiProperty({
    description: 'Date you want to start contributing to the goal',
    example: '2020-12-12',
    type: Date,
  })
  endDate?: Date | string;
}

export class SavingsGoalInputDto extends OmitType(SavingsGoalDto, [
  'id',
  'userId',
  'account',
  'goalType',
  'lockSaving',
  'status',
  'isFavorite',
  'wallet',
  'goalStatus'
]) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Wallet Id',
    example: '5f9f1c9c-7c1f-4b5c-8c1f-5c9c7c1f4b5c',
    type: String,
  })
  walletId: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Amount to saving frequently',
    example: 100,
    type: Number,
  })
  amountToSave: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Goal Type Id',
    example: '5f9f1c9c-7c1f-4b5c-8c1f-5c9c7sfwrderc',
    type: String,
  })
  goalTypeId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
      description: 'MOMO,BEZOPRIMARY',
      example: 'MOMO,BEZOPRIMARY',
      type: String,
  
  })
  category?: MandateCategory

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Account Type Id',
    example: '5adf43451c9c-7c1f-4b5c-8c1f-5c9c7c1f4b5c',
    type: String,
  })
  accountTypeId: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'When do you want to end the savings',
    example: '2020-12-12',
    type: Date,
  })
  endDate: Date | string;
}


export class SavingsGoalInputEditDto extends OmitType(SavingsGoalDto, [
  'id',
  'userId',
  'account',
  'goalType',
  'lockSaving',
  'status',
  'wallet',
  'goalStatus'
]) {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Wallet Id',
    example: '5f9f1c9c-7c1f-4b5c-8c1f-5c9c7c1f4b5c',
    type: String,
  })
  walletId: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Amount to saving frequently',
    example: 100,
    type: Number,
  })
  amountToSave: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Goal Type Id',
    example: '5f9f1c9c-7c1f-4b5c-8c1f-5c9c7sfwrderc',
    type: String,
  })
  goalTypeId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Account Type Id',
    example: '5adf43451c9c-7c1f-4b5c-8c1f-5c9c7c1f4b5c',
    type: String,
  })
  accountTypeId: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'When do you want to end the savings',
    example: '2020-12-12',
    type: Date,
  })
  endDate: Date | string;
}
