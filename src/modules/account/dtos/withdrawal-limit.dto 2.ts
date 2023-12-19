import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { WITHDRAWL_DAILY_LIMIT_TYPE } from '../../enums/withdrawal-limit-type.enum';

export class WithdrawalLimitDto {
  @IsUUID()
  @ApiProperty({
    type: String,
  })
  accountId: string;


  
  @IsNotEmpty()
  @IsEnum({ enum: WITHDRAWL_DAILY_LIMIT_TYPE })
  withdrawal_limit: WITHDRAWL_DAILY_LIMIT_TYPE;

  @IsNotEmpty()
  @IsEnum({ enum: WITHDRAWL_DAILY_LIMIT_TYPE })
  daily_limit: WITHDRAWL_DAILY_LIMIT_TYPE;

//   @IsString()
//   @ApiProperty({
//     description: 'Account name',
//     example: 'My Account',
//     type: String,
//   })
//   name: string;

  @IsNumber()
  @ApiProperty({
    description: 'total transaction amount',
    example: 10,
    type: Number,
  })
  total_transaction_amount: number;

  @IsNumber()
  @ApiProperty({
    description: 'customer daily limit',
    example: 10,
    type: Number,
  })
  customer_daily_limit: number;

  @IsNumber()
  @ApiProperty({
    description: 'customer daily limit',
    example: 10,
    type: Number,
  })
  amount: number;


  
  @IsNumber()
  @ApiProperty({
    description: 'minimum balance',
    example: 10,
    type: Number,
  })
  minimum_balance: number;

//   @IsNumber()
//   @ApiProperty({
//     description: 'maximum amount of money that can be withdrawn in a day',
//     example: 100,
//     type: Number,
//   })
//   dailyLimit: number;

//   @IsNumber()
//   @ApiProperty({
//     description: 'total amount of money that can be withdrawn in a month',
//     example: 100,
//     type: Number,
//   })
//   monthlyLimit: number;

//   @IsNumber()
//   @ApiProperty({
//     description: 'maximum percentage cost of withdrawal',
//     example: 100,
//     type: Number,
//   })
//   withdrawalStartingCost: number;

//   @IsNumber()
//   @ApiProperty({
//     description: 'minimum percentage cost of withdrawal',
//     example: 100,
//     type: Number,
//   })
//   withdrawalEndingCost: number;
}

export class WithdrawalLimitInputDto extends OmitType(WithdrawalLimitDto, ['withdrawal_limit',
'daily_limit',
'total_transaction_amount',
'customer_daily_limit',
'minimum_balance']) {}
