import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { FREQUENCY_TYPE } from "src/modules/main/entities/enums/savingsfrequency.enum";

export class CreateMandateDto {

    @IsString()
    @ApiProperty({
        description: 'Phone number',
        example: '233241231234',
        type: String,
        required: true,
    })
    phoneNumber: string;

    @IsString()
    @ApiProperty({
        description: 'Amount to deduct',
        example: '20',
        type: Number,
        required: true,
    })
    amount: number;

    @IsString()
    @ApiProperty({
        description: 'Start date',
        example: 'Daily, Weekly, Monthly',
        type: String,
        required: true,
    })
    frequency: FREQUENCY_TYPE;


    @IsString()
    @ApiProperty({
        description: 'Account Id of savings goal',
        example: 'abc-abd',
        type: String,
        required: true,
    })
    accountId: string;

    // @IsString()
    // @ApiProperty({
    //     description: 'Day to start debiting',
    //     example: 'Monday,Tuesday',
    //     type: String,
    //     required: true,
    // })
    // debitDay: string;

    @IsString()
    @ApiProperty({
        description: 'Start date',
        example: '2023-07-03',
        type: String,
        required: true,
    })
    startDate: string | Date

    @IsString()
    @ApiProperty({
        description: 'End date',
        example: '2023-07-03',
        type: String,
        required: true,
    })
    endDate: string | Date
}


export class UserMandateListItemDto {
    phoneNumber: string;
    savingsGoalName: string;
    accountName: string;
    accountId: string;
    mandateId: string;
    amount: number;
    frequency: string;
    startDate: string;
    endDate: string;
}