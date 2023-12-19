import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { GroupMemberRole } from '../enums/group-member';

export class AddGroupMemberDto {


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


  


  @IsOptional()
  @IsEnum({ enum: GroupMemberRole, default: GroupMemberRole.CONTRIBUTOR })
  role?: GroupMemberRole;

  // @IsUUID()
  // @IsString()
  // @ApiProperty({
  //   description: 'Account id',
  //   example: '58v791sb-6n82-5b790-bs62-079vn525211v',
  //   type: String,
  //   required: false,
  // })
  // accountTypeId: string;


}


// export class AddGroupMemberDtoInput extends OmitType(GroupDto,["accountId"]){

// }
  
  