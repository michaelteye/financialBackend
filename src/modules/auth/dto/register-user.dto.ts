import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, OmitType } from '@nestjs/swagger';

import { UserDto } from './user.dto';
import { PlATFORM } from '../../main/entities/enums/platform.enum'



export class RegisterUserInputDto extends OmitType(UserDto, ['id','bezoSource']) {
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    required: true,
  })
  occupation: string;


  @IsOptional()
  @ApiProperty({
    description: 'Transaction Channel',
    example: 'web,usssd,android,ios',
    default:PlATFORM.android,
    type: String,
    required: false,
  })
  channel?: PlATFORM


  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'where users head about BezoSusu',
    example: "twitter,instagram",
    default:"instragram",
  })
  bezoSource?: string;
}

export class migrateUserInputDto extends OmitType(UserDto, ['id','firstName','lastName','email','password','dateOfBirth','gender','country',
'network','email','documentType','homeAddress','gpsAddress','referralCode',
'bezoSource','userName','region','file']) {
 

}

export class RegisterResponseDto {
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    required: true,
  })
  token?: string;

  @IsNotEmpty()
  @ApiProperty({
    type: String,
    required: true,
  })
  refreshToken?: string;

  @IsOptional()
  @ApiProperty({
    type: Object,
    required: false,
  })
  message?: { type: string; text: string };
}
