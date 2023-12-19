import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { GENDER } from '../../enums/gender.enum';
import { SOCIAL } from '../../enums/social.enum';
import { ID_TYPE } from '../../fileupload/entities/file.entity';
import { FREQUENCY_TYPE } from '../../main/entities/enums/savingsfrequency.enum';


// Create Savings Goal
export class registerInputDto {

  @IsString()
  @ApiProperty({
    description: 'Mobile Number of Dialer',
    example: '23323445666',
    type: String,
  })
  mobileNumber: string;

  // @IsString()
  // @ApiProperty({
  //   description: 'How money will be deducted',
  //   example: 'Auto Deduction, Manual',
  //   type: String,
  // })
  // deductionMethod: string;
  
    @IsString()
  @ApiProperty({
    description: 'Id Number',
    example: '12482792',
    type: String,
  })
  idNumber: string;



  

  
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'unique user name',
    example: 'pat23new',
    type: String,
    required: false,
  })
  userName?: string;


  // @IsNumber()
  // @ApiProperty({
  //   description: 'Duration of Goal',
  //   example: "1 to 12 months (a year)",
  //   type: Number,
  // })
  // durationOfGoal: number;


  // Enter Bezo PIN
  @IsString()
  @ApiProperty({
    description: 'Enter Bezo PIN',
    example: "Four digit pin",
    type: String,
  })
  pin: string;


  @IsString()
  @ApiProperty({
    description: 'users first name',
    example: 'Joe',
    type: String,
    required: true,
  })
  firstName?: string;

  @IsString()
  @ApiProperty({
    description: 'users last name',
    example: 'Kumbungu',
    type: String,
    required: true,
  })
  lastName?: string;

  @ApiProperty({
    description: 'momo network',
    example: 'mtn, vodafone, airteltigo',
    type: String,
    required: false,
  })
  network?: string;


  @IsString()
  @ApiProperty({
    description: 'Date of Birth ',
    example: '2022-04-03',
    type: String,
    required: true,
  })
  dob?: string;

  @IsOptional()
  @IsEnum(SOCIAL)
  @ApiProperty({
    description: 'where users head about BezoSusu',
    example: SOCIAL.FACEBOOK,
    enum: SOCIAL,
    required: false,
  })
  bezoSource?: SOCIAL;

  @IsEnum(GENDER)
  @ApiProperty({
    description: 'user gender',
    example: GENDER.male,
    enum: GENDER,
    required: false,
  })
  gender: GENDER;


  @IsString()
  @ApiProperty({
    description: 'Id Card',
    example: 'Ghana Card',
    type: String,
    required: true,
  })
  idCardType?: string;

 
  // @IsEnum(ID_TYPE)
  // @ApiProperty({
  //   description: 'where users head about BezoSusu',
  //   example: ID_TYPE.GHANA_CARD,
  //   enum: ID_TYPE,
  //   required: false,
  // })
  // idCardType?: ID_TYPE;


}
