import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, isObject, IsString } from 'class-validator';
import { TRANSACTION_TYPE } from '../../enums/transaction-type.enum';
import { TRANSACTION_STATUS } from '../../enums/transaction.status';

export class TransactionRecordResponse {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Transaction amount',
    example: 1000,
    type: Number,
  })
  amount: number;

  // @IsString()
  // @IsNotEmpty()
  // @ApiProperty({
  //     description: 'Account number',
  //     example: "1010101",
  //     type: String,
  // })
  // accountNumber: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User id',
    example: '36747929-23-4-23-4',
    type: String,
  })
  userId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Unique transaction  reference',
    example: 'abacd-axk',
    type: String,
  })
  transactionId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'User transaction reference',
    example: '87878',
    type: String,
  })
  urserRef?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Phone number reference',
    example: '0244******',
    type: String,
  })
  senderPhone?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Phone number reference',
    example: '2332323',
    type: String,
  })
  recipientPhone?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Phone number reference',
    example: '2332323',
    type: String,
  })
  fromAccount?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Phone number reference',
    example: '2332323',
    type: String,
  })
  toAccountId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Transaction description from user',
    example: 'Withdrawal for airtime',
    type: String,
  })
  narration?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Platform type',
    example: 'web',
    type: String,
  })
  platform?: string;

  @ApiProperty({
    description: 'Transaction Data',
    example: {
      status: 'PENDING',
      message: 'Transaction is pending',
      reference: '47e17ed5-99a8-4359-9e7f-80d9331350fe'
    },
    type: Object,
  })
  transactionData?: {
    status: 'PENDING';
    message: 'Transaction is pending';
    reference: '47e17ed5-99a8-4359-9e7f-80d9331350fe';
  };

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Transaction type DEBIT/CREDIT/DEPOSIT/WITHDRAWAL/TRANSFER/INVESTMENT',
    example: `${TRANSACTION_TYPE.DEBIT} or ${TRANSACTION_TYPE.CREDIT}`,
    type: String,
  })
  transactionType: TRANSACTION_TYPE;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Transaction status',
    example: `${TRANSACTION_STATUS.SUCCESS} or ${TRANSACTION_STATUS.FAILED} or ${TRANSACTION_STATUS.PENDING}`,
    type: String,
  })
  transactionStatus: TRANSACTION_STATUS;
//
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Date of transaction',
    example: '2022-12-16',
    type: String,
  })
  createdAt?: String;
}
