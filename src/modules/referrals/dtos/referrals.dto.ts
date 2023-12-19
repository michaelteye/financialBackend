import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID, isUUID } from "class-validator";

export class ReferralDto{

    @IsString()
    @ApiProperty({
      description: 'Description of the referral',
      example: 'referral to a particular user',
      type: String,
    })
    code: string;

    @IsString()
    @ApiProperty({
      type: String,
    })
    userId: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
      description: 'Date of referral',
      example: '2022-12-16',
      type: String,
    })
    createdAt?: string;

}

export class ReferralInputDto{

  @IsUUID()
  code: string;

 
}