import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { GroupMemberRole } from '../enums/group-member';

export class AddGroupSavingMemberDto {


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
    example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
    type: String,
    required: false,
  })
  groupId: string;

  @IsUUID()
  @IsString()
   @ApiProperty({
     description: 'Account id',
     example: 'b3d9c1a0-5b9c-4b1d-8c1a-0b9c4b1d8c1a',
     type: String,
     required: false,
   })
   groupSavingsGoalId: string;


 

  


  


}


// export class AddGroupMemberDtoInput extends OmitType(GroupDto,["accountId"]){

// }
  
  