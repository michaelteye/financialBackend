import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';



// Deposit
export class PinInputDto {
   
  
    @IsString()
    @ApiProperty({
      description: 'Mobile Number of Dialer',
      example: '23323445666',
      type: String,
    })
    mobileNumber: string;

    
    // Enter Bezo PIN
    @IsNumber()
    @ApiProperty({
      description: 'Enter Bezo PIN',
      example: "Four digit pin",
      type: Number,
    })
    pin: number;


    @IsNumber()
    @ApiProperty({
      description: 'Enter Bezo PIN',
      example: "Four digit pin",
      type: Number,
    })
    oldpin: number;

  }

  export class UserPinDto {
    // @IsPositive()
    @IsNotEmpty()
    @ApiProperty({
      description: 'user pin should be at least 4 characters long',
      example: '12345',
      required: true,
    })
    userPin: string;
  }
  
