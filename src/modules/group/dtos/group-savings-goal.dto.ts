import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { SavingsGoalInputDto } from "../../savings-goal/dtos/savings-goal.dto";



// export class SavingsGoalInputDto extends OmitType(SavingsGoalDto, [
//     'id',
//     'userId',
//     'account',
//     'goalType',
//     'lockSaving',
//     'status',
//     'isFavorite',
//     'wallet',
//     'goalStatus'
//   ]) {
export class GroupSavingsGoalInputDto  extends SavingsGoalInputDto {


  
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
      description: 'Group Id',
      example: '5f9f1c9c-7c1f-4b5c-8c1f-5c9c7c1f4b5c',
      type: String,
    })
    groupId: string;
  
   
  }

  