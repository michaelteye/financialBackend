import { ApiProperty, OmitType } from '@nestjs/swagger';
import { PlATFORM } from '../../main/entities/enums/platform.enum';



import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString
} from 'class-validator';
import { AccountDto } from '../../account/dtos/account.dto';

export enum NETWORK {
  mtn = 'MTN',
  vodafone = 'VODAFONE',
  airteltigo = 'AIRTELTIGO',
  glo = 'GLO'
}

export class DepositDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Deposit amount',
    example: 1000,
    type: Number,
  })
  amount: number;




  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Account id',
    example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
    type: String,
    required: false,
  })
  accountId?: string;



  @IsObject()
  @IsOptional()
  @ApiProperty({
    description: 'Account',
    example: AccountDto,
    type: AccountDto,
  })
  account?: AccountDto;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'User id',
    example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
    type: String,
  })
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'pin verification id',
    example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
    type: String,
    required: true,
  })
  verificationId: string;


  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Transaction Channel',
    example: 'web,usssd,android,ios',
    type: String,
    required: false,
  })
  channel?: PlATFORM;
}

export class DepositInputDto extends OmitType(DepositDto, [
  'userId',
  'account'
]) {


  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'momo network',
    example: 'vodafone or mtn or airteltigo',
    type: String,
    required: true,
  })
  network?: NETWORK;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Transaction description',
    example: 'Transfer to mummy',
    type: String,
    required: true,
  })
  description?: string;
  
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Transaction description',
    example: 'Transfer to mummy',
    type: String,
    required: true,
  })
  createdAt?: string;
}
