import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class GroupDto {

  @ApiProperty({
    description:'Group Name',
    example:'Win night'
  }) name: string;


  @ApiProperty({
    description:'Group Description',
    example:'Birthday surprise'
  }) description: string;


  @IsUUID()
  @IsString()
  @ApiProperty({
    description: 'Account id',
    example: '53db32a8-2b4c-251d-4z2h-462v6a57s315',
    type: String,
    required: false,
  })
  accountId: string;

  @IsUUID()
  @IsString()
  @ApiProperty({
    description: 'Account id',
    example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
    type: String,
    required: false,
  })
  userId: string;

  @IsUUID()
  @IsString()
  @ApiProperty({
    description: 'Account id',
    example: '58v791sb-6n82-5b790-bs62-079vn525211v',
    type: String,
    required: false,
  })
  accountTypeId: string;

  @IsUUID()
  @IsString()
  @ApiProperty({
    description: 'Account id',
    example: '58v791sb-6n82-5b790-bs62-079vn525211v',
    type: String,
    required: false,
  })
  walletId: string;

  

}


export class GroupDtoInput extends OmitType(GroupDto,["accountId","userId"]){


}
  
  