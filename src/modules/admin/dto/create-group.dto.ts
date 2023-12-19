import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateGroupDto {
    
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    required: true,
  })
  groupName: string;


  
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    required: true,
  })
    groupDescription: string;
  }