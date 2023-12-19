import { IsEnum, IsNotEmpty } from "class-validator";
import { INTEREST_STATUS_TYPE } from "../enums/interest-status.enum";
import { ApiProperty } from "@nestjs/swagger";

export class DailyInterestPaymentDto {
    accountId: string;
    amount: number;
    phone : string;
    narration: string;
    reference: string;
    userId:string;
    name: string
    
  @IsNotEmpty()
  @IsEnum(INTEREST_STATUS_TYPE)
  @ApiProperty({
    description: 'Frequency of savings',
    example: INTEREST_STATUS_TYPE.PENDING,
    enum: INTEREST_STATUS_TYPE,
  })
  paymentStatus: INTEREST_STATUS_TYPE;

  }
  
  