import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUUID } from 'class-validator';
import { FREQUENCY_TYPE } from '../../main/entities/enums/savingsfrequency.enum';


// Create Savings Goal
export class CreateSavingsGoalDto {

  @IsString()
  @ApiProperty({
    description: 'Mobile Number of Dialer',
    example: '23323445666',
    type: String,
  })
  mobileNumber: string;

  @IsString()
  @ApiProperty({
    description: 'How money will be deducted',
    example: 'automatic, manual',
    type: String,
  })
  deductionMethod: string;

  @IsString()
  @ApiProperty({
    description: 'Goal Type ID',
    example: 'Fees, Rent, Emergency, Business',
    type: String,
  })
  goalTypeId: string;

  @IsString()
  @ApiProperty({
    description: 'Account Type ID',
    example: 'Bezo Lock, Flexi Save',
    type: String,
  })
  accountTypeId: string;


  @IsString()
  @ApiProperty({
    description: 'Name of Goal',
    example: "My rent",
    type: String,
  })
  nameOfGoal: string;

  @IsString()
  @ApiProperty({
    description: 'Description of Goal',
    example: "My rent is dying",
    type: String,
  })
  description: string;


  @IsNumber()
  @ApiProperty({
    description: 'Duration of Goal',
    example: "1 to 12 months (a year)",
    type: Number,
  })
  durationOfGoal: number;


  @IsString()
  @ApiProperty({
    description: 'How often do you want to save',
    example: "Daily, Weekly, Monthly",
    type: String,
  })
  saveFrequency: string;


  @IsNumber()
  @ApiProperty({
    description: 'Total target for savings goals',
    example: "20000",
    type: Number,
  })
  goalAmount: number;

  @IsNumber()
  @ApiProperty({
    description: 'Amoount to deduct daily or weekly or monthly',
    example: "20000",
    type: Number,
  })
  amountToSave: number;

  @IsString()
  @ApiProperty({
    description: 'Start Date of savings Goal',
    example: "2022-11-29",
    type: String
  })
  startDate: string;

  // Enter Bezo PIN
  @IsString()
  @ApiProperty({
    description: 'Enter Bezo PIN',
    example: "Four digit pin",
    type: String,
  })
  pin: string;

}


export class deleteSavingsGoalDto {

  @IsString()
  @ApiProperty({
    description: 'Mobile Number of Dialer',
    example: '23323445666',
    type: String,
  })
  mobileNumber: string;


  @IsString()
  @ApiProperty({
    description: 'Goal Type ID',
    example: 'Fees, Rent, Emergency, Business',
    type: String,
  })
  goalId: string;


  // Enter Bezo PIN
  @IsString()
  @ApiProperty({
    description: 'Enter Bezo PIN',
    example: "Four digit pin",
    type: String,
  })
  pin: string;

}
