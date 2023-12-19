import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { PlATFORM } from '../../main/entities/enums/platform.enum';
import { NETWORK } from '../../transactions/dtos/deposit.dto';



// Deposit
export class WithdrawalDto {


  @IsString()
  @ApiProperty({
    description: 'Mobile Number of Dialer',
    example: '23323445666',
    type: String,
  })
  mobileNumber: string;


  @IsString()
  @ApiProperty({
    description: 'Mobile network of Dialer',
    example: 'MTN',
    type: String,
  })
  network: NETWORK;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Deposit amount',
    example: 1000,
    type: Number,
  })
  amount: number;


  // Enter Bezo PIN
    @IsString()
    @ApiProperty({
      description: 'Enter Bezo PIN',
      example: "Four digit pin",
      type: String,
    })
    pin: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
      description: 'Account id',
      example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
      type: String,
      required: false,
    })
    accountId?: string;


  



}
