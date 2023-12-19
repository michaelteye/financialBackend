import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { READNOTIFICATION } from '../../main/entities/enums/read.enum';

export class NotificationDto {
  @ApiProperty({
    description: 'title of the notification',
    example: 'title',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({
    description: 'message of the notification',
    example: 'message',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  readonly message: string;

  @IsString()
  @ApiProperty({
    type: String,
  })
  userId: string;

  @IsBoolean()
  @ApiProperty({
    description: 'read notification',
    example: true,
    type: Boolean,
  })
  isRead: boolean

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Date of notification',
    example: '2022-12-16',
    type: String,
  })
  createdAt?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'updated Date for notification',
    example: '2022-12-16',
    type: String,
  })
  updatedAt?: string;
}
