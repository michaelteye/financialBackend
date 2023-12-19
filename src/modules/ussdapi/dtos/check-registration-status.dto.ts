import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID } from 'class-validator';
import { FREQUENCY_TYPE } from '../../main/entities/enums/savingsfrequency.enum';


// Create Savings Goal
export class checkRegistrationDto {

  @IsString()
  @ApiProperty({
    description: 'Mobile Number of Dialer',
    example: '23323445666',
    type: String,
  })
  mobileNumber: string;

}


