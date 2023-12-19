import { ApiProperty } from "@nestjs/swagger";
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn";


export class AdminRoleTypeDto {
  @PrimaryGeneratedColumn('uuid')
  id?: string;
    
  @ApiProperty({
    description: 'CanDeleteUser',
    example: 'CanDeleteUser',
    type: String,
  })
   roleName: string;
  

   @ApiProperty({
    description: 'Delete User',
    example: 'Delete a User',
    type: String,
  })
    description: string;
  }

 