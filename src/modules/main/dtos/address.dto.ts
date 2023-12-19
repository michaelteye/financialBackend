import {
    IsDateString,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsPhoneNumber,
    IsString,
    MinLength,
    ValidateIf,
  } from 'class-validator';
  import { ApiProperty, OmitType } from '@nestjs/swagger';
  import { GENDER } from '../../enums/gender.enum';
  import { DOCUMENT_TYPE } from '../../main/entities/enums/document.enum';
  import { SOCIAL } from '../../enums/social.enum';
  import { NETWORK } from '../../transactions/dtos/deposit.dto';
  import { fi } from 'date-fns/locale';
  
  export class UserProfileUpdateDto {
    @IsOptional()
    @ApiProperty({
      description: 'users default id',
      type: String,
      required: true,
    })
    id?: string;
  
    @IsOptional()
    @ApiProperty({
      description: 'users last name',
      example: 'Kumbungu',
      type: String,
      required: true,
    })
    lastName?: string;
  

    @IsString()
    @IsOptional()
    @ApiProperty({
      description: 'users home address',
      example: 'Number 21 street name , Kasoa, Ghana',
      type: String,
      required: false,
    })
    homeAddress?: string;
  
    @IsString()
    @IsOptional()
    @ApiProperty({
      description: 'this is the local ghana post address',
      example: 'GHP-234234-345234',
      type: String,
      required: false,
    })
    gpsAddress?: string;
  
    @IsOptional()
    @ApiProperty({
      description: 'Ghana country code',
      example: 'GH',
      type: String,
      required: true,
    })
    country?: string;
  
    @IsString()
    @IsOptional()
    @ApiProperty({
      description: 'users region of residence',
      example: 'Ashanti Region',
      type: String,
      required: false,
    })
    region?: string;
  


  }


