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
  
  export class UserNextOfKinDto {
    @IsOptional()
    @ApiProperty({
      description: 'users default id',
      type: String,
      required: true,
    })
    id?: string;
  
    @IsOptional()
    @ApiProperty({
      description: 'users first name',
      example: 'Joe',
      type: String,
      required: true,
    })
    firstName?: string;
  
    @IsOptional()
    @ApiProperty({
      description: 'users last name',
      example: 'Kumbungu',
      type: String,
      required: true,
    })
    lastName?: string;
  
    @ValidateIf((o) => o.email == undefined || o.phone)
    @IsPhoneNumber('GH')
    @IsNotEmpty()
    @ApiProperty({
      description:
        'you can use either phone or email but not both at the same time, users phone number should start with 233',
      example: '233xxxxxxxx',
      type: String,
      required: false,
    })
    phone?: string;
    
    @IsDateString()
    @IsOptional()
    @ApiProperty({
      description: 'date of birth',
      example: '1990-01-01',
      type: Date,
      required: false,
    })
    dateOfBirth?: Date | string;
  
    @IsEnum(GENDER)
    @ApiProperty({
      description: 'user gender',
      example: GENDER.male,
      enum: GENDER,
      required: false,
    })
    gender: GENDER;

    
  
  
  
    // street address
    // digital address
    // country
    // region
  
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
    @ApiProperty({
      type: String,
    })
    userId: String;

  
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
  
    @IsString()
    @IsOptional()
    @ApiProperty({
      description: 'relationship to next of king',
      example: 'sister, brother',
      type: String,
      required: false,
    })
    relationship?: string;
  
    @IsString()
    @IsOptional()
    @ApiProperty({
      description: 'current work',
      example: 'Software Engineer, Student, Teacher',
      type: String,
      required: false,
    })
    occupation?: string;

  
    @ApiProperty({
      description: 'momo network',
      example: 'mtn, vodafone, airteltigo',
      type: String,
      required: false,
    })
    network?: string; 
  }
  
export class UserNextOfKinInputEditDto extends OmitType(UserNextOfKinDto,[
  // 'relationship',
  'userId',
  'id'
]){

}
 
  
  
  