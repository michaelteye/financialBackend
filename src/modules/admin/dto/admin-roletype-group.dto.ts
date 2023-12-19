import { ApiProperty } from "@nestjs/swagger";
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn";


export class AdminRoleTypeGroupDto {
  @PrimaryGeneratedColumn('uuid')
  id?: string;
    
  @ApiProperty({
    description: '',
    example: '',
    type: String,
  })
   groupId: string;
  

   @ApiProperty({
    description: '',
    example: '',
    type: String,
  })
  roleId: string;
  }

 