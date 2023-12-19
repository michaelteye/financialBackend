import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID, isUUID } from "class-validator";

export class SurveyDto{

    @IsString()
    @ApiProperty({
      description: 'customer satisfaction',
      example: 'best part of our system',
      type: String,
    })
    message: string;

    @IsString()
    @ApiProperty({
      type: String,
    })
    userId: string;
    
    @IsString()
    @ApiProperty({
        description: 'rating our platform',
        example: '10',
        type: Number,
        required: true,
    })
    rating: number;

    @IsString()
    @ApiProperty({
      description: 'provide an additional information related to the survey',
      example: 'I prefer the investment package is implemented',
      type: String,
    })
    additional_info: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
      description: 'Date of referral',
      example: '2022-12-16',
      type: String,
    })
    createdAt?: string;
}

export class SurveyEditDto extends  OmitType(SurveyDto,[
  'createdAt',
  'userId'
    ]){
}

    





 
