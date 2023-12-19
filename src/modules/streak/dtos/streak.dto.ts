import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
export class StreakRecordResponseDto{
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description:'containing the user id',
        example:'36747929-23-4-23-4',
        type:String
    })
    userId: string;
    @IsString()
    @IsOptional()
    @ApiProperty({
      description: 'Account id',
      example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
      type: String,
      required: false,
    })
    accountId?: string;
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
      description: 'Unique transaction  reference',
      example: 'abacd-axk',
      type: String,
    })
    transactionId: string;
    @IsBoolean()
    @ApiProperty({
        description: 'Make this goal your favourite',
        example: true,
        type: Boolean,
    })
    streak: boolean;
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
      description: 'Date of transaction',
      example: '2022-12-16',
      type: String,
    })
    createdAt?: string;
}
export class StreakRecordInputDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
      description:'containing the user id',
      example:'36747929-23-4-23-4',
      type:String
  })
  userId: string;
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Account id',
    example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
    type: String,
    required: false,
  })
  accountId?: string;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Transaction Id',
    example: 'abacd-axk',
    type: String,
  })
  transactionId: string;
  @IsBoolean()
  @ApiProperty({
      description: 'Make this goal your favourite',
      example: true,
      type: Boolean,
  })
  streak: boolean;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Date of transaction',
    example: '2022-12-16',
    type: String,
  })
  createdAt?: string;
}