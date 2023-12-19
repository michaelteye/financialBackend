import { ApiProperty, OmitType } from '@nestjs/swagger';
import { PlATFORM } from '../../main/entities/enums/platform.enum';

import {
  IsEnum,
  isJSON,
  IsNotEmpty,
  IsNumber,
  isObject,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { AccountDto } from '../../account/dtos/account.dto';
import { Type } from 'class-transformer';

export enum NETWORK {
  mtn = 'MTN',
  vodafone = 'VODAFONE',
  airteltigo = 'AIRTELTIGO',
  glo = 'GLO',
}

export class VasDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Amount to transact with',
    example: 1000,
    type: Number,
  })
  amount: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'pin verification id',
    example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
    type: String,
    required: true,
  })
  verificationId: string;



  
  // @ValidateIf((v) =>  v.data.mobileNumber)
  // @IsPhoneNumber('GH')
  // @ApiProperty({
  //   description:
  //     'phone number is required ,phone number should start with 233',
  //   example: '233xxxxxxxx',
  //   type: String,
  //   required: false,
  // })
  // mobileNumber: string;
  


  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @ApiProperty({
    description: 'dynamic data',
    example: {billderId:'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',billerName:'artm',amount:50},
    type: Object,
  })
  data: object

  @IsUUID()
  @ApiProperty({
    description: 'UUID',
    example: 'UUID String',
    type: String,
  })
  billerId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Transaction Channel',
    example: 'web,usssd,android,ios',
    type: String,
    required: false,
  })
  channel?: PlATFORM;


  //   @IsString()
  // @IsOptional()
  // @ApiProperty({
  //   description: 'Airtime or Data',
  //   example: 'artm,data',
  //   type: String,
  //   required: true,
  // })
  // billerName: string;


  // @IsString()
  // @IsNotEmpty()
  // @ApiProperty({
  //   description: 'Type of Vas Transaction',
  //   example: 'airtime,data',
  //   type: String,
  //   required: false,
  // })
  // billerName: string;

}

// export class VasInputDto extends OmitType(VasDto, [
//   'userId',
//   'account'
// ]) {

//   @IsString()
//   @IsOptional()
//   @ApiProperty({
//     description: 'momo network',
//     example: 'vodafone or mtn or airteltigo',
//     type: String,
//     required: true,
//   })
//   network?: NETWORK;

//   @IsString()
//   @IsOptional()
//   @ApiProperty({
//     description: 'Transaction description',
//     example: 'Transfer to mummy',
//     type: String,
//     required: true,
//   })
//   description?: string;

// }
