import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,

  IsEnum,

  IsNotEmpty,

  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateIf,
} from 'class-validator';
import { NETWORK } from '../../main/entities/enums/network.enum';
import { PAYMENT_TYPE } from '../../main/entities/enums/paymenttype.enum';

// import { NETWORK } from '../../main/entities/enums/network.enum';

export class PaymentMethodDto {
 // @ValidateIf((v) => !v.email && v.phone_number)
  @IsPhoneNumber('GH')
  @ApiProperty({
    description:
      'phone number is optional when email is passed,phone number should start with 233',
    example: '233xxxxxxxx',
    type: String,
    required: false,
  })
  phone_number?: string;

  // @IsOptional()
  // @IsString()
  // @ApiProperty({
  //   description: 'Account name',
  //   example: 'My Account',
  //   type: String,
  // })
  // name?: string;

  // @IsString()
  // @IsNotEmpty()
  // @ApiProperty({
  //   description: 'pin verification id',
  //   example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
  //   type: String,
  //   required: true,
  // })
  // verificationId: string;



  @IsString()
  @ApiProperty({
    description: 'OTP sent to user phone',
    example: '123456',
    type: String,
  })
  otp: string;


  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Description of the savings goal',
    example: 'purpose is to save to buy a car',
    type: String,
  })
  accountNumber?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Description of the savings goal',
    example: 'purpose is to save to buy a car',
    type: String,
  })
  bank?: string;


  @IsOptional()
  @IsEnum(NETWORK)
  @ApiProperty({
    description: 'Mobile Networks in Ghana',
    example: 'mtn, vodafone,airtel_tigo,glo',
    enum: NETWORK,
  })
  network?: NETWORK;

  @IsOptional()
  @IsEnum(PAYMENT_TYPE)
  @ApiProperty({
    description: 'types are mobile_money,bank_transaction',
    example: "mobile_money,bank_transaction",
    enum: PAYMENT_TYPE,
  })
  paymentType?: PAYMENT_TYPE;




  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    type: Boolean,
  })
  default: boolean;


  




  
}

